import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import re
import csv
from datetime import datetime

def get_manga_slug_from_url(manga_url):
    """Extract slug from manga URL"""
    # Example: https://www.mangaread.org/manga/one-piece/ -> one-piece
    match = re.search(r'/manga/([^/]+)', manga_url)
    return match.group(1) if match else None


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


def scrape_chapter(url, output_folder, metadata_csv_path, manga_name, manga_slug, update_immediately=False):
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
                update_single_chapter_metadata(metadata_csv_path, manga_name, manga_slug, chapter_num, 0, expected_count, 'failed', 'No images found')
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
            update_single_chapter_metadata(metadata_csv_path, manga_name, manga_slug, chapter_num, downloaded_count, expected_count, status, error_msg)
        
        return downloaded_count, downloaded_count == expected_count, "", expected_count
        
    except Exception as e:
        error_msg = str(e)
        print(f"✗ Error: {error_msg}")
        if update_immediately and metadata_csv_path:
            update_single_chapter_metadata(metadata_csv_path, manga_name, manga_slug, chapter_num, 0, 0, 'failed', error_msg)
        return 0, False, error_msg, 0


def update_single_chapter_metadata(metadata_csv_path, manga_name, manga_slug, chapter_num, panel_count, expected_count, status, error_msg=''):
    """Update metadata for a single chapter immediately after download"""
    
    # Ensure metadata file exists with headers
    if not os.path.exists(metadata_csv_path):
        with open(metadata_csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['manga_name', 'manga_slug', 'chapter_number', 'panel_count', 'expected_count', 'status', 'timestamp', 'error'])
    
    # Read all existing rows
    rows = []
    chapter_exists = False
    
    with open(metadata_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        for row in reader:
            if row['manga_slug'] == manga_slug and int(row['chapter_number']) == chapter_num:
                # Update existing row
                row['manga_name'] = manga_name
                row['panel_count'] = panel_count
                row['expected_count'] = expected_count
                row['status'] = status
                row['timestamp'] = datetime.now().isoformat()
                row['error'] = error_msg
                chapter_exists = True
            rows.append(row)
    
    # Write back all rows
    with open(metadata_csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
        
        # Add new row if chapter didn't exist
        if not chapter_exists:
            writer.writerow({
                'manga_name': manga_name,
                'manga_slug': manga_slug,
                'chapter_number': chapter_num,
                'panel_count': panel_count,
                'expected_count': expected_count,
                'status': status,
                'timestamp': datetime.now().isoformat(),
                'error': error_msg
            })


def get_all_chapters(manga_url):
    """Get list of all chapters from the manga page"""
    
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


def verify_all_chapters_local(manga_slug, base_path, metadata_csv_path):
    """
    Verify all chapters using metadata only (no web checks).
    Returns list of chapters that need re-downloading.
    """
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RESET = '\033[0m'
    
    print(f"\n{'='*60}")
    print(f"VERIFYING ALL CHAPTERS FOR: {manga_slug}")
    print(f"{'='*60}\n")
    
    chapters_to_redownload = []
    
    # Load metadata for this manga
    metadata = {}
    if os.path.exists(metadata_csv_path):
        with open(metadata_csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['manga_slug'] == manga_slug:
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
    
    manga_path = os.path.join(base_path, manga_slug)
    
    if not os.path.exists(manga_path):
        print(f"{RED}✗ Manga folder not found: {manga_path}{RESET}")
        return []
    
    # Get all chapter folders
    chapter_folders = [d for d in os.listdir(manga_path) 
                      if d.startswith('chapter-') and os.path.isdir(os.path.join(manga_path, d))]
    
    # Sort by chapter number
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
        chapter_path = os.path.join(manga_path, folder)
        
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


def redownload_chapters(manga_url, manga_name, manga_slug, base_path, chapter_numbers, metadata_csv_path):
    """Re-download specific chapters and update metadata immediately"""
    print(f"\n{'='*60}")
    print(f"RE-DOWNLOADING {len(chapter_numbers)} CHAPTERS")
    print(f"{'='*60}\n")
    
    # Get chapter URLs
    all_chapters = get_all_chapters(manga_url)
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
        
        manga_path = os.path.join(base_path, manga_slug)
        chapter_folder = os.path.join(manga_path, f"chapter-{chapter_num:03d}")
        
        try:
            panel_count, success, error, expected_count = scrape_chapter(
                chapter_data['url'],
                chapter_folder,
                metadata_csv_path,
                manga_name,
                manga_slug,
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


def load_existing_metadata(metadata_csv_path, manga_slug):
    """Load existing metadata for a specific manga"""
    existing = {}
    if os.path.exists(metadata_csv_path):
        with open(metadata_csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['manga_slug'] == manga_slug:
                    chapter_num = int(row['chapter_number'])
                    existing[chapter_num] = {
                        'panel_count': int(row['panel_count']),
                        'expected_count': int(row.get('expected_count', row['panel_count'])),
                        'status': row['status']
                    }
    return existing


def scrape_all_chapters(manga_url, manga_name, manga_slug, base_path, start_chapter=1, end_chapter=None):
    """Scrape multiple chapters with metadata tracking"""
    
    # Setup metadata CSV in public folder
    metadata_csv_path = os.path.join(base_path, 'manga_metadata.csv')
    
    # Load existing metadata for this manga
    existing_metadata = load_existing_metadata(metadata_csv_path, manga_slug)
    
    # Get all chapters
    chapters = get_all_chapters(manga_url)
    
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
    print(f"Manga: {manga_name} ({manga_slug})")
    print(f"Metadata CSV: {metadata_csv_path}")
    print(f"{'='*60}\n")
    
    success_count = 0
    failed_chapters = []
    
    manga_path = os.path.join(base_path, manga_slug)
    os.makedirs(manga_path, exist_ok=True)
    
    for chapter in chapters:
        chapter_num = chapter['number']
        chapter_url = chapter['url']
        
        # Create folder path
        chapter_folder = os.path.join(manga_path, f"chapter-{chapter_num:03d}")
        
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
                manga_name,
                manga_slug,
                update_immediately=True
            )
            
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
            update_single_chapter_metadata(
                metadata_csv_path, manga_name, manga_slug, chapter_num,
                0, 0, 'failed', str(e)
            )
    
    # Summary
    print(f"\n{'='*60}")
    print("DOWNLOAD SUMMARY")
    print(f"{'='*60}")
    print(f"✓ Successfully downloaded: {success_count}/{len(chapters)} chapters")
    if failed_chapters:
        print(f"✗ Failed chapters: {', '.join(map(str, failed_chapters))}")
    print(f"Location: {manga_path}")
    print(f"Metadata: {metadata_csv_path}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    # Base path (public folder)
    base_path = r"E:\UOM\My-CODE_RUSH\projects\HiManga\public"
    
    print("=" * 60)
    print("Universal Manga Scraper")
    print("=" * 60)
    
    # Get manga URL
    manga_url = input("\nEnter manga URL (e.g., https://www.mangaread.org/manga/one-piece/): ").strip()
    
    # Extract manga slug
    manga_slug = get_manga_slug_from_url(manga_url)
    
    if not manga_slug:
        print("✗ Invalid manga URL format")
        exit(1)
    
    # Get manga name
    manga_name = input(f"Enter manga name (default: {manga_slug.replace('-', ' ').title()}): ").strip()
    if not manga_name:
        manga_name = manga_slug.replace('-', ' ').title()
    
    print(f"\nManga: {manga_name}")
    print(f"Slug: {manga_slug}")
    print(f"Output folder: {os.path.join(base_path, manga_slug)}")
    
    print("\nChoose option:")
    print("1. Download all chapters")
    print("2. Download specific chapter range")
    print("3. Download single chapter")
    print("4. Verify existing chapters (using metadata only)")
    print("5. Re-download failed/incomplete chapters")
    
    choice = input("\nEnter choice (1-5): ").strip()
    
    metadata_csv_path = os.path.join(base_path, 'manga_metadata.csv')
    
    try:
        if choice == "1":
            confirm = input(f"\n⚠ This will download ALL chapters of {manga_name}. Continue? (yes/no): ")
            if confirm.lower() in ['yes', 'y']:
                scrape_all_chapters(manga_url, manga_name, manga_slug, base_path)
            else:
                print("Cancelled.")
        
        elif choice == "2":
            start = int(input("Enter start chapter number: "))
            end = int(input("Enter end chapter number: "))
            scrape_all_chapters(manga_url, manga_name, manga_slug, base_path, start_chapter=start, end_chapter=end)
        
        elif choice == "3":
            chapter_num = int(input("Enter chapter number: "))
            chapters = get_all_chapters(manga_url)
            chapter_data = next((ch for ch in chapters if ch['number'] == chapter_num), None)
            
            if chapter_data:
                manga_path = os.path.join(base_path, manga_slug)
                chapter_folder = os.path.join(manga_path, f"chapter-{chapter_num:03d}")
                scrape_chapter(chapter_data['url'], chapter_folder, metadata_csv_path, manga_name, manga_slug, update_immediately=True)
            else:
                print(f"✗ Chapter {chapter_num} not found")
        
        elif choice == "4":
            verify_all_chapters(manga_slug, base_path, metadata_csv_path)
        
        elif choice == "5":
            if not os.path.exists(metadata_csv_path):
                print("✗ No metadata CSV found. Download some chapters first.")
            else:
                chapters_to_fix = verify_all_chapters_local(manga_slug, base_path, metadata_csv_path)
                if chapters_to_fix:
                    confirm = input(f"\nRe-download {len(chapters_to_fix)} chapters? (yes/no): ")
                    if confirm.lower() in ['yes', 'y']:
                        redownload_chapters(manga_url, manga_name, manga_slug, base_path, chapters_to_fix, metadata_csv_path)
                        print("\n✓ Re-download complete! Metadata has been updated.")
                else:
                    print("✓ All chapters verified successfully!")
        
        else:
            print("Invalid choice")
    
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
    except Exception as e:
        print(f"\n✗ Error: {e}")