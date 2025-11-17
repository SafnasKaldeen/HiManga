import feedparser
import requests
import base64
from bs4 import BeautifulSoup
from time import sleep


def decode_google_news_url(source_url):
    """
    Decode Google News RSS URL to get the real article URL.
    Works with URLs like: https://news.google.com/rss/articles/CBMi...
    """
    try:
        # Check if it's a Google News RSS URL
        if not source_url.startswith("https://news.google.com/rss/articles/"):
            return source_url
        
        # Extract the encoded part after '/articles/'
        encoded_part = source_url.split('/articles/')[1].split('?')[0]
        
        # Add padding to make it valid base64
        encoded_part += '=' * (4 - len(encoded_part) % 4)
        
        # Decode from base64
        decoded_bytes = base64.urlsafe_b64decode(encoded_part)
        decoded_str = decoded_bytes.decode('latin1')
        
        # Remove prefix bytes (0x08, 0x13, 0x22)
        prefix = bytes([0x08, 0x13, 0x22]).decode('latin1')
        if decoded_str.startswith(prefix):
            decoded_str = decoded_str[len(prefix):]
        
        # Remove suffix bytes (0xd2, 0x01, 0x00)
        suffix = bytes([0xd2, 0x01, 0x00]).decode('latin1')
        if decoded_str.endswith(suffix):
            decoded_str = decoded_str[:-len(suffix)]
        
        # Extract the URL based on the length byte
        bytes_array = bytearray(decoded_str, 'latin1')
        length = bytes_array[0]
        
        if length >= 0x80:
            decoded_str = decoded_str[2:length+2]
        else:
            decoded_str = decoded_str[1:length+1]
        
        # Return the decoded URL if it's valid
        if decoded_str.startswith('http'):
            return decoded_str
            
        return source_url
        
    except Exception as e:
        print(f"  Error decoding URL: {e}")
        return source_url


def get_og_image(url, timeout=10):
    """
    Extract OpenGraph image from the article URL.
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        
        response = requests.get(url, timeout=timeout, headers=headers, allow_redirects=True)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, "html.parser")
        
        # Try og:image
        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            img_url = og_image["content"]
            # Filter out Google/generic icons
            if not any(domain in img_url.lower() for domain in ["gstatic.com", "googleusercontent.com", "google.com/images"]):
                return img_url
        
        # Try twitter:image
        twitter_image = soup.find("meta", attrs={"name": "twitter:image"})
        if twitter_image and twitter_image.get("content"):
            img_url = twitter_image["content"]
            if not any(domain in img_url.lower() for domain in ["gstatic.com", "googleusercontent.com", "google.com/images"]):
                return img_url
        
        # Try twitter:image:src
        twitter_image_src = soup.find("meta", attrs={"property": "twitter:image:src"})
        if twitter_image_src and twitter_image_src.get("content"):
            img_url = twitter_image_src["content"]
            if not any(domain in img_url.lower() for domain in ["gstatic.com", "googleusercontent.com", "google.com/images"]):
                return img_url
                
    except requests.exceptions.Timeout:
        print(f"Timeout fetching image from: {url}")
    except requests.exceptions.RequestException as e:
        print(f"Error fetching image from {url}: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")
        
    return None


def fetch_google_news(query="anime", max_results=10):
    """
    Scrapes Google News RSS, resolves real article links,
    extracts OG images, and returns structured results.
    """
    RSS_URL = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"

    print(f"\n🔎 Fetching Google News for: {query}\n")
    feed = feedparser.parse(RSS_URL)

    results = []
    count = 0

    for entry in feed.entries:
        if count >= max_results:
            break
            
        title = entry.title
        published = entry.published if "published" in entry else None
        publisher = entry.source.title if "source" in entry else None
        description = BeautifulSoup(entry.description, "html.parser").get_text() if "description" in entry else ""

        # Google News RSS link
        google_news_link = entry.link

        print(f"[{count+1}/{max_results}] Processing: {title[:60]}...")
        
        # Decode the Google News URL to get real article URL
        real_url = decode_google_news_url(google_news_link)
        print(f"  Real URL: {real_url[:80]}...")

        # Extract OG image from the real article
        og_image = None
        if real_url and real_url.startswith('http'):
            og_image = get_og_image(real_url)
            if og_image:
                print(f"  ✓ Image found: {og_image[:80]}...")
            else:
                print(f"  ✗ No valid image found")
        
        results.append({
            "title": title,
            "publisher": publisher,
            "published": published,
            "google_news_link": google_news_link,
            "real_url": real_url,
            "description": description,
            "image": og_image
        })
        
        count += 1
        
        # Add a small delay to be respectful to servers
        sleep(0.5)

    return results


# ---------------------------
# RUN SCRAPER
# ---------------------------

if __name__ == "__main__":
    # Fetch anime news
    data = fetch_google_news("anime", max_results=5)

    print("\n" + "="*80)
    print("📰 RESULTS:\n")
    print("="*80 + "\n")
    
    for i, article in enumerate(data, 1):
        print(f"{i}. {article['title']}")
        print(f"   Publisher: {article['publisher']}")
        print(f"   Published: {article['published']}")
        print(f"   URL: {article['real_url']}")
        print(f"   Image: {article['image']}")
        print("-" * 80)