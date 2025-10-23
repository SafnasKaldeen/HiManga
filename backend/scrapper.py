import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import re

def scrape_chapter(url, output_folder):
    """
    Scrape a single chapter using Beautiful Soup.
    Based on the original scrape_images_basic function.
    """
    print(f"\nFetching page: {url}")
    
    # Create output folder
    os.makedirs(output_folder, exist_ok=True)
    
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
        
        print(f"Found {len(images)} images in .page-break.no-gaps")
        
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
            return 0
        
        # Download images in order
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
                time.sleep(0.5)  # Be polite, don't hammer the server
                
            except Exception as e:
                print(f"✗ Failed to download {img_url}: {e}")
        
        print(f"✓ Done! Images saved to: {output_folder}")
        return len(image_urls)
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return 0


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


def scrape_all_chapters(base_path, start_chapter=1, end_chapter=None):
    """Scrape multiple chapters"""
    
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
    print(f"{'='*60}\n")
    
    success_count = 0
    failed_chapters = []
    
    for chapter in chapters:
        chapter_num = chapter['number']
        chapter_url = chapter['url']
        
        # Create folder path
        chapter_folder = os.path.join(base_path, f"chapter-{chapter_num:03d}")
        
        # Skip if already exists
        if os.path.exists(chapter_folder) and len(os.listdir(chapter_folder)) > 0:
            print(f"\n⊘ Chapter {chapter_num} already exists, skipping...")
            success_count += 1
            continue
        
        print(f"\n{'='*60}")
        print(f"Chapter {chapter_num}: {chapter['text']}")
        print(f"{'='*60}")
        
        try:
            result = scrape_chapter(chapter_url, chapter_folder)
            
            if result > 0:
                success_count += 1
            else:
                failed_chapters.append(chapter_num)
            
            # Pause between chapters
            time.sleep(2)
            
        except KeyboardInterrupt:
            print("\n\n⚠ Download interrupted by user")
            break
        except Exception as e:
            print(f"✗ Error processing chapter {chapter_num}: {e}")
            failed_chapters.append(chapter_num)
    
    # Summary
    print(f"\n{'='*60}")
    print("DOWNLOAD SUMMARY")
    print(f"{'='*60}")
    print(f"✓ Successfully downloaded: {success_count}/{len(chapters)} chapters")
    if failed_chapters:
        print(f"✗ Failed chapters: {', '.join(map(str, failed_chapters))}")
    print(f"Location: {base_path}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    # Base path for One Piece manga
    base_path = r"E:\UOM\My-CODE_RUSH\projects\One Piece\manga-app\public\one-piece"
    
    print("=" * 60)
    print("One Piece Manga Scraper")
    print("=" * 60)
    print(f"\nOutput folder: {base_path}")
    print("\nChoose option:")
    print("1. Download all chapters")
    print("2. Download specific chapter range")
    print("3. Download single chapter")
    
    choice = input("\nEnter choice (1, 2, or 3): ").strip()
    
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
                scrape_chapter(chapter_data['url'], chapter_folder)
            else:
                print(f"✗ Chapter {chapter_num} not found")
        
        else:
            print("Invalid choice")
    
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
    except Exception as e:
        print(f"\n✗ Error: {e}")