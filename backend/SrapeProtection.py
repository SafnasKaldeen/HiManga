"""
HiManga.fun Bot Protection Penetration Test
URL Pattern: https://himanga.fun/manga/{id}/chapter/{id}
Image Structure: Cloudinary images in divs with specific classes
"""

import os
import time
import random
import base64
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from webdriver_manager.chrome import ChromeDriverManager


def create_advanced_stealth_driver(headless=False):
    """Most advanced anti-detection setup"""
    chrome_options = Options()
    
    if headless:
        chrome_options.add_argument('--headless=new')
    
    # Anti-detection essentials
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation", "enable-logging"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Realistic browser profile
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--start-maximized')
    chrome_options.add_argument('--disable-notifications')
    chrome_options.add_argument('--disable-popup-blocking')
    chrome_options.add_argument('--log-level=3')
    
    # Most recent Chrome user agent
    chrome_options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36')
    
    # Preferences
    chrome_options.add_experimental_option('prefs', {
        'intl.accept_languages': 'en-US,en;q=0.9',
        'profile.default_content_setting_values.notifications': 2,
        'credentials_enable_service': False,
        'profile.password_manager_enabled': False
    })
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    # Advanced stealth injection (FIXED version)
    stealth_js = """
    // Webdriver property
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
    });
    
    // Plugins
    Object.defineProperty(navigator, 'plugins', {
        get: () => [
            {name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format'},
            {name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: 'Portable Document Format'},
            {name: 'Native Client', filename: 'internal-nacl-plugin', description: 'Native Client Executable'}
        ]
    });
    
    // Languages
    Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
    });
    
    // Chrome object
    window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
    };
    
    // Permissions (FIXED - no Cypress reference)
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => {
        if (parameters.name === 'notifications') {
            return Promise.resolve({ state: 'default', onchange: null });
        }
        return originalQuery(parameters);
    };
    
    // Hardware
    Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 8
    });
    
    Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 8
    });
    
    // WebGL vendor
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return 'Google Inc. (NVIDIA)';
        if (parameter === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Direct3D11 vs_5_0 ps_5_0)';
        return getParameter.call(this, parameter);
    };
    
    // Connection
    Object.defineProperty(navigator, 'connection', {
        get: () => ({
            effectiveType: '4g',
            rtt: 50,
            downlink: 10,
            saveData: false
        })
    });
    
    // Battery
    navigator.getBattery = () => Promise.resolve({
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 0.95
    });
    
    // Remove automation indicators
    delete navigator.__proto__.webdriver;
    """
    
    driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {'source': stealth_js})
    
    # User agent metadata
    driver.execute_cdp_cmd('Network.setUserAgentOverride', {
        "userAgent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        "platform": "Win32",
        "userAgentMetadata": {
            "brands": [
                {"brand": "Chromium", "version": "122"},
                {"brand": "Google Chrome", "version": "122"},
                {"brand": "Not:A-Brand", "version": "99"}
            ],
            "fullVersion": "122.0.6261.112",
            "platform": "Windows",
            "platformVersion": "10.0.0",
            "architecture": "x86",
            "model": "",
            "mobile": False
        }
    })
    
    return driver


def human_delay(min_sec=2, max_sec=5):
    """Random human-like delay"""
    time.sleep(random.uniform(min_sec, max_sec))


def simulate_human_reading(driver):
    """Simulate human reading behavior"""
    try:
        # Scroll down gradually
        total_height = driver.execute_script("return document.body.scrollHeight")
        viewport_height = driver.execute_script("return window.innerHeight")
        current_position = 0
        
        print("   📖 Scrolling through content like a human...")
        
        while current_position < total_height:
            # Random scroll increment (humans don't scroll uniformly)
            scroll_amount = random.randint(200, 500)
            current_position += scroll_amount
            
            driver.execute_script(f"window.scrollTo({{top: {current_position}, behavior: 'smooth'}});")
            time.sleep(random.uniform(0.5, 1.5))
            
            # Sometimes scroll back (humans reread)
            if random.random() < 0.3:
                scroll_back = random.randint(50, 150)
                current_position -= scroll_back
                driver.execute_script(f"window.scrollTo({{top: {current_position}, behavior: 'smooth'}});")
                time.sleep(random.uniform(0.3, 0.8))
        
        # Scroll back to top
        driver.execute_script("window.scrollTo({top: 0, behavior: 'smooth'});")
        time.sleep(1)
        
    except Exception as e:
        print(f"   ⚠️  Simulation warning: {e}")


def test_page_access(driver, url, timeout=30):
    """Test if we can access a page"""
    print(f"\n🌐 Accessing: {url}")
    
    try:
        driver.get(url)
        human_delay(3, 5)
        
        # Check for bot challenge pages
        page_source = driver.page_source.lower()
        title = driver.title.lower()
        
        # Common bot protection indicators
        protection_indicators = [
            'checking your browser',
            'verifying you are human',
            'challenge',
            'cloudflare',
            'bot protection',
            'access denied',
            'just a moment',
            'please wait',
            'security check'
        ]
        
        for indicator in protection_indicators:
            if indicator in page_source or indicator in title:
                print(f"   🚫 Bot protection detected: '{indicator}'")
                return False, "challenge_page"
        
        # Check if page loaded actual content
        if len(page_source) < 1000:
            print(f"   ⚠️  Page content too short ({len(page_source)} chars) - likely blocked")
            return False, "blocked"
        
        print(f"   ✅ Page loaded successfully ({len(page_source)} chars)")
        return True, "success"
        
    except TimeoutException:
        print("   ❌ Timeout - page took too long to load")
        return False, "timeout"
    except Exception as e:
        print(f"   ❌ Error: {str(e)[:100]}")
        return False, f"error: {str(e)[:50]}"


def find_himanga_images(driver):
    """
    Find HiManga.fun specific manga images
    Structure: <div class="jsx-..."><img src="cloudinary..." /></div>
    """
    print("\n🔍 Searching for HiManga manga panel images...")
    
    # Your specific selectors based on the HTML structure
    selectors_to_try = [
        "div.relative.group img",  # Main selector from your structure
        "div[class*='jsx-'] img",  # JSX-generated class names
        "img[src*='cloudinary']",  # Cloudinary images
        "img[alt*='Panel']",  # Panel alt text
        "div.overflow-hidden img",  # Container class
        "div.border-cyan-500 img",  # Cyan border divs
    ]
    
    all_images = []
    
    for selector in selectors_to_try:
        try:
            images = driver.find_elements(By.CSS_SELECTOR, selector)
            if images:
                print(f"   ✓ Found {len(images)} images with selector: '{selector}'")
                all_images.extend(images)
        except Exception as e:
            continue
    
    # Remove duplicates and extract URLs
    unique_images = []
    seen_src = set()
    
    for img in all_images:
        try:
            src = img.get_attribute('src')
            alt = img.get_attribute('alt') or 'Unknown'
            
            if src and src not in seen_src and src.startswith('http'):
                seen_src.add(src)
                unique_images.append({
                    'url': src,
                    'alt': alt,
                    'is_cloudinary': 'cloudinary.com' in src
                })
        except:
            continue
    
    print(f"\n   ✅ Total unique panel images found: {len(unique_images)}")
    
    # Show sample URLs
    if unique_images:
        print(f"\n   📸 Sample image URLs:")
        for i, img in enumerate(unique_images[:3], 1):
            cloudinary_tag = " [CLOUDINARY]" if img['is_cloudinary'] else ""
            print(f"      {i}. {img['alt']}{cloudinary_tag}")
            print(f"         {img['url'][:100]}...")
    
    return unique_images


def download_image_test(driver, img_data, output_folder="downloaded_panels"):
    """Test downloading a manga panel image"""
    img_url = img_data['url']
    img_alt = img_data['alt']
    
    print(f"\n📥 Testing download: {img_alt}")
    print(f"   URL: {img_url[:100]}...")
    
    try:
        # Create output folder
        os.makedirs(output_folder, exist_ok=True)
        
        # Generate filename from alt text
        safe_filename = "".join(c for c in img_alt if c.isalnum() or c in (' ', '-', '_')).strip()
        output_path = os.path.join(output_folder, f"{safe_filename}.jpg")
        
        script = """
        async function getImageBase64(url) {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
                    }
                });
                
                if (!response.ok) {
                    return {success: false, error: `HTTP ${response.status}: ${response.statusText}`};
                }
                
                const blob = await response.blob();
                
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve({
                        success: true, 
                        data: reader.result,
                        size: blob.size,
                        type: blob.type
                    });
                    reader.onerror = () => resolve({success: false, error: 'FileReader error'});
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                return {success: false, error: error.message};
            }
        }
        return await getImageBase64(arguments[0]);
        """
        
        result = driver.execute_async_script(script, img_url)
        
        if result.get('success') and result.get('data'):
            base64_data = result['data']
            if base64_data.startswith('data:image'):
                base64_str = base64_data.split(',')[1]
                image_data = base64.b64decode(base64_str)
                
                with open(output_path, 'wb') as f:
                    f.write(image_data)
                
                file_size = len(image_data) / 1024  # KB
                print(f"   ✅ Successfully downloaded: {file_size:.1f} KB")
                print(f"   💾 Saved to: {output_path}")
                return True, output_path
        
        error_msg = result.get('error', 'Unknown error')
        print(f"   ❌ Download failed: {error_msg}")
        return False, None
        
    except Exception as e:
        print(f"   ❌ Exception: {str(e)[:100]}")
        return False, None


def run_himanga_pentest(manga_id, chapter_id, download_all=False):
    """
    Run complete penetration test on HiManga.fun
    
    Args:
        manga_id: Manga ID (e.g., 'solo-leveling-manhwa')
        chapter_id: Chapter ID (e.g., '001')
        download_all: If True, attempt to download all images
    """
    
    base_url = "https://himanga.fun"
    chapter_url = f"{base_url}/manga/{manga_id}/chapter/{chapter_id}"
    
    print("=" * 80)
    print("🔐 HIMANGA.FUN BOT PROTECTION PENETRATION TEST")
    print("=" * 80)
    print(f"\nTarget: {base_url}")
    print(f"Manga: {manga_id}")
    print(f"Chapter: {chapter_id}")
    print(f"Full URL: {chapter_url}")
    print(f"Download All: {download_all}")
    print("\n" + "=" * 80)
    
    results = {
        'homepage': None,
        'chapter_page': None,
        'images_found': 0,
        'images_downloaded': 0,
        'download_success_rate': 0
    }
    
    driver = create_advanced_stealth_driver(headless=False)
    
    try:
        # Test 1: Homepage access
        print("\n" + "=" * 80)
        print("📍 TEST 1: Homepage Access")
        print("=" * 80)
        success, status = test_page_access(driver, base_url)
        results['homepage'] = status
        
        if not success:
            print("\n🎉 GOOD NEWS: Bot protection blocked homepage!")
            print("   Your Vercel protection is working at the entry point.")
            return results
        
        # Test 2: Chapter page access
        print("\n" + "=" * 80)
        print("📍 TEST 2: Chapter Page Access")
        print("=" * 80)
        success, status = test_page_access(driver, chapter_url)
        results['chapter_page'] = status
        
        if not success:
            print("\n🎉 GOOD NEWS: Bot protection blocked chapter access!")
            print("   Scrapers can't reach the manga content.")
            return results
        
        # Test 3: Human behavior simulation
        print("\n" + "=" * 80)
        print("📍 TEST 3: Human Behavior Simulation")
        print("=" * 80)
        simulate_human_reading(driver)
        
        # Test 4: Find images
        print("\n" + "=" * 80)
        print("📍 TEST 4: Image Discovery")
        print("=" * 80)
        images = find_himanga_images(driver)
        results['images_found'] = len(images)
        
        if not images:
            print("\n⚠️  No manga images found!")
            print("   Possible reasons:")
            print("   - Bot protection is hiding images")
            print("   - Images load dynamically and need more wait time")
            print("   - Selector mismatch (unlikely with your provided HTML)")
            return results
        
        # Test 5: Download images
        print("\n" + "=" * 80)
        print("📍 TEST 5: Image Download Test")
        print("=" * 80)
        
        if download_all:
            print(f"   Attempting to download all {len(images)} images...\n")
            successful_downloads = []
            
            for i, img in enumerate(images, 1):
                print(f"\n   [{i}/{len(images)}]")
                success, path = download_image_test(driver, img)
                if success:
                    successful_downloads.append(path)
                    results['images_downloaded'] += 1
                
                # Respectful delay between downloads
                if i < len(images):
                    time.sleep(random.uniform(1, 2))
            
            results['download_success_rate'] = (results['images_downloaded'] / len(images)) * 100
            
        else:
            print(f"   Testing download on first image only...\n")
            success, path = download_image_test(driver, images[0])
            if success:
                results['images_downloaded'] = 1
                results['download_success_rate'] = 100
        
        return results
        
    finally:
        # Print comprehensive summary
        print("\n\n" + "=" * 80)
        print("📊 PENETRATION TEST SUMMARY")
        print("=" * 80)
        
        print(f"\n🌐 Access Results:")
        print(f"   Homepage Access:        {results['homepage']}")
        print(f"   Chapter Page Access:    {results['chapter_page']}")
        
        print(f"\n📸 Image Results:")
        print(f"   Images Found:           {results['images_found']}")
        print(f"   Images Downloaded:      {results['images_downloaded']}")
        if results['images_found'] > 0:
            print(f"   Download Success Rate:  {results['download_success_rate']:.1f}%")
        
        print("\n" + "=" * 80)
        print("🎯 VERDICT")
        print("=" * 80 + "\n")
        
        if results['homepage'] != 'success':
            print("✅ EXCELLENT PROTECTION!")
            print("   Your bot protection blocks scrapers at the homepage.")
            print("   No further access possible.\n")
            
        elif results['chapter_page'] != 'success':
            print("✅ GOOD PROTECTION!")
            print("   Scrapers can access homepage but not manga chapters.")
            print("   Content is protected.\n")
            
        elif results['images_found'] == 0:
            print("✅ DECENT PROTECTION!")
            print("   Scrapers can access pages but can't find images.")
            print("   Images may be dynamically loaded or obfuscated.\n")
            
        elif results['images_downloaded'] == 0:
            print("⚠️  PARTIAL PROTECTION!")
            print("   Scrapers can find images but can't download them.")
            print("   Consider this a moderate security level.\n")
            
        else:
            print("❌ WEAK PROTECTION!")
            print(f"   Scrapers successfully downloaded {results['images_downloaded']}/{results['images_found']} images.")
            print("\n💡 URGENT RECOMMENDATIONS:")
            print("   1. Enable stricter Vercel bot protection")
            print("   2. Implement signed/time-limited image URLs")
            print("   3. Add rate limiting per IP address")
            print("   4. Use image proxying through your API")
            print("   5. Add CAPTCHA for suspicious patterns")
            print("   6. Implement referrer checking on Cloudinary")
            print("   7. Enable hot-link protection\n")
        
        print("=" * 80 + "\n")
        
        input("Press Enter to close browser and exit...")
        driver.quit()


if __name__ == "__main__":
    print("\n🎯 HiManga.fun Bot Protection Penetration Tester\n")
    print("URL Pattern: https://himanga.fun/manga/{manga-id}/chapter/{chapter-id}\n")
    
    # Example: https://himanga.fun/manga/solo-leveling-manhwa/chapter/001
    manga_id = input("Enter manga ID (e.g., 'solo-leveling-manhwa'): ").strip()
    chapter_id = input("Enter chapter ID (e.g., '001'): ").strip()
    
    download_choice = input("\nDownload all images? (y/n) [n]: ").strip().lower()
    download_all = download_choice == 'y'
    
    if not manga_id or not chapter_id:
        print("\n❌ Both manga ID and chapter ID are required!")
        exit(1)
    
    print("\n🚀 Starting penetration test...\n")
    
    # Run the test
    run_himanga_pentest(manga_id, chapter_id, download_all)