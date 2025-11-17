from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import requests
from bs4 import BeautifulSoup
import json
import re

def setup_driver():
    """Setup headless Chrome driver"""
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    driver = webdriver.Chrome(options=options)
    return driver

def extract_image_from_google_news_element(article):
    """Extract image directly from Google News article element"""
    try:
        # Try to get image from img tag
        img_elem = article.find_element(By.CSS_SELECTOR, 'figure img.Quavad')
        img_src = img_elem.get_attribute('src')
        
        # If it's a Google News API attachment, try to get higher resolution
        if img_src and '/api/attachments/' in img_src:
            # Try to get srcset for higher quality
            srcset = img_elem.get_attribute('srcset')
            if srcset:
                # Extract the highest resolution image
                urls = [url.split()[0] for url in srcset.split(',')]
                if urls:
                    img_src = urls[-1]  # Last one is usually highest res
            
            # Convert to full URL if needed
            if img_src.startswith('/'):
                img_src = f"https://news.google.com{img_src}"
        
        return img_src
    except Exception as e:
        pass
    
    # Try to extract from jsdata attribute (contains structured data)
    try:
        jsdata = article.get_attribute('jsdata')
        if jsdata:
            # Look for image URLs in the data
            img_urls = re.findall(r'https?://[^\s,"]+\.(?:jpg|jpeg|png|webp|gif)', jsdata)
            # Filter out Google static images
            for url in img_urls:
                if 'gstatic.com' not in url and 'encrypted-tbn' not in url:
                    return url
    except Exception as e:
        pass
    
    return None

def extract_article_image(url):
    """Extract image from actual article URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, timeout=10, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Try OG image
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            img = og_image['content']
            if 'gstatic.com' not in img and 'google.com' not in img:
                return img
        
        # Try Twitter image
        twitter_img = soup.find('meta', attrs={'name': 'twitter:image'})
        if twitter_img and twitter_img.get('content'):
            img = twitter_img['content']
            if 'gstatic.com' not in img and 'google.com' not in img:
                return img
        
        # Try article:image
        article_img = soup.find('meta', property='article:image')
        if article_img and article_img.get('content'):
            img = article_img['content']
            if 'gstatic.com' not in img and 'google.com' not in img:
                return img
                
    except Exception as e:
        print(f"Error extracting image: {e}")
    
    return None

def scrape_google_news(query="anime", max_articles=50):
    """
    Scrape Google News search results using Selenium
    """
    driver = setup_driver()
    results = []
    
    try:
        url = f"https://news.google.com/search?q={query}&hl=en-US&gl=US&ceid=US%3Aen"
        print(f"🔎 Fetching: {url}\n")
        
        driver.get(url)
        time.sleep(3)  # Wait for page to load
        
        # Find all article elements
        articles = driver.find_elements(By.CSS_SELECTOR, 'article')
        
        print(f"Found {len(articles)} articles\n")
        
        for i, article in enumerate(articles[:max_articles]):
            try:
                # Extract title and link
                title_elem = article.find_element(By.CSS_SELECTOR, 'a.JtKRv')
                title = title_elem.text
                google_link = title_elem.get_attribute('href')
                
                # Extract publisher
                try:
                    publisher = article.find_element(By.CSS_SELECTOR, 'div[data-n-tid]').text
                except:
                    publisher = "Unknown"
                
                # Extract time
                try:
                    time_elem = article.find_element(By.CSS_SELECTOR, 'time')
                    published = time_elem.get_attribute('datetime')
                except:
                    published = None
                
                print(f"[{i+1}] {title[:60]}...")
                print(f"    Publisher: {publisher}")
                
                # First, try to get image from Google News element itself
                image = extract_image_from_google_news_element(article)
                if image:
                    print(f"    Image (from Google News): ✅ Found")
                    print(f"           {image[:70]}...")
                
                # Get real URL by following redirect
                real_url = google_link
                if google_link and google_link.startswith('http'):
                    try:
                        response = requests.get(google_link, allow_redirects=True, timeout=5)
                        real_url = response.url
                        print(f"    Real URL: {real_url[:60]}...")
                    except:
                        pass
                
                # If no image from Google News, extract from real article
                if not image:
                    image = extract_article_image(real_url)
                    if image:
                        print(f"    Image (from article): ✅ Found")
                        print(f"           {image[:70]}...")
                    else:
                        print(f"    Image: ❌ Not found")
                
                results.append({
                    'title': title,
                    'publisher': publisher,
                    'published': published,
                    'google_link': google_link,
                    'real_url': real_url,
                    'image': image
                })
                
                print()
                time.sleep(1)  # Be polite
                
            except Exception as e:
                print(f"Error parsing article {i+1}: {e}\n")
                continue
        
    finally:
        driver.quit()
    
    return results


if __name__ == "__main__":
    articles = scrape_google_news("anime", max_articles=50)
    
    print("\n" + "="*80)
    print("📊 FINAL RESULTS")
    print("="*80 + "\n")
    
    for i, article in enumerate(articles, 1):
        print(f"{i}. {article['title']}")
        print(f"   Publisher: {article['publisher']}")
        print(f"   URL: {article['real_url']}")
        print(f"   Image: {article['image'] or 'NO IMAGE'}")
        print("-" * 80)