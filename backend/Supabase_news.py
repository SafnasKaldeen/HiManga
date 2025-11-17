from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time
import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime, timedelta
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from urllib.parse import urlparse, urlunparse

# Load environment variables
load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ppfbpmbomksqlgojwdhr.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZmJwbWJvbWtzcWxnb2p3ZGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NTQ5NDMsImV4cCI6MjA3NjQzMDk0M30.5j7kSkZhoMZgvCGcxdG2phuoN3dwout3JgD1i1cUqaY")

def normalize_url(url):
    """
    Normalize URL to prevent duplicates from URL variations
    - Removes trailing slashes
    - Converts to lowercase domain
    - Removes common tracking parameters
    - Ensures https
    """
    if not url:
        return url
    
    try:
        parsed = urlparse(url)
        
        # Convert scheme to https
        scheme = 'https'
        
        # Lowercase domain
        netloc = parsed.netloc.lower()
        
        # Remove trailing slash from path
        path = parsed.path.rstrip('/')
        
        # Remove common tracking parameters
        tracking_params = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid']
        if parsed.query:
            params = [p for p in parsed.query.split('&') if not any(p.startswith(f"{tp}=") for tp in tracking_params)]
            query = '&'.join(params)
        else:
            query = ''
        
        # Reconstruct URL
        normalized = urlunparse((scheme, netloc, path, parsed.params, query, ''))
        return normalized
    except:
        return url

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

def parse_relative_time(time_str):
    """
    Convert relative time strings to datetime
    Examples: '2 hours ago', '3 days ago', '1 week ago'
    """
    now = datetime.now()
    time_str = time_str.lower().strip()
    
    try:
        if 'hour' in time_str or 'hr' in time_str:
            hours = int(re.search(r'(\d+)', time_str).group(1))
            return now - timedelta(hours=hours)
        elif 'minute' in time_str or 'min' in time_str:
            minutes = int(re.search(r'(\d+)', time_str).group(1))
            return now - timedelta(minutes=minutes)
        elif 'day' in time_str:
            days = int(re.search(r'(\d+)', time_str).group(1))
            return now - timedelta(days=days)
        elif 'week' in time_str:
            weeks = int(re.search(r'(\d+)', time_str).group(1))
            return now - timedelta(weeks=weeks)
        elif 'month' in time_str:
            months = int(re.search(r'(\d+)', time_str).group(1))
            return now - timedelta(days=months * 30)
        elif 'year' in time_str:
            years = int(re.search(r'(\d+)', time_str).group(1))
            return now - timedelta(days=years * 365)
        else:
            return now
    except:
        return now

def extract_image_from_google_news_element(article):
    """Extract image directly from Google News article element"""
    try:
        img_elem = article.find_element(By.CSS_SELECTOR, 'figure img.Quavad')
        img_src = img_elem.get_attribute('src')
        
        if img_src and '/api/attachments/' in img_src:
            srcset = img_elem.get_attribute('srcset')
            if srcset:
                urls = [url.split()[0] for url in srcset.split(',')]
                if urls:
                    img_src = urls[-1]
            
            if img_src.startswith('/'):
                img_src = f"https://news.google.com{img_src}"
        
        return img_src
    except Exception as e:
        pass
    
    try:
        jsdata = article.get_attribute('jsdata')
        if jsdata:
            img_urls = re.findall(r'https?://[^\s,"]+\.(?:jpg|jpeg|png|webp|gif)', jsdata)
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
        
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            img = og_image['content']
            if 'gstatic.com' not in img and 'google.com' not in img:
                return img
        
        twitter_img = soup.find('meta', attrs={'name': 'twitter:image'})
        if twitter_img and twitter_img.get('content'):
            img = twitter_img['content']
            if 'gstatic.com' not in img and 'google.com' not in img:
                return img
        
        article_img = soup.find('meta', property='article:image')
        if article_img and article_img.get('content'):
            img = article_img['content']
            if 'gstatic.com' not in img and 'google.com' not in img:
                return img
                
    except Exception as e:
        print(f"Error extracting image: {e}")
    
    return None

def init_supabase():
    """Initialize Supabase client"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Please set SUPABASE_URL and SUPABASE_KEY")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def upload_to_supabase(supabase: Client, articles, table_name="news_articles"):
    """
    Upload articles to Supabase with 7-day TTL and proper duplicate handling
    """
    expiry_date = datetime.now() + timedelta(days=7)
    
    uploaded_count = 0
    skipped_count = 0
    error_count = 0
    
    for article in articles:
        try:
            # Normalize URL before checking/inserting
            normalized_url = normalize_url(article['real_url'])
            
            # Prepare data for insertion
            data = {
                'title': article['title'],
                'publisher': article['publisher'],
                'published_at': article['published_datetime'].isoformat() if article['published_datetime'] else None,
                'published_text': article['published_text'],
                'google_link': article['google_link'],
                'article_url': normalized_url,
                'image_url': article['image'],
                'query': article.get('query', ''),
                'expires_at': expiry_date.isoformat(),
                'scraped_at': datetime.now().isoformat()
            }
            
            # Use upsert with on_conflict to handle duplicates gracefully
            try:
                result = supabase.table(table_name).upsert(
                    data,
                    on_conflict='article_url',
                    ignore_duplicates=True
                ).execute()
                
                # Check if actually inserted (upsert returns data even if skipped)
                if result.data:
                    print(f"   ✅ Uploaded: {article['title'][:50]}...")
                    uploaded_count += 1
                else:
                    print(f"   ⏭️  Already exists: {article['title'][:50]}...")
                    skipped_count += 1
                    
            except Exception as upsert_error:
                # Fallback to manual check if upsert fails
                existing = supabase.table(table_name).select("id").eq("article_url", normalized_url).execute()
                
                if existing.data:
                    print(f"   ⏭️  Already exists: {article['title'][:50]}...")
                    skipped_count += 1
                else:
                    result = supabase.table(table_name).insert(data).execute()
                    print(f"   ✅ Uploaded: {article['title'][:50]}...")
                    uploaded_count += 1
                
        except Exception as e:
            print(f"   ❌ Error uploading {article['title'][:50]}...: {e}")
            error_count += 1
    
    return uploaded_count, skipped_count, error_count

def scrape_google_news(query="anime", max_articles=20, scroll_attempts=5, sort_by_time=True, supabase_client=None):
    """
    Scrape Google News search results using Selenium
    """
    driver = setup_driver()
    results = []
    
    # Get existing article URLs from database if client provided
    existing_urls = set()
    if supabase_client:
        try:
            response = supabase_client.table("news_articles").select("article_url").eq("query", query).execute()
            # Normalize stored URLs too
            existing_urls = {normalize_url(row['article_url']) for row in response.data}
            print(f"📚 Found {len(existing_urls)} existing articles in database for query '{query}'\n")
        except Exception as e:
            print(f"⚠️  Could not fetch existing articles: {e}\n")
    
    try:
        url = f"https://news.google.com/search?q={query}&hl=en-US&gl=US&ceid=US%3Aen"
        print(f"🔎 Fetching: {url}\n")
        
        driver.get(url)
        time.sleep(3)
        
        for scroll in range(scroll_attempts):
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
            print(f"Scrolled {scroll + 1}/{scroll_attempts} times...")
        
        articles = driver.find_elements(By.CSS_SELECTOR, 'article')
        
        print(f"\nFound {len(articles)} total articles on page")
        print(f"Will scrape up to {max_articles} articles\n")
        
        for i, article in enumerate(articles[:max_articles]):
            try:
                title_elem = article.find_element(By.CSS_SELECTOR, 'a.JtKRv')
                title = title_elem.text
                google_link = title_elem.get_attribute('href')
                
                try:
                    publisher = article.find_element(By.CSS_SELECTOR, 'div[data-n-tid]').text
                except:
                    publisher = "Unknown"
                
                published_datetime = None
                published_text = None
                try:
                    time_elem = article.find_element(By.CSS_SELECTOR, 'time')
                    datetime_attr = time_elem.get_attribute('datetime')
                    time_text = time_elem.text
                    
                    if datetime_attr:
                        published_datetime = datetime.fromisoformat(datetime_attr.replace('Z', '+00:00'))
                    else:
                        published_datetime = parse_relative_time(time_text)
                    
                    published_text = time_text
                except Exception as e:
                    pass
                
                print(f"[{i+1}] {title[:60]}...")
                print(f"    Publisher: {publisher}")
                print(f"    Published: {published_text or 'Unknown'}")
                if published_datetime:
                    print(f"    DateTime: {published_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
                
                image = extract_image_from_google_news_element(article)
                if image:
                    print(f"    Image (from Google News): ✅ Found")
                    print(f"           {image[:70]}...")
                
                real_url = google_link
                if google_link and google_link.startswith('http'):
                    try:
                        response = requests.get(google_link, allow_redirects=True, timeout=5)
                        real_url = response.url
                        
                        # Normalize URL before checking
                        normalized_url = normalize_url(real_url)
                        print(f"    Real URL: {normalized_url[:60]}...")
                        
                        if normalized_url in existing_urls:
                            print(f"    ⏭️  SKIPPING - Already in database")
                            print()
                            continue
                        
                        # Update real_url to normalized version
                        real_url = normalized_url
                            
                    except:
                        pass
                
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
                    'published_datetime': published_datetime,
                    'published_text': published_text,
                    'google_link': google_link,
                    'real_url': real_url,
                    'image': image,
                    'query': query
                })
                
                print()
                time.sleep(1)
                
            except Exception as e:
                print(f"Error parsing article {i+1}: {e}\n")
                continue
        
        if sort_by_time and results:
            results.sort(key=lambda x: x['published_datetime'] if x['published_datetime'] else datetime.min, reverse=True)
            print(f"\n✅ Sorted {len(results)} articles by publication time (newest first)")
        
    finally:
        driver.quit()
    
    return results


if __name__ == "__main__":
    SEARCH_QUERY = "anime"
    MAX_ARTICLES = 50
    SCROLL_ATTEMPTS = 20
    SORT_BY_TIME = True
    TABLE_NAME = "news_articles"
    
    print(f"🚀 Starting Google News Scraper")
    print(f"Query: '{SEARCH_QUERY}'")
    print(f"Target: {MAX_ARTICLES} articles")
    print(f"Scroll attempts: {SCROLL_ATTEMPTS}")
    print(f"Sort by time: {'✅ Yes (newest first)' if SORT_BY_TIME else '❌ No (Google default)'}\n")
    print("="*80 + "\n")
    
    try:
        supabase = init_supabase()
        print("✅ Connected to Supabase\n")
    except Exception as e:
        print(f"⚠️  Could not connect to Supabase: {e}")
        print("Continuing without duplicate checking...\n")
        supabase = None
    
    articles = scrape_google_news(
        query=SEARCH_QUERY,
        max_articles=MAX_ARTICLES,
        scroll_attempts=SCROLL_ATTEMPTS,
        sort_by_time=SORT_BY_TIME,
        supabase_client=supabase
    )
    
    print("\n" + "="*80)
    print(f"📊 SCRAPED {len(articles)} ARTICLES")
    print("="*80 + "\n")
    
    for i, article in enumerate(articles, 1):
        print(f"{i}. {article['title']}")
        print(f"   Publisher: {article['publisher']}")
        print(f"   Published: {article['published_text'] or 'Unknown'}")
        if article['published_datetime']:
            print(f"   DateTime: {article['published_datetime'].strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"   URL: {article['real_url']}")
        print(f"   Image: {'✅ Yes' if article['image'] else '❌ No'}")
        print("-" * 80)
    
    print("\n" + "="*80)
    print("📤 UPLOADING TO SUPABASE")
    print("="*80 + "\n")
    
    if not supabase:
        try:
            supabase = init_supabase()
        except Exception as e:
            print(f"\n❌ Error connecting to Supabase: {e}")
            exit(1)
    
    try:
        uploaded, skipped, errors = upload_to_supabase(supabase, articles, TABLE_NAME)
        
        print("\n" + "="*80)
        print("✨ UPLOAD SUMMARY")
        print("="*80)
        print(f"✅ Uploaded: {uploaded}")
        print(f"⏭️  Skipped (already exists): {skipped}")
        print(f"❌ Errors: {errors}")
        print(f"📦 Total processed: {len(articles)}")
        print(f"⏰ TTL: 7 days (expires on {(datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')})")
        print("="*80)
        
    except Exception as e:
        print(f"\n❌ Error during upload: {e}")