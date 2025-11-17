import feedparser
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs

def extract_real_url(google_url):
    """
    Extract the real article URL from Google News redirect.
    """
    try:
        # Try to parse the URL parameter from Google's redirect
        parsed = urlparse(google_url)
        if 'url' in parse_qs(parsed.query):
            return parse_qs(parsed.query)['url'][0]
        
        # Otherwise follow redirects
        response = requests.get(google_url, timeout=5, allow_redirects=True)
        return response.url
    except:
        return google_url

def get_og_image(url):
    """
    Extract OpenGraph image from the real article URL.
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, timeout=10, headers=headers)
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Try multiple meta tags
        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            img_url = og_image["content"]
            # Filter out Google News icons
            if "gstatic.com" not in img_url and "google.com" not in img_url:
                return img_url
        
        # Try twitter:image as fallback
        twitter_image = soup.find("meta", attrs={"name": "twitter:image"})
        if twitter_image and twitter_image.get("content"):
            img_url = twitter_image["content"]
            if "gstatic.com" not in img_url and "google.com" not in img_url:
                return img_url
                
    except Exception as e:
        print(f"Error fetching image: {e}")
        return None
    return None


def fetch_google_news(query="anime"):
    """
    Scrapes Google News RSS, resolves real article links,
    extracts OG images, and returns structured results.
    """
    RSS_URL = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"

    print(f"\n🔎 Fetching Google News for: {query}\n")
    feed = feedparser.parse(RSS_URL)

    results = []

    for entry in feed.entries:
        title = entry.title
        published = entry.published if "published" in entry else None
        publisher = entry.source.title if "source" in entry else None

        # Google redirect URL
        google_news_link = entry.link

        # Resolve real URL
        real_url = extract_real_url(google_news_link)
        
        print(f"Fetching: {title[:50]}...")
        print(f"Real URL: {real_url}")

        # Extract OG image
        og_image = get_og_image(real_url)
        print(f"Image: {og_image}\n")

        # Parse description text (removes HTML)
        description = BeautifulSoup(entry.description, "html.parser").get_text()

        results.append({
            "title": title,
            "publisher": publisher,
            "published": published,
            "google_news_link": google_news_link,
            "real_url": real_url,
            "description": description,
            "image": og_image
        })

    return results


# ---------------------------
# RUN SCRAPER
# ---------------------------

if __name__ == "__main__":
    data = fetch_google_news("anime")

    print("\n📰 RESULTS:\n")
    for article in data:
        print(article)
        print("-" * 80)