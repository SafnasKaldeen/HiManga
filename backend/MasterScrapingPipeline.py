#!/usr/bin/env python3
"""
MASTER MANGA PIPELINE ORCHESTRATOR
Handles: Scraping -> Verification -> Re-download -> Upload to Cloudinary
"""

import os
import sys
import time
import json
import csv
from datetime import datetime
from pathlib import Path

# Import from your existing modules
# Assuming manga_scraper.py and cloudinary_manager.py are in the same directory
try:
    from manga_scraper import (
        get_manga_slug_from_url,
        scrape_all_chapters,
        verify_all_chapters_local,
        redownload_chapters,
        get_all_chapters
    )
    from cloudinary_manager import (
        auto_upload_missing,
        get_all_public_ids_with_extension,
        normalize_extension
    )
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("Make sure manga_scraper.py and cloudinary_manager.py are in the same directory")
    sys.exit(1)


# ============================================
# CONFIGURATION
# ============================================

BASE_PATH = r"E:\UOM\My-CODE_RUSH\projects\HiManga\public"
METADATA_CSV = os.path.join(BASE_PATH, 'manga_metadata.csv')
CLOUDINARY_BASE = "manga"  # Base folder in Cloudinary
MAX_RETRY_ATTEMPTS = 3  # Maximum retry attempts for failed chapters
PIPELINE_LOG = os.path.join(BASE_PATH, 'pipeline_log.json')


# ============================================
# PIPELINE STATE MANAGEMENT
# ============================================

class PipelineState:
    """Track pipeline state across runs"""
    
    def __init__(self, log_file=PIPELINE_LOG):
        self.log_file = log_file
        self.state = self.load_state()
    
    def load_state(self):
        """Load existing state or create new"""
        if os.path.exists(self.log_file):
            try:
                with open(self.log_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def save_state(self):
        """Save current state"""
        os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
        with open(self.log_file, 'w', encoding='utf-8') as f:
            json.dump(self.state, f, indent=2, ensure_ascii=False)
    
    def get_manga_state(self, manga_slug):
        """Get state for specific manga"""
        return self.state.get(manga_slug, {
            'status': 'not_started',
            'last_run': None,
            'scraping_complete': False,
            'verification_complete': False,
            'upload_complete': False,
            'retry_count': 0,
            'failed_chapters': []
        })
    
    def update_manga_state(self, manga_slug, updates):
        """Update state for specific manga"""
        current = self.get_manga_state(manga_slug)
        current.update(updates)
        current['last_run'] = datetime.now().isoformat()
        self.state[manga_slug] = current
        self.save_state()


# ============================================
# CORE PIPELINE FUNCTIONS
# ============================================

def print_header(title):
    """Print formatted section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80 + "\n")


def print_step(step_num, total_steps, description):
    """Print step information"""
    print(f"\n{'─'*80}")
    print(f"📍 STEP {step_num}/{total_steps}: {description}")
    print(f"{'─'*80}\n")


def step1_scrape_manga(manga_url, manga_name, manga_slug, start_chapter=1, end_chapter=None):
    """
    Step 1: Scrape all chapters from manga website
    Returns: (success, total_chapters, failed_chapters)
    """
    print_step(1, 5, "SCRAPING MANGA CHAPTERS")
    
    try:
        print(f"📚 Manga: {manga_name}")
        print(f"🔗 URL: {manga_url}")
        print(f"📂 Output: {os.path.join(BASE_PATH, manga_slug)}")
        
        # Get total chapter count first
        all_chapters = get_all_chapters(manga_url)
        if not all_chapters:
            print("❌ Failed to get chapter list")
            return False, 0, []
        
        total_chapters = len(all_chapters)
        print(f"📊 Total chapters available: {total_chapters}")
        
        if end_chapter:
            print(f"🎯 Downloading chapters {start_chapter} to {end_chapter}")
        else:
            print(f"🎯 Downloading all chapters from {start_chapter}")
        
        # Start scraping
        scrape_all_chapters(
            manga_url=manga_url,
            manga_name=manga_name,
            manga_slug=manga_slug,
            base_path=BASE_PATH,
            start_chapter=start_chapter,
            end_chapter=end_chapter
        )
        
        # Count failed chapters from metadata
        failed_chapters = get_failed_chapters_from_metadata(manga_slug)
        
        print(f"\n✅ Scraping complete!")
        print(f"📊 Total chapters: {total_chapters}")
        print(f"❌ Failed: {len(failed_chapters)}")
        
        return True, total_chapters, failed_chapters
        
    except Exception as e:
        print(f"❌ Scraping error: {e}")
        return False, 0, []


def step2_verify_chapters(manga_slug):
    """
    Step 2: Verify all downloaded chapters
    Returns: (success, chapters_to_fix)
    """
    print_step(2, 5, "VERIFYING DOWNLOADED CHAPTERS")
    
    try:
        chapters_to_fix = verify_all_chapters_local(
            manga_slug=manga_slug,
            base_path=BASE_PATH,
            metadata_csv_path=METADATA_CSV
        )
        
        if len(chapters_to_fix) == 0:
            print("\n✅ All chapters verified successfully!")
            return True, []
        else:
            print(f"\n⚠️  Found {len(chapters_to_fix)} chapters that need fixing")
            return True, chapters_to_fix
            
    except Exception as e:
        print(f"❌ Verification error: {e}")
        return False, []


def step3_fix_failed_chapters(manga_url, manga_name, manga_slug, failed_chapters, retry_count=0):
    """
    Step 3: Re-download failed/incomplete chapters
    Returns: (success, remaining_failed_chapters)
    """
    if not failed_chapters:
        print_step(3, 5, "FIX FAILED CHAPTERS - Skipped (no failures)")
        return True, []
    
    print_step(3, 5, f"FIXING {len(failed_chapters)} FAILED CHAPTERS (Attempt {retry_count + 1}/{MAX_RETRY_ATTEMPTS})")
    
    try:
        redownload_chapters(
            manga_url=manga_url,
            manga_name=manga_name,
            manga_slug=manga_slug,
            base_path=BASE_PATH,
            chapter_numbers=failed_chapters,
            metadata_csv_path=METADATA_CSV
        )
        
        # Verify again after re-download
        print("\n🔍 Re-verifying fixed chapters...")
        still_failed = verify_all_chapters_local(
            manga_slug=manga_slug,
            base_path=BASE_PATH,
            metadata_csv_path=METADATA_CSV
        )
        
        if len(still_failed) == 0:
            print("✅ All chapters fixed successfully!")
            return True, []
        else:
            print(f"⚠️  {len(still_failed)} chapters still have issues")
            return True, still_failed
            
    except Exception as e:
        print(f"❌ Fix error: {e}")
        return False, failed_chapters


def step4_upload_to_cloudinary(manga_slug):
    """
    Step 4: Upload to Cloudinary
    Returns: (success, uploaded_count, failed_count)
    """
    print_step(4, 5, "UPLOADING TO CLOUDINARY")
    
    try:
        local_folder = os.path.join(BASE_PATH, manga_slug)
        cloudinary_base = f"{CLOUDINARY_BASE}/{manga_slug}"
        
        print(f"📁 Local: {local_folder}")
        print(f"☁️  Cloudinary: {cloudinary_base}")
        
        if not os.path.exists(local_folder):
            print(f"❌ Local folder not found: {local_folder}")
            return False, 0, 0
        
        # Use the auto-upload function from cloudinary_manager
        # We need to implement a return value version
        uploaded, failed = upload_manga_to_cloudinary(local_folder, cloudinary_base)
        
        print(f"\n✅ Upload complete!")
        print(f"📤 Uploaded: {uploaded}")
        print(f"❌ Failed: {failed}")
        
        return True, uploaded, failed
        
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return False, 0, 0


def step5_final_verification(manga_slug):
    """
    Step 5: Final verification (local + cloudinary)
    Returns: (success, summary)
    """
    print_step(5, 5, "FINAL VERIFICATION")
    
    try:
        # Verify local files
        print("🔍 Verifying local files...")
        local_issues = verify_all_chapters_local(
            manga_slug=manga_slug,
            base_path=BASE_PATH,
            metadata_csv_path=METADATA_CSV
        )
        
        # Verify cloudinary upload
        print("\n🔍 Verifying Cloudinary upload...")
        local_folder = os.path.join(BASE_PATH, manga_slug)
        cloudinary_base = f"{CLOUDINARY_BASE}/{manga_slug}"
        
        local_files = get_local_image_files(local_folder, cloudinary_base)
        cloudinary_files = get_all_public_ids_with_extension(cloudinary_base)
        
        missing_in_cloudinary = local_files - cloudinary_files
        
        summary = {
            'local_issues': len(local_issues),
            'missing_in_cloudinary': len(missing_in_cloudinary),
            'local_chapters': count_local_chapters(manga_slug),
            'cloudinary_files': len(cloudinary_files)
        }
        
        print("\n" + "="*80)
        print("📊 FINAL VERIFICATION SUMMARY")
        print("="*80)
        print(f"📁 Local chapters: {summary['local_chapters']}")
        print(f"❌ Local issues: {summary['local_issues']}")
        print(f"☁️  Cloudinary files: {summary['cloudinary_files']}")
        print(f"❌ Missing in Cloudinary: {summary['missing_in_cloudinary']}")
        
        success = (summary['local_issues'] == 0 and summary['missing_in_cloudinary'] == 0)
        
        if success:
            print("\n✅ ALL VERIFICATIONS PASSED!")
        else:
            print("\n⚠️  Some issues remain")
        
        return success, summary
        
    except Exception as e:
        print(f"❌ Verification error: {e}")
        return False, {}


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_failed_chapters_from_metadata(manga_slug):
    """Get list of failed chapter numbers from metadata"""
    failed = []
    
    if not os.path.exists(METADATA_CSV):
        return failed
    
    with open(METADATA_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['manga_slug'] == manga_slug:
                status = row.get('status', '')
                panel_count = int(row.get('panel_count', 0))
                expected_count = int(row.get('expected_count', 0))
                
                if status == 'failed' or (expected_count > 0 and panel_count != expected_count):
                    chapter_num = int(row['chapter_number'])
                    failed.append(chapter_num)
    
    return failed


def get_local_image_files(local_folder, cloudinary_base):
    """Get set of all local image files with cloudinary path format"""
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff'}
    local_files = set()
    
    for root, dirs, files in os.walk(local_folder):
        for file in files:
            if Path(file).suffix.lower() in image_extensions:
                full_path = os.path.join(root, file)
                relative_path = os.path.relpath(full_path, local_folder)
                cloudinary_path = f"{cloudinary_base}/{relative_path}".replace('\\', '/')
                local_files.add(normalize_extension(cloudinary_path))
    
    return local_files


def count_local_chapters(manga_slug):
    """Count number of chapter folders"""
    manga_path = os.path.join(BASE_PATH, manga_slug)
    if not os.path.exists(manga_path):
        return 0
    
    chapters = [d for d in os.listdir(manga_path) 
                if d.startswith('chapter-') and os.path.isdir(os.path.join(manga_path, d))]
    return len(chapters)


def upload_manga_to_cloudinary(local_folder, cloudinary_base):
    """
    Upload manga to Cloudinary and return counts
    Returns: (uploaded_count, failed_count)
    """
    from cloudinary_manager import get_all_public_ids_with_extension
    import cloudinary.uploader
    import cloudinary.api
    
    # Get local and cloudinary files
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff'}
    local_files_map = {}
    
    for root, dirs, files in os.walk(local_folder):
        for file in files:
            if Path(file).suffix.lower() in image_extensions:
                full_path = os.path.join(root, file)
                relative_path = os.path.relpath(full_path, local_folder)
                cloudinary_path = f"{cloudinary_base}/{relative_path}".replace('\\', '/')
                normalized_path = normalize_extension(cloudinary_path)
                local_files_map[normalized_path] = full_path
    
    cloudinary_files = get_all_public_ids_with_extension(cloudinary_base)
    missing_in_cloudinary = set(local_files_map.keys()) - cloudinary_files
    
    if len(missing_in_cloudinary) == 0:
        print("✅ All files already in Cloudinary")
        return 0, 0
    
    print(f"📤 Uploading {len(missing_in_cloudinary)} missing files...")
    
    # Create folder structure
    folders_to_create = set()
    for cloudinary_path in missing_in_cloudinary:
        folder_path = '/'.join(cloudinary_path.split('/')[:-1])
        if folder_path:
            parts = folder_path.split('/')
            for i in range(len(parts)):
                folder = '/'.join(parts[:i+1])
                folders_to_create.add(folder)
    
    for folder in sorted(folders_to_create):
        try:
            cloudinary.api.create_folder(folder)
        except:
            pass  # Folder might already exist
    
    # Upload files
    uploaded = 0
    failed = 0
    
    for cloudinary_path in sorted(missing_in_cloudinary):
        local_path = local_files_map[cloudinary_path]
        path_parts = cloudinary_path.split('/')
        filename_no_ext = os.path.splitext(path_parts[-1])[0]
        folder_path = '/'.join(path_parts[:-1])
        
        try:
            upload_params = {
                'public_id': filename_no_ext,
                'overwrite': False,
                'resource_type': "auto",
                'use_filename': False,
                'unique_filename': False
            }
            
            if folder_path:
                upload_params['folder'] = folder_path
            
            cloudinary.uploader.upload(local_path, **upload_params)
            uploaded += 1
            print(f"✅ [{uploaded + failed}/{len(missing_in_cloudinary)}] Uploaded: {cloudinary_path}")
            
        except Exception as e:
            failed += 1
            print(f"❌ [{uploaded + failed}/{len(missing_in_cloudinary)}] Failed: {cloudinary_path}")
    
    return uploaded, failed


# ============================================
# MAIN ORCHESTRATOR
# ============================================

def run_full_pipeline(manga_url, manga_name=None, start_chapter=1, end_chapter=None, force_restart=False):
    """
    Run complete pipeline for a manga
    Returns: (success, final_summary)
    """
    print_header("🚀 MANGA PIPELINE ORCHESTRATOR")
    
    # Extract manga slug
    manga_slug = get_manga_slug_from_url(manga_url)
    if not manga_slug:
        print("❌ Invalid manga URL")
        return False, {}
    
    if not manga_name:
        manga_name = manga_slug.replace('-', ' ').title()
    
    # Initialize state
    state = PipelineState()
    manga_state = state.get_manga_state(manga_slug)
    
    print(f"📚 Manga: {manga_name}")
    print(f"🏷️  Slug: {manga_slug}")
    print(f"📍 Current state: {manga_state['status']}")
    
    if not force_restart and manga_state.get('upload_complete'):
        print("\n✅ This manga has already been fully processed!")
        print("Use force_restart=True to reprocess")
        return True, manga_state
    
    # Track overall success
    pipeline_success = True
    failed_chapters = []
    
    try:
        # STEP 1: Scrape
        if not manga_state.get('scraping_complete') or force_restart:
            success, total_chapters, failed = step1_scrape_manga(
                manga_url, manga_name, manga_slug, start_chapter, end_chapter
            )
            
            if not success:
                state.update_manga_state(manga_slug, {'status': 'scraping_failed'})
                return False, {}
            
            state.update_manga_state(manga_slug, {
                'scraping_complete': True,
                'total_chapters': total_chapters,
                'failed_chapters': failed
            })
            failed_chapters = failed
        else:
            print_step(1, 5, "SCRAPING - Skipped (already complete)")
            failed_chapters = manga_state.get('failed_chapters', [])
        
        # STEP 2: Verify
        success, chapters_to_fix = step2_verify_chapters(manga_slug)
        if not success:
            state.update_manga_state(manga_slug, {'status': 'verification_failed'})
            return False, {}
        
        failed_chapters.extend(chapters_to_fix)
        failed_chapters = list(set(failed_chapters))  # Remove duplicates
        
        # STEP 3: Fix failed chapters (with retry logic)
        retry_count = manga_state.get('retry_count', 0)
        while failed_chapters and retry_count < MAX_RETRY_ATTEMPTS:
            success, still_failed = step3_fix_failed_chapters(
                manga_url, manga_name, manga_slug, failed_chapters, retry_count
            )
            
            if not success:
                break
            
            if len(still_failed) == 0:
                break
            
            if len(still_failed) >= len(failed_chapters):
                # No progress made
                retry_count += 1
                state.update_manga_state(manga_slug, {'retry_count': retry_count})
                
                if retry_count >= MAX_RETRY_ATTEMPTS:
                    print(f"\n⚠️  Reached max retry attempts ({MAX_RETRY_ATTEMPTS})")
                    print(f"❌ {len(still_failed)} chapters still failed")
                    pipeline_success = False
                    break
            else:
                # Progress made, reset retry count
                retry_count = 0
                state.update_manga_state(manga_slug, {'retry_count': 0})
            
            failed_chapters = still_failed
            time.sleep(5)  # Wait before retry
        
        state.update_manga_state(manga_slug, {
            'verification_complete': True,
            'failed_chapters': failed_chapters
        })
        
        # STEP 4: Upload to Cloudinary
        success, uploaded, upload_failed = step4_upload_to_cloudinary(manga_slug)
        if not success:
            state.update_manga_state(manga_slug, {'status': 'upload_failed'})
            return False, {}
        
        state.update_manga_state(manga_slug, {
            'upload_complete': True,
            'uploaded_count': uploaded,
            'upload_failed_count': upload_failed
        })
        
        # STEP 5: Final verification
        success, summary = step5_final_verification(manga_slug)
        
        # Update final state
        final_status = 'complete' if (success and len(failed_chapters) == 0) else 'complete_with_errors'
        state.update_manga_state(manga_slug, {
            'status': final_status,
            'final_summary': summary,
            'completed_at': datetime.now().isoformat()
        })
        
        # Print final summary
        print_header("🎉 PIPELINE COMPLETE!")
        print(f"📚 Manga: {manga_name}")
        print(f"📊 Status: {final_status.upper()}")
        print(f"📁 Local chapters: {summary.get('local_chapters', 0)}")
        print(f"☁️  Cloudinary files: {summary.get('cloudinary_files', 0)}")
        print(f"❌ Failed chapters: {len(failed_chapters)}")
        
        if failed_chapters:
            print(f"\n⚠️  Failed chapter numbers: {', '.join(map(str, sorted(failed_chapters)))}")
        
        print(f"\n📝 Full log saved to: {PIPELINE_LOG}")
        print("="*80 + "\n")
        
        return (success and len(failed_chapters) == 0), summary
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Pipeline interrupted by user")
        state.update_manga_state(manga_slug, {'status': 'interrupted'})
        return False, {}
    except Exception as e:
        print(f"\n❌ Pipeline error: {e}")
        state.update_manga_state(manga_slug, {'status': 'error', 'error': str(e)})
        return False, {}


# ============================================
# BATCH PROCESSING
# ============================================

def process_manga_list(manga_list):
    """
    Process multiple manga in sequence
    manga_list: List of dicts with keys: url, name (optional), start_chapter, end_chapter
    """
    print_header("📚 BATCH MANGA PROCESSING")
    
    results = []
    
    for i, manga_info in enumerate(manga_list, 1):
        print(f"\n{'='*80}")
        print(f"Processing Manga {i}/{len(manga_list)}")
        print(f"{'='*80}\n")
        
        success, summary = run_full_pipeline(
            manga_url=manga_info['url'],
            manga_name=manga_info.get('name'),
            start_chapter=manga_info.get('start_chapter', 1),
            end_chapter=manga_info.get('end_chapter')
        )
        
        results.append({
            'manga': manga_info.get('name', manga_info['url']),
            'success': success,
            'summary': summary
        })
        
        # Wait between manga to avoid rate limiting
        if i < len(manga_list):
            print(f"\n⏳ Waiting 10 seconds before next manga...")
            time.sleep(10)
    
    # Print batch summary
    print_header("📊 BATCH PROCESSING SUMMARY")
    
    successful = sum(1 for r in results if r['success'])
    print(f"✅ Successful: {successful}/{len(manga_list)}")
    print(f"❌ Failed: {len(manga_list) - successful}/{len(manga_list)}")
    
    print("\nDetails:")
    for result in results:
        status = "✅" if result['success'] else "❌"
        print(f"  {status} {result['manga']}")
    
    return results


# ============================================
# CLI INTERFACE
# ============================================

def main():
    """Interactive CLI"""
    print_header("🚀 MASTER MANGA PIPELINE")
    
    print("Choose mode:")
    print("1. Process single manga")
    print("2. Process multiple manga (batch)")
    print("3. Resume failed manga from log")
    print("4. View pipeline status")
    
    choice = input("\nEnter choice (1-4): ").strip()
    
    if choice == "1":
        manga_url = input("\nEnter manga URL: ").strip()
        manga_name = input("Enter manga name (optional): ").strip() or None
        
        start = input("Start chapter (default: 1): ").strip()
        start_chapter = int(start) if start else 1
        
        end = input("End chapter (optional): ").strip()
        end_chapter = int(end) if end else None
        
        force = input("Force restart? (y/n, default: n): ").strip().lower()
        force_restart = (force == 'y')
        
        run_full_pipeline(manga_url, manga_name, start_chapter, end_chapter, force_restart)
    
    elif choice == "2":
        print("\nEnter manga URLs (one per line, empty line to finish):")
        manga_list = []
        
        while True:
            url = input("Manga URL: ").strip()
            if not url:
                break
            
            name = input("  Name (optional): ").strip() or None
            start = input("  Start chapter (default: 1): ").strip()
            end = input("  End chapter (optional): ").strip()
            
            manga_list.append({
                'url': url,
                'name': name,
                'start_chapter': int(start) if start else 1,
                'end_chapter': int(end) if end else None
            })
        
        if manga_list:
            process_manga_list(manga_list)
        else:
            print("No manga added")
    
    elif choice == "3":
        # Resume failed manga
        state = PipelineState()
        
        failed_manga = [
            slug for slug, data in state.state.items()
            if data.get('status') not in ['complete', 'interrupted']
        ]
        
        if not failed_manga:
            print("\n✅ No failed manga found")
            return
        
        print(f"\n📋 Found {len(failed_manga)} incomplete manga:")
        for i, slug in enumerate(failed_manga, 1):
            status = state.state[slug].get('status', 'unknown')
            print(f"  {i}. {slug} ({status})")
        
        retry = input("\nRetry all? (y/n): ").strip().lower()
        if retry == 'y':
            for slug in failed_manga:
                manga_state = state.get_manga_state(slug)
                # Would need to reconstruct URL - simplified for now
                print(f"\n⚠️  Manual retry needed for: {slug}")
                print(f"    Last status: {manga_state.get('status')}")
    
    elif choice == "4":
        # View status
        state = PipelineState()
        
        if not state.state:
            print("\n📭 No manga processed yet")
            return
        
        print(f"\n📊 Pipeline Status ({len(state.state)} manga):\n")
        
        for slug, data in sorted(state.state.items()):
            status = data.get('status', 'unknown')
            last_run = data.get('last_run', 'never')
            
            status_icon = {
                'complete': '✅',
                'complete_with_errors': '⚠️ ',
                'interrupted': '🛑',
                'error': '❌',
                'not_started': '⏳'
            }.get(status, '❓')
            
            print(f"{status_icon} {slug}")
            print(f"   Status: {status}")
            print(f"   Last run: {last_run[:19] if last_run != 'never' else 'never'}")
            
            if data.get('failed_chapters'):
                print(f"   Failed chapters: {len(data['failed_chapters'])}")
            
            print()


if __name__ == "__main__":
    main()