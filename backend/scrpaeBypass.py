"""
HiManga.fun Smart Scraper
Optimized for your Cloudinary structure
Can work with or without Selenium
"""

import os
import requests
import re
import csv
from datetime import datetime
import time
import random
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager


class HiMangaScraper:
    def __init__(self, base_path, cloudinary_base="https://res.cloudinary.com/dk9ywbxu1/image/upload/"):
        self.base_path = base_path
        self.cloudinary_base = cloudinary_base
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
        })
    
    def construct_cloudinary_url(self, manga_slug, chapter_num, panel_num, use_transformations=False):
        """
        Construct Cloudinary URL for a specific panel
        
        Args:
            manga_slug: e.g., "one-piece"
            chapter_num: e.g., 1
            panel_num: e.g., 7
            use_transformations: If True, adds quality optimizations
        """
        chapter_str = f"chapter-{chapter_num:03d}"
        panel_str = f"panel-{panel_num:03d}"
        
        if use_transformations:
            # Use your site's transformations for optimized loading
            transformations = "f_auto,q_auto:good,w_1200,c_limit,dpr_auto,fl_progressive,fl_lossy"
            watermark = "l_xdsafsa_nm4rmb,w_150,o_60,g_south_east,x_2,y_2,fl_layer_apply,l_text:Raleway_40_bold:HiManga.fun,co_rgb:00FFFF,b_rgb:0f172a,bo_1px_solid_rgb:0f172a,g_south_east,x_2,y_0,o_100,fl_layer_apply"
            path = f"manga/{manga_slug}/{chapter_str}/{panel_str}.jpg"
            return f"{self.cloudinary_base}{transformations},{watermark}/{path}"
        else:
            # Clean URL for original quality
            path = f"manga/{manga_slug}/{chapter_str}/{panel_str}.jpg"
            return f"{self.cloudinary_base}{path}"
    
    def download_image(self, url, output_path, max_retries=3):
        """Download image with retry logic"""
        for attempt in range(max_retries):
            try:
                response = self.session.get(url, timeout=15)
                
                if response.status_code == 200:
                    with open(output_path, 'wb') as f:
                        f.write(response.content)
                    return True
                elif response.status_code == 404:
                    return False  # Panel doesn't exist
                
            except Exception as e:
                if attempt == max_retries - 1:
                    print(f" ({str(e)[:30]})")
                    return False
                time.sleep(1)
        
        return False
    
    def scrape_chapter_smart(self, manga_slug, chapter_num, output_folder, max_panels=200, use_selenium=False):
        """
        Smart scraping: tries direct Cloudinary URLs first, falls back to Selenium
        
        Args:
            manga_slug: manga identifier
            chapter_num: chapter number
            output_folder: where to save panels
            max_panels: maximum number of panels to try
            use_selenium: force Selenium mode
        """
        os.makedirs(output_folder, exist_ok=True)
        
        print(f"\n📥 Downloading Chapter {chapter_num}")
        
        if not use_selenium:
            # Method 1: Direct Cloudinary URL construction (FAST!)
            print("🚀 Using smart URL construction...")
            downloaded_count = 0
            
            for panel_num in range(1, max_panels + 1):
                # Try clean URL first
                url = self.construct_cloudinary_url(manga_slug, chapter_num, panel_num, use_transformations=False)
                filename = f"panel-{panel_num:03d}.jpg"
                filepath = os.path.join(output_folder, filename)
                
                # Check if already exists
                if os.path.exists(filepath):
                    downloaded_count += 1
                    continue
                
                print(f"  [{panel_num}] {filename}...", end=' ', flush=True)
                
                success = self.download_image(url, filepath)
                
                if success:
                    print("✓")
                    downloaded_count += 1
                    time.sleep(random.uniform(0.2, 0.5))
                else:
                    print("✗ (not found)")
                    # If we hit 3 consecutive failures, assume chapter ended
                    if panel_num > 5:  # At least 5 panels should exist
                        consecutive_failures = 0
                        for check_num in range(panel_num, min(panel_num + 3, max_panels + 1)):
                            test_url = self.construct_cloudinary_url(manga_slug, chapter_num, check_num, False)
                            test_response = self.session.head(test_url, timeout=5)
                            if test_response.status_code == 404:
                                consecutive_failures += 1
                        
                        if consecutive_failures >= 3:
                            print(f"  ℹ Reached end of chapter at panel {panel_num - 1}")
                            break
            
            print(f"\n✓ Downloaded {downloaded_count} panels")
            return downloaded_count, downloaded_count
        
        else:
            # Method 2: Selenium scraping (slower but more reliable)
            print("🌐 Using Selenium mode...")
            return self.scrape_chapter_selenium(manga_slug, chapter_num, output_folder)
    
    def scrape_chapter_selenium(self, manga_slug, chapter_num, output_folder):
        """Fallback: Use Selenium to find exact panel count"""
        
        chrome_options = Options()
        chrome_options.add_argument('--headless=new')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--log-level=3')
        
        driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=chrome_options
        )
        
        try:
            chapter_url = f"https://himanga.fun/manga/{manga_slug}/chapter-{chapter_num}"
            driver.get(chapter_url)
            time.sleep(3)
            
            # Scroll to load all images
            for _ in range(3):
                driver.execute_script("window.scrollBy(0, 1000);")
                time.sleep(1)
            
            # Find all panel images
            images = driver.find_elements(By.CSS_SELECTOR, "img[alt^='Panel']")
            expected_count = len(images)
            
            print(f"✓ Found {expected_count} panels")
            
            downloaded_count = 0
            for idx in range(1, expected_count + 1):
                url = self.construct_cloudinary_url(manga_slug, chapter_num, idx, False)
                filename = f"panel-{idx:03d}.jpg"
                filepath = os.path.join(output_folder, filename)
                
                if os.path.exists(filepath):
                    downloaded_count += 1
                    continue
                
                print(f"  [{idx}/{expected_count}] {filename}...", end=' ', flush=True)
                
                if self.download_image(url, filepath):
                    print("✓")
                    downloaded_count += 1
                else:
                    print("✗")
                
                time.sleep(0.3)
            
            return downloaded_count, expected_count
            
        finally:
            driver.quit()
    
    def update_metadata(self, metadata_path, manga_name, manga_slug, chapter_num, panel_count, expected_count, status, error=''):
        """Update metadata CSV"""
        
        if not os.path.exists(metadata_path):
            with open(metadata_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(['manga_name', 'manga_slug', 'chapter_number', 'panel_count', 'expected_count', 'status', 'timestamp', 'error'])
        
        rows = []
        chapter_exists = False
        
        try:
            with open(metadata_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                fieldnames = reader.fieldnames
                
                for row in reader:
                    if row['manga_slug'] == manga_slug and int(row['chapter_number']) == chapter_num:
                        row.update({
                            'manga_name': manga_name,
                            'panel_count': panel_count,
                            'expected_count': expected_count,
                            'status': status,
                            'timestamp': datetime.now().isoformat(),
                            'error': error
                        })
                        chapter_exists = True
                    rows.append(row)
        except FileNotFoundError:
            fieldnames = ['manga_name', 'manga_slug', 'chapter_number', 'panel_count', 'expected_count', 'status', 'timestamp', 'error']
        
        with open(metadata_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
            
            if not chapter_exists:
                writer.writerow({
                    'manga_name': manga_name,
                    'manga_slug': manga_slug,
                    'chapter_number': chapter_num,
                    'panel_count': panel_count,
                    'expected_count': expected_count,
                    'status': status,
                    'timestamp': datetime.now().isoformat(),
                    'error': error
                })
    
    def scrape_chapters_batch(self, manga_name, manga_slug, start_chapter, end_chapter, use_selenium=False):
        """Scrape multiple chapters"""
        
        manga_path = os.path.join(self.base_path, manga_slug)
        metadata_path = os.path.join(self.base_path, 'himanga_metadata.csv')
        
        print(f"\n{'='*60}")
        print(f"📚 Scraping: {manga_name}")
        print(f"   Chapters: {start_chapter} to {end_chapter}")
        print(f"   Mode: {'Selenium' if use_selenium else 'Smart (Direct URLs)'}")
        print(f"{'='*60}\n")
        
        success_count = 0
        failed_chapters = []
        
        for chapter_num in range(start_chapter, end_chapter + 1):
            chapter_folder = os.path.join(manga_path, f"chapter-{chapter_num:03d}")
            
            print(f"\n{'─'*60}")
            print(f"Chapter {chapter_num}")
            print(f"{'─'*60}")
            
            try:
                downloaded, expected = self.scrape_chapter_smart(
                    manga_slug, 
                    chapter_num, 
                    chapter_folder,
                    use_selenium=use_selenium
                )
                
                status = 'success' if downloaded == expected and downloaded > 0 else 'partial'
                
                self.update_metadata(
                    metadata_path,
                    manga_name,
                    manga_slug,
                    chapter_num,
                    downloaded,
                    expected,
                    status
                )
                
                if downloaded > 0:
                    success_count += 1
                else:
                    failed_chapters.append(chapter_num)
                
                time.sleep(random.uniform(1, 2))
                
            except KeyboardInterrupt:
                print("\n\n⚠ Interrupted by user")
                break
            except Exception as e:
                print(f"✗ Error: {e}")
                failed_chapters.append(chapter_num)
                self.update_metadata(metadata_path, manga_name, manga_slug, chapter_num, 0, 0, 'failed', str(e))
        
        # Summary
        total = end_chapter - start_chapter + 1
        print(f"\n{'='*60}")
        print("📊 SUMMARY")
        print(f"{'='*60}")
        print(f"✓ Success: {success_count}/{total}")
        if failed_chapters:
            print(f"✗ Failed: {', '.join(map(str, failed_chapters))}")
        print(f"📁 Location: {manga_path}")
        print(f"📄 Metadata: {metadata_path}")
        print(f"{'='*60}\n")


def main():
    base_path = r"E:\UOM\My-CODE_RUSH\projects\HiManga\public\downloaded"
    
    print("="*60)
    print("🎌 HiManga.fun Smart Scraper")
    print("="*60)
    print("\n💡 Features:")
    print("  • Direct Cloudinary URL construction (super fast!)")
    print("  • Automatic fallback to Selenium if needed")
    print("  • Smart panel detection")
    print()
    
    scraper = HiMangaScraper(base_path)
    
    # Get manga info
    manga_slug = input("Manga slug (e.g., one-piece): ").strip()
    manga_name = input(f"Manga name [{manga_slug.replace('-', ' ').title()}]: ").strip()
    if not manga_name:
        manga_name = manga_slug.replace('-', ' ').title()
    
    # Get chapter range
    print("\n📥 Download Options:")
    print("1. Single chapter")
    print("2. Chapter range")
    
    choice = input("\nChoice (1-2): ").strip()
    
    # Ask about mode
    mode = input("\nUse Selenium mode? (slower but more accurate) (y/n) [n]: ").strip().lower()
    use_selenium = mode == 'y'
    
    try:
        if choice == "1":
            chapter_num = int(input("Chapter number: "))
            chapter_folder = os.path.join(base_path, manga_slug, f"chapter-{chapter_num:03d}")
            
            downloaded, expected = scraper.scrape_chapter_smart(
                manga_slug,
                chapter_num,
                chapter_folder,
                use_selenium=use_selenium
            )
            
            metadata_path = os.path.join(base_path, 'himanga_metadata.csv')
            status = 'success' if downloaded == expected and downloaded > 0 else 'partial'
            scraper.update_metadata(metadata_path, manga_name, manga_slug, chapter_num, downloaded, expected, status)
            
        elif choice == "2":
            start = int(input("Start chapter: "))
            end = int(input("End chapter: "))
            
            scraper.scrape_chapters_batch(manga_name, manga_slug, start, end, use_selenium)
        
    except KeyboardInterrupt:
        print("\n\nCancelled")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()