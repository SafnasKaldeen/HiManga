import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import re
import csv
from datetime import datetime

def get_expected_panel_count(url):
    """
    Get the expected number of panels from the chapter page.
    Returns: (expected_count, error_message)
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.mangaread.org/',
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        images = soup.select('.page-break.no-gaps img')
        
        return len(images), ""
    except Exception as e:
        return 0, str(e)


def scrape_chapter(url, output_folder, metadata_csv_path=None, manga_name="One Piece", update_immediately=False):
    """
    Scrape a single chapter using Beautiful Soup.
    Returns: (panel_count, success_status, error_message, expected_count)
    """
    print(f"\nFetching page: {url}")
    
    # Create output folder
    os.makedirs(output_folder, exist_ok=True)
    
    # Extract chapter number from folder name
    chapter_match = re.search(r'chapter-(\d+)', output_folder)
    chapter_num = int(chapter_match.group(1)) if chapter_match else 0
    
    # Headers to mimic a browser
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.mangaread.org/',
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find images only in page-break no-gaps class
        images = soup.select('.page-break.no-gaps img')
        expected_count = len(images)
        
        print(f"Found {expected_count} images in .page-break.no-gaps")
        
        # Keep order, use list instead of set
        image_urls = []
        for img in images:
            # Try different attributes where image URL might be stored
            img_url = (img.get('src') or 
                      img.get('data-src') or 
                      img.get('data-lazy-src') or
                      img.get('data-original'))
            
            if img_url:
                # Strip whitespace/newlines from URL
                img_url = img_url.strip()
                # Convert relative URLs to absolute
                full_url = urljoin(url, img_url)
                image_urls.append(full_url)
        
        print(f"Found {len(image_urls)} image URLs")
        
        if not image_urls:
            print("✗ No images found")
            if update_immediately and metadata_csv_path:
                update_single_chapter_metadata(metadata_csv_path, manga_name, chapter_num, 0, expected_count, 'failed', 'No images found')
            return 0, False, "No images found", expected_count
        
        # Download images in order
        downloaded_count = 0
        for idx, img_url in enumerate(image_urls, 1):
            try:
                print(f"Downloading image {idx}/{len(image_urls)}: {img_url[:80]}...")
                
                img_response = requests.get(img_url, headers=headers, timeout=10)
                img_response.raise_for_status()
                
                # Get file extension from URL
                ext = os.path.splitext(urlparse(img_url).path)[1] or '.jpg'
                filename = f"panel-{idx:03d}{ext}"
                filepath = os.path.join(output_folder, filename)
                
                with open(filepath, 'wb') as f:
                    f.write(img_response.content)
                
                print(f"✓ Saved: {filename}")
                downloaded_count += 1
                time.sleep(0.5)  # Be polite, don't hammer the server
                
            except Exception as e:
                print(f"✗ Failed to download {img_url}: {e}")
        
        print(f"✓ Done! {downloaded_count}/{expected_count} images saved to: {output_folder}")
        
        # Update metadata immediately if requested
        if update_immediately and metadata_csv_path:
            status = 'success' if downloaded_count == expected_count else 'partial'
            error_msg = '' if downloaded_count == expected_count else f'Downloaded {downloaded_count}/{expected_count}'
            update_single_chapter_metadata(metadata_csv_path, manga_name, chapter_num, downloaded_count, expected_count, status, error_msg)
        
        return downloaded_count, downloaded_count == expected_count, "", expected_count
        
    except Exception as e:
        error_msg = str(e)
        print(f"✗ Error: {error_msg}")
        if update_immediately and metadata_csv_path:
            update_single_chapter_metadata(metadata_csv_path, manga_name, chapter_num, 0, 0, 'failed', error_msg)
        return 0, False, error_msg, 0


def update_single_chapter_metadata(metadata_csv_path, manga_name, chapter_num, panel_count, expected_count, status, error_msg=''):
    """Update metadata for a single chapter immediately after download"""
    if not os.path.exists(metadata_csv_path):
        # Create new file
        with open(metadata_csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['manga_name', 'chapter_number', 'panel_count', 'expected_count', 'status', 'timestamp', 'error'])
            writer.writerow([manga_name, chapter_num, panel_count, expected_count, status, datetime.now().isoformat(), error_msg])
        return
    
    # Read existing metadata
    rows = []
    chapter_exists = False
    with open(metadata_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        for row in reader:
            if int(row['chapter_number']) == chapter_num:
                # Update existing row
                row['panel_count'] = panel_count
                row['expected_count'] = expected_count
                row['status'] = status
                row['timestamp'] = datetime.now().isoformat()
                row['error'] = error_msg
                chapter_exists = True
            rows.append(row)
    
    # Write back
    with open(metadata_csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
        
        # Add new row if chapter didn't exist
        if not chapter_exists:
            writer.writerow({
                'manga_name': manga_name,
                'chapter_number': chapter_num,
                'panel_count': panel_count,
                'expected_count': expected_count,
                'status': status,
                'timestamp': datetime.now().isoformat(),
                'error': error_msg
            })


def get_all_chapters():
    """Get list of all One Piece chapters from the main manga page"""
    manga_url = "https://www.mangaread.org/manga/one-piece/"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    }
    
    print(f"Fetching chapter list from: {manga_url}")
    
    try:
        response = requests.get(manga_url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find all chapter links
        chapter_links = []
        links = soup.select('ul.main li a')
        
        print(f"Found {len(links)} chapter links")
        
        for link in links:
            href = link.get('href')
            if href and '/chapter-' in href:
                # Extract chapter number
                match = re.search(r'chapter-(\d+)', href)
                if match:
                    chapter_num = int(match.group(1))
                    full_url = urljoin(manga_url, href)
                    chapter_links.append({
                        'url': full_url,
                        'number': chapter_num,
                        'text': link.get_text(strip=True)
                    })
        
        # Remove duplicates and sort by chapter number
        unique_chapters = {ch['number']: ch for ch in chapter_links}
        sorted_chapters = sorted(unique_chapters.values(), key=lambda x: x['number'])
        
        print(f"✓ Found {len(sorted_chapters)} unique chapters")
        if sorted_chapters:
            print(f"  First: Chapter {sorted_chapters[0]['number']}")
            print(f"  Last: Chapter {sorted_chapters[-1]['number']}")
        
        return sorted_chapters
        
    except Exception as e:
        print(f"✗ Error fetching chapter list: {e}")
        return []


def verify_chapter(chapter_folder, chapter_url, expected_panels_from_metadata=None):
    """
    Verify a chapter folder has the correct number of panels.
    Fetches expected count from web if needed.
    Returns: (actual_panel_count, expected_panel_count, is_valid, issue_description)
    """
    if not os.path.exists(chapter_folder):
        return 0, 0, False, "Folder doesn't exist"
    
    # Count panel files
    panel_files = [f for f in os.listdir(chapter_folder) 
                   if f.startswith('panel-') and os.path.isfile(os.path.join(chapter_folder, f))]
    
    actual_count = len(panel_files)
    
    if actual_count == 0:
        return 0, expected_panels_from_metadata or 0, False, "No panels found"
    
    # Get expected count from web
    expected_count, error = get_expected_panel_count(chapter_url)
    
    if error:
        # If we can't fetch from web, use metadata if available
        if expected_panels_from_metadata:
            expected_count = expected_panels_from_metadata
        else:
            return actual_count, 0, False, f"Cannot verify: {error}"
    
    # Check panel count matches
    if actual_count != expected_count:
        return actual_count, expected_count, False, f"Panel count mismatch: expected {expected_count}, got {actual_count}"
    
    # Check for gaps in numbering (1 to N with no gaps)
    panel_numbers = []
    for f in panel_files:
        match = re.search(r'panel-(\d+)', f)
        if match:
            panel_numbers.append(int(match.group(1)))
    
    panel_numbers.sort()
    expected_sequence = list(range(1, expected_count + 1))
    
    if panel_numbers != expected_sequence:
        return actual_count, expected_count, False, f"Panel numbering has gaps or wrong numbers"
    
    return actual_count, expected_count, True, ""


def verify_chapter_local(chapter_folder, expected_panels_from_metadata):
    """
    Verify a chapter folder using metadata only (no web fetch).
    Returns: (actual_panel_count, expected_panel_count, is_valid, issue_description)
    """
    if not os.path.exists(chapter_folder):
        return 0, expected_panels_from_metadata, False, "Folder doesn't exist"
    
    # Count panel files
    panel_files = [f for f in os.listdir(chapter_folder) 
                   if f.startswith('panel-') and os.path.isfile(os.path.join(chapter_folder, f))]
    
    actual_count = len(panel_files)
    
    if actual_count == 0:
        return 0, expected_panels_from_metadata, False, "No panels found"
    
    if expected_panels_from_metadata is None or expected_panels_from_metadata == 0:
        return actual_count, 0, False, "No expected count in metadata"
    
    # Check panel count matches
    if actual_count != expected_panels_from_metadata:
        return actual_count, expected_panels_from_metadata, False, f"Panel count mismatch: expected {expected_panels_from_metadata}, got {actual_count}"
    
    # Check for gaps in numbering
    panel_numbers = []
    for f in panel_files:
        match = re.search(r'panel-(\d+)', f)
        if match:
            panel_numbers.append(int(match.group(1)))
    
    panel_numbers.sort()
    expected_sequence = list(range(1, expected_panels_from_metadata + 1))
    
    if panel_numbers != expected_sequence:
        return actual_count, expected_panels_from_metadata, False, "Panel numbering has gaps"
    
    return actual_count, expected_panels_from_metadata, True, ""


def verify_all_chapters(base_path, metadata_csv_path):
    """
    Verify all chapters against web source and update metadata.
    Returns list of chapters that need re-downloading.
    """
    # ANSI color codes
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RESET = '\033[0m'
    
    print(f"\n{'='*60}")
    print("VERIFYING ALL CHAPTERS (fetching from web)")
    print(f"{'='*60}\n")
    
    chapters_to_redownload = []
    
    # Load metadata
    metadata = {}
    if os.path.exists(metadata_csv_path):
        with open(metadata_csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                chapter_num = int(row['chapter_number'])
                metadata[chapter_num] = {
                    'panel_count': int(row['panel_count']),
                    'expected_count': int(row.get('expected_count', row['panel_count'])),
                    'status': row['status']
                }
    
    print(f"Loaded metadata for {len(metadata)} chapters")
    
    # Get all chapters from web
    all_chapters = get_all_chapters()
    chapter_urls = {ch['number']: ch['url'] for ch in all_chapters}
    
    # Get all chapter folders
    chapter_folders = [d for d in os.listdir(base_path) 
                      if d.startswith('chapter-') and os.path.isdir(os.path.join(base_path, d))]
    
    # Sort by chapter number (not alphabetically)
    def get_chapter_num(folder_name):
        match = re.search(r'chapter-(\d+)', folder_name)
        return int(match.group(1)) if match else 0
    
    chapter_folders.sort(key=get_chapter_num)
    
    print(f"Found {len(chapter_folders)} chapter folders\n")
    print(f"Starting verification... (this may take a while)\n")
    
    issues_found = 0
    updated_metadata = []
    checked_count = 0
    
    for folder in chapter_folders:
        chapter_match = re.search(r'chapter-(\d+)', folder)
        if not chapter_match:
            continue
        
        chapter_num = int(chapter_match.group(1))
        chapter_path = os.path.join(base_path, folder)
        chapter_url = chapter_urls.get(chapter_num)
        
        checked_count += 1
        
        if not chapter_url:
            print(f"{YELLOW}⚠ Chapter {chapter_num}: URL not found, skipping verification{RESET}")
            continue
        
        expected_from_metadata = metadata.get(chapter_num, {}).get('expected_count')
        
        # Print progress indicator
        print(f"[{checked_count}/{len(chapter_folders)}] Checking Chapter {chapter_num}...", end=' ')
        
        actual_count, expected_count, is_valid, issue = verify_chapter(
            chapter_path, chapter_url, expected_from_metadata
        )
        
        # Store updated metadata
        if expected_count > 0:
            updated_metadata.append({
                'chapter_num': chapter_num,
                'actual_count': actual_count,
                'expected_count': expected_count,
                'status': 'success' if is_valid else 'incomplete'
            })
        
        if not is_valid:
            issues_found += 1
            print(f"{RED}✗ {issue} (has {actual_count}, expected {expected_count}){RESET}")
            chapters_to_redownload.append(chapter_num)
        else:
            # Print success message with green color
            if expected_count != expected_from_metadata:
                print(f"{GREEN}✓ OK ({actual_count} panels) - Metadata updated{RESET}")
            else:
                print(f"{GREEN}✓ OK ({actual_count} panels){RESET}")
        
        time.sleep(0.5)  # Be polite to the server
    
    print(f"\n{'='*60}")
    print(f"VERIFICATION SUMMARY")
    print(f"{'='*60}")
    print(f"Total chapters checked: {len(chapter_folders)}")
    print(f"Issues found: {issues_found}")
    print(f"Chapters to re-download: {len(chapters_to_redownload)}")
    if chapters_to_redownload:
        print(f"Chapter numbers: {', '.join(map(str, sorted(set(chapters_to_redownload))))}")
    print(f"{'='*60}\n")
    
    # Update metadata CSV with corrected expected counts
    if updated_metadata:
        update_choice = input("Update metadata CSV with verified expected counts? (yes/no): ")
        if update_choice.lower() in ['yes', 'y']:
            update_metadata_with_expected_counts(metadata_csv_path, updated_metadata)
            print("✓ Metadata updated")
    
    return list(set(chapters_to_redownload))


def update_metadata_with_expected_counts(metadata_csv_path, updated_data):
    """Update the metadata CSV with corrected expected panel counts"""
    if not os.path.exists(metadata_csv_path):
        return
    
    # Read existing metadata
    rows = []
    with open(metadata_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        # Add expected_count column if it doesn't exist
        if 'expected_count' not in fieldnames:
            fieldnames = list(fieldnames)
            fieldnames.insert(3, 'expected_count')
        
        for row in reader:
            rows.append(row)
    
    # Update rows with new data
    update_dict = {item['chapter_num']: item for item in updated_data}
    
    for row in rows:
        chapter_num = int(row['chapter_number'])
        if chapter_num in update_dict:
            row['expected_count'] = update_dict[chapter_num]['expected_count']
            row['panel_count'] = update_dict[chapter_num]['actual_count']
            row['status'] = update_dict[chapter_num]['status']
    
    # Write back
    with open(metadata_csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def verify_all_chapters_local(base_path, metadata_csv_path):
    """
    Verify all chapters using metadata only (no web checks).
    Returns list of chapters that need re-downloading.
    """
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RESET = '\033[0m'
    
    print(f"\n{'='*60}")
    print("VERIFYING ALL CHAPTERS (using metadata)")
    print(f"{'='*60}\n")
    
    chapters_to_redownload = []
    
    # Load metadata
    metadata = {}
    if os.path.exists(metadata_csv_path):
        with open(metadata_csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                chapter_num = int(row['chapter_number'])
                metadata[chapter_num] = {
                    'panel_count': int(row['panel_count']),
                    'expected_count': int(row.get('expected_count', row['panel_count'])),
                    'status': row['status']
                }
    else:
        print(f"{RED}✗ Metadata file not found: {metadata_csv_path}{RESET}")
        return []
    
    print(f"Loaded metadata for {len(metadata)} chapters\n")
    
    # Get all chapter folders
    chapter_folders = [d for d in os.listdir(base_path) 
                      if d.startswith('chapter-') and os.path.isdir(os.path.join(base_path, d))]
    
    # Sort by chapter number (not alphabetically)
    def get_chapter_num(folder_name):
        match = re.search(r'chapter-(\d+)', folder_name)
        return int(match.group(1)) if match else 0
    
    chapter_folders.sort(key=get_chapter_num)
    
    print(f"Found {len(chapter_folders)} chapter folders\n")
    
    issues_found = 0
    checked_count = 0
    
    for folder in chapter_folders:
        chapter_match = re.search(r'chapter-(\d+)', folder)
        if not chapter_match:
            continue
        
        chapter_num = int(chapter_match.group(1))
        chapter_path = os.path.join(base_path, folder)
        
        checked_count += 1
        
        expected_from_metadata = metadata.get(chapter_num, {}).get('expected_count')
        
        if expected_from_metadata is None or expected_from_metadata == 0:
            print(f"[{checked_count}/{len(chapter_folders)}] {YELLOW}⚠ Chapter {chapter_num}: No metadata, skipping{RESET}")
            continue
        
        print(f"[{checked_count}/{len(chapter_folders)}] Checking Chapter {chapter_num}...", end=' ')
        
        actual_count, expected_count, is_valid, issue = verify_chapter_local(
            chapter_path, expected_from_metadata
        )
        
        if not is_valid:
            issues_found += 1
            print(f"{RED}✗ {issue}{RESET}")
            chapters_to_redownload.append(chapter_num)
        else:
            print(f"{GREEN}✓ OK ({actual_count} panels){RESET}")
    
    print(f"\n{'='*60}")
    print(f"VERIFICATION SUMMARY")
    print(f"{'='*60}")
    print(f"Total chapters checked: {checked_count}")
    print(f"Issues found: {issues_found}")
    print(f"Chapters to re-download: {len(chapters_to_redownload)}")
    if chapters_to_redownload:
        print(f"Chapter numbers: {', '.join(map(str, sorted(set(chapters_to_redownload))))}")
    print(f"{'='*60}\n")
    
    return list(set(chapters_to_redownload))


def redownload_chapters(base_path, chapter_numbers, metadata_csv_path):
    """Re-download specific chapters and update metadata immediately"""
    print(f"\n{'='*60}")
    print(f"RE-DOWNLOADING {len(chapter_numbers)} CHAPTERS")
    print(f"{'='*60}\n")
    
    # Get chapter URLs
    all_chapters = get_all_chapters()
    chapter_urls = {ch['number']: ch for ch in all_chapters}
    
    success_count = 0
    failed_count = 0
    
    for idx, chapter_num in enumerate(sorted(chapter_numbers), 1):
        chapter_data = chapter_urls.get(chapter_num)
        
        if not chapter_data:
            print(f"\n[{idx}/{len(chapter_numbers)}] ✗ Chapter {chapter_num}: URL not found")
            failed_count += 1
            continue
        
        print(f"\n{'='*60}")
        print(f"[{idx}/{len(chapter_numbers)}] Re-downloading Chapter {chapter_num}")
        print(f"{'='*60}")
        
        chapter_folder = os.path.join(base_path, f"chapter-{chapter_num:03d}")
        
        try:
            panel_count, success, error, expected_count = scrape_chapter(
                chapter_data['url'],
                chapter_folder,
                metadata_csv_path,
                "One Piece",
                update_immediately=True
            )
            
            if success and panel_count > 0:
                success_count += 1
                print(f"✓ Chapter {chapter_num} updated successfully in metadata")
            else:
                failed_count += 1
            
            time.sleep(2)
            
        except Exception as e:
            print(f"✗ Error re-downloading chapter {chapter_num}: {e}")
            failed_count += 1
    
    print(f"\n{'='*60}")
    print("RE-DOWNLOAD SUMMARY")
    print(f"{'='*60}")
    print(f"✓ Successfully re-downloaded: {success_count}/{len(chapter_numbers)}")
    print(f"✗ Failed: {failed_count}/{len(chapter_numbers)}")
    print(f"{'='*60}\n")


def load_existing_metadata(metadata_csv_path):
    """Load existing metadata to check what's already recorded"""
    existing = {}
    if os.path.exists(metadata_csv_path):
        with open(metadata_csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                chapter_num = int(row['chapter_number'])
                existing[chapter_num] = {
                    'panel_count': int(row['panel_count']),
                    'expected_count': int(row.get('expected_count', row['panel_count'])),
                    'status': row['status']
                }
    return existing


def scrape_all_chapters(base_path, start_chapter=1, end_chapter=None, verify_after=True):
    """Scrape multiple chapters with metadata tracking"""
    
    # Setup metadata CSV
    metadata_csv_path = os.path.join(base_path, 'chapter_metadata.csv')
    csv_exists = os.path.exists(metadata_csv_path)
    
    # Load existing metadata
    existing_metadata = load_existing_metadata(metadata_csv_path)
    
    # Get all chapters
    chapters = get_all_chapters()
    
    if not chapters:
        print("\n✗ Could not fetch chapter list")
        return
    
    # Filter by range
    if start_chapter or end_chapter:
        chapters = [ch for ch in chapters 
                   if (ch['number'] >= start_chapter) 
                   and (not end_chapter or ch['number'] <= end_chapter)]
    
    print(f"\n{'='*60}")
    print(f"Will download {len(chapters)} chapters")
    print(f"Metadata CSV: {metadata_csv_path}")
    print(f"{'='*60}\n")
    
    success_count = 0
    failed_chapters = []
    
    # Open CSV file for metadata
    with open(metadata_csv_path, 'a', newline='', encoding='utf-8') as csv_file:
        writer = csv.writer(csv_file)
        
        # Write header if new file
        if not csv_exists:
            writer.writerow(['manga_name', 'chapter_number', 'panel_count', 'expected_count', 'status', 'timestamp', 'error'])
        
        for chapter in chapters:
            chapter_num = chapter['number']
            chapter_url = chapter['url']
            
            # Create folder path
            chapter_folder = os.path.join(base_path, f"chapter-{chapter_num:03d}")
            
            # Check if already exists and is complete
            if os.path.exists(chapter_folder) and chapter_num in existing_metadata:
                meta = existing_metadata[chapter_num]
                if meta['status'] == 'success' and meta['panel_count'] == meta.get('expected_count', meta['panel_count']):
                    panel_count = len([f for f in os.listdir(chapter_folder) 
                                     if f.startswith('panel-')])
                    if panel_count == meta['expected_count']:
                        print(f"\n⊘ Chapter {chapter_num} already complete with {panel_count} panels, skipping...")
                        success_count += 1
                        continue
            
            print(f"\n{'='*60}")
            print(f"Chapter {chapter_num}: {chapter['text']}")
            print(f"{'='*60}")
            
            try:
                panel_count, success, error, expected_count = scrape_chapter(
                    chapter_url, 
                    chapter_folder,
                    metadata_csv_path,
                    "One Piece",
                    update_immediately=False
                )
                
                # Write to CSV
                status = 'success' if success and panel_count > 0 else ('partial' if panel_count > 0 else 'failed')
                error_msg = '' if success else (error or f'Downloaded {panel_count}/{expected_count}')
                writer.writerow([
                    "One Piece", chapter_num, panel_count, expected_count, status,
                    datetime.now().isoformat(), error_msg
                ])
                csv_file.flush()
                
                if success and panel_count > 0:
                    success_count += 1
                else:
                    failed_chapters.append(chapter_num)
                
                time.sleep(2)
                
            except KeyboardInterrupt:
                print("\n\n⚠ Download interrupted by user")
                break
            except Exception as e:
                print(f"✗ Error processing chapter {chapter_num}: {e}")
                failed_chapters.append(chapter_num)
                writer.writerow([
                    "One Piece", chapter_num, 0, 0, 'failed',
                    datetime.now().isoformat(), str(e)
                ])
                csv_file.flush()
    
    # Summary
    print(f"\n{'='*60}")
    print("DOWNLOAD SUMMARY")
    print(f"{'='*60}")
    print(f"✓ Successfully downloaded: {success_count}/{len(chapters)} chapters")
    if failed_chapters:
        print(f"✗ Failed chapters: {', '.join(map(str, failed_chapters))}")
    print(f"Location: {base_path}")
    print(f"Metadata: {metadata_csv_path}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    # Base path for One Piece manga
    base_path = r"E:\UOM\My-CODE_RUSH\projects\One Piece\manga-app\public\one-piece"
    
    print("=" * 60)
    print("One Piece Manga Scraper with Panel Count Verification")
    print("=" * 60)
    print(f"\nOutput folder: {base_path}")
    print("\nChoose option:")
    print("1. Download all chapters")
    print("2. Download specific chapter range")
    print("3. Download single chapter")
    print("4. Verify existing chapters (using metadata only)")
    print("5. Re-download failed/incomplete chapters")
    
    choice = input("\nEnter choice (1-5): ").strip()
    
    try:
        if choice == "1":
            confirm = input("\n⚠ This will download ALL One Piece chapters (1000+). Continue? (yes/no): ")
            if confirm.lower() in ['yes', 'y']:
                scrape_all_chapters(base_path)
            else:
                print("Cancelled.")
        
        elif choice == "2":
            start = int(input("Enter start chapter number: "))
            end = int(input("Enter end chapter number: "))
            scrape_all_chapters(base_path, start_chapter=start, end_chapter=end)
        
        elif choice == "3":
            chapter_num = int(input("Enter chapter number: "))
            chapters = get_all_chapters()
            chapter_data = next((ch for ch in chapters if ch['number'] == chapter_num), None)
            
            if chapter_data:
                chapter_folder = os.path.join(base_path, f"chapter-{chapter_num:03d}")
                metadata_csv_path = os.path.join(base_path, 'chapter_metadata.csv')
                scrape_chapter(chapter_data['url'], chapter_folder, metadata_csv_path, "One Piece", update_immediately=True)
            else:
                print(f"✗ Chapter {chapter_num} not found")
        
        elif choice == "4":
            metadata_csv_path = os.path.join(base_path, 'chapter_metadata.csv')
            verify_all_chapters(base_path, metadata_csv_path)
        
        elif choice == "5":
            metadata_csv_path = os.path.join(base_path, 'chapter_metadata.csv')
            if not os.path.exists(metadata_csv_path):
                print("✗ No metadata CSV found. Download some chapters first.")
            else:
                chapters_to_fix = verify_all_chapters_local(base_path, metadata_csv_path)
                if chapters_to_fix:
                    confirm = input(f"\nRe-download {len(chapters_to_fix)} chapters? (yes/no): ")
                    if confirm.lower() in ['yes', 'y']:
                        redownload_chapters(base_path, chapters_to_fix, metadata_csv_path)
                        print("\n✓ Re-download complete! Metadata has been updated.")
                else:
                    print("✓ All chapters verified successfully!")
        
        else:
            print("Invalid choice")
    
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
    except Exception as e:
        print(f"\n✗ Error: {e}")