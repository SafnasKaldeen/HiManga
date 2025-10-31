#!/usr/bin/env python3
"""
CLOUDINARY MANAGER
Interactive tool for managing Cloudinary images
"""

import cloudinary
import cloudinary.api
import cloudinary.uploader
import json
import csv
import os
from pathlib import Path
from datetime import datetime

# ============================================
# CONFIGURATION
# ============================================

cloudinary.config(
    cloud_name="dk9ywbxu1",
    api_key="542786312744176",
    api_secret="Z6K9BvGQ7QtKGWpk2-bbgoSBUJg"
)

# ============================================
# MENU SYSTEM
# ============================================

def show_menu():
    """Display main menu and get user choice"""
    print("\n" + "="*60)
    print("🌥️  CLOUDINARY MANAGER")
    print("="*60)
    print("\n📋 Choose an option:\n")
    print("1. 📤 Upload local images (preserving folder structure)")
    print("2. 📥 Extract metadata from Cloudinary")
    print("3. 📁 List all folders")
    print("4. 🏷️  Search by tag")
    print("5. 🔍 Compare local vs Cloudinary (find missing)")
    print("6. 🗑️  Delete images from Cloudinary")
    print("7. ⚡ AUTO-UPLOAD MISSING FILES (Smart Upload)")
    print("8. ❌ Exit")
    print("\n" + "="*60)
    
    choice = input("\n👉 Enter your choice (1-8): ").strip()
    return choice


# ============================================
# HELPER FUNCTION: NORMALIZE EXTENSIONS
# ============================================

def normalize_extension(path):
    """Normalize file extensions (treat jpg and jpeg as the same)"""
    if path.endswith('.jpeg'):
        return path[:-5] + '.jpg'
    return path


# ============================================
# OPTION 7: AUTO-UPLOAD MISSING FILES
# ============================================

def auto_upload_missing():
    """Compare local vs Cloudinary and automatically upload missing files"""
    print("\n⚡ AUTO-UPLOAD MISSING FILES")
    print("="*60)
    
    # Get paths
    local_folder = input("\n📁 Enter local folder path: ").strip()
    
    if not os.path.exists(local_folder):
        print(f"❌ Folder not found: {local_folder}")
        return
    
    cloudinary_base = input("☁️  Enter Cloudinary base folder (e.g., manga/one-piece): ").strip()
    
    print("\n" + "="*60)
    print("STEP 1: COMPARING LOCAL vs CLOUDINARY")
    print("="*60)
    
    # Step 1: Scan local files
    print("\n🔍 Scanning local files...")
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff'}
    local_files_map = {}  # Maps normalized cloudinary_path -> local_file_path
    
    for root, dirs, files in os.walk(local_folder):
        for file in files:
            if Path(file).suffix.lower() in image_extensions:
                full_path = os.path.join(root, file)
                relative_path = os.path.relpath(full_path, local_folder)
                
                # Build expected Cloudinary path WITH extension
                if cloudinary_base:
                    cloudinary_path = f"{cloudinary_base}/{relative_path}".replace('\\', '/')
                else:
                    cloudinary_path = relative_path.replace('\\', '/')
                
                # Normalize the path
                normalized_path = normalize_extension(cloudinary_path)
                local_files_map[normalized_path] = full_path
    
    print(f"✅ Found {len(local_files_map)} local images")
    
    # Step 2: Get Cloudinary files
    print("\n🔍 Fetching Cloudinary images...")
    cloudinary_files = get_all_public_ids_with_extension(cloudinary_base)
    print(f"✅ Found {len(cloudinary_files)} Cloudinary images")
    
    # Step 3: Find missing files
    local_files_set = set(local_files_map.keys())
    missing_in_cloudinary = local_files_set - cloudinary_files
    
    print("\n" + "="*60)
    print("📊 COMPARISON RESULTS")
    print("="*60)
    print(f"📁 Local files: {len(local_files_set)}")
    print(f"☁️  Cloudinary files: {len(cloudinary_files)}")
    print(f"❌ Missing in Cloudinary: {len(missing_in_cloudinary)}")
    
    if len(missing_in_cloudinary) == 0:
        print("\n✅ All files are already in Cloudinary! Nothing to upload.")
        return
    
    # Show preview of missing files
    print("\n📋 Preview of missing files:")
    for i, file_path in enumerate(sorted(list(missing_in_cloudinary)[:10]), 1):
        print(f"   {i}. {file_path}")
    if len(missing_in_cloudinary) > 10:
        print(f"   ... and {len(missing_in_cloudinary) - 10} more")
    
    # Confirm upload
    print("\n" + "="*60)
    print("STEP 2: UPLOAD MISSING FILES")
    print("="*60)
    confirm = input(f"\n⚡ Auto-upload {len(missing_in_cloudinary)} missing images? (y/n): ").strip().lower()
    
    if confirm != 'y':
        print("❌ Upload cancelled")
        return
    
    # Step 4: Create folder structure
    print("\n📁 Creating folder structure...")
    folders_to_create = set()
    
    for cloudinary_path in missing_in_cloudinary:
        # Extract folder path (everything before the filename)
        folder_path = '/'.join(cloudinary_path.split('/')[:-1])
        if folder_path:
            # Add all parent folders
            parts = folder_path.split('/')
            for i in range(len(parts)):
                folder = '/'.join(parts[:i+1])
                folders_to_create.add(folder)
    
    # Create folders
    for folder in sorted(folders_to_create):
        try:
            cloudinary.api.create_folder(folder)
            print(f"✅ Created: {folder}")
        except Exception as e:
            if 'already exists' not in str(e).lower() and 'exist' not in str(e).lower():
                print(f"⚠️  {folder}: {str(e)[:50]}")
    
    # Step 5: Upload missing files
    print("\n📤 Uploading missing files...\n")
    
    uploaded = 0
    failed = 0
    failed_files = []
    
    missing_list = sorted(list(missing_in_cloudinary))
    
    for i, cloudinary_path in enumerate(missing_list, 1):
        local_path = local_files_map[cloudinary_path]
        
        # Extract folder and filename
        path_parts = cloudinary_path.split('/')
        filename_with_ext = path_parts[-1]
        filename_no_ext = os.path.splitext(filename_with_ext)[0]
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
            
            result = cloudinary.uploader.upload(local_path, **upload_params)
            uploaded_public_id = result.get('public_id', cloudinary_path)
            print(f"✅ [{i}/{len(missing_list)}] Uploaded: {uploaded_public_id}")
            uploaded += 1
            
        except Exception as e:
            error_msg = str(e)
            print(f"❌ [{i}/{len(missing_list)}] Failed: {cloudinary_path}")
            print(f"   Error: {error_msg[:100]}")
            failed += 1
            failed_files.append((cloudinary_path, error_msg))
    
    # Summary
    print("\n" + "="*60)
    print("📊 UPLOAD SUMMARY")
    print("="*60)
    print(f"✅ Uploaded: {uploaded}")
    print(f"❌ Failed: {failed}")
    print(f"📁 Total processed: {len(missing_list)}")
    
    if failed_files:
        print("\n❌ Failed files:")
        for file_path, error in failed_files[:10]:
            print(f"   - {file_path}")
            print(f"     Error: {error[:80]}")
        if len(failed_files) > 10:
            print(f"   ... and {len(failed_files) - 10} more")
    
    print("\n" + "="*60)
    print("✅ Auto-upload complete!")
    print("="*60)


# ============================================
# OPTION 1: UPLOAD IMAGES (FIXED)
# ============================================

def upload_images():
    """Upload local images to Cloudinary preserving exact folder structure and filenames"""
    print("\n📤 UPLOAD IMAGES TO CLOUDINARY")
    print("="*60)
    
    # Get local folder path
    local_folder = input("\n📁 Enter local folder path to upload: ").strip()
    
    if not os.path.exists(local_folder):
        print(f"❌ Folder not found: {local_folder}")
        return
    
    # Get Cloudinary base folder
    cloudinary_base = input("☁️  Enter Cloudinary base folder (leave empty for root) (manga/one-piece): ").strip()
    
    # Ask if should skip existing
    skip_existing_input = input("⏭️  Skip images that already exist? (y/n, default: y): ").strip().lower()
    skip_existing = skip_existing_input != 'n'
    
    print("\n🔍 Scanning local folder...")
    
    # Get all image files and collect unique folders
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff'}
    all_files = []
    all_folders = set()
    
    for root, dirs, files in os.walk(local_folder):
        for file in files:
            if Path(file).suffix.lower() in image_extensions:
                full_path = os.path.join(root, file)
                relative_path = os.path.relpath(full_path, local_folder)
                all_files.append((full_path, relative_path))
                
                # Extract folder path
                folder_path = os.path.dirname(relative_path)
                if folder_path:
                    # Add all parent folders
                    parts = folder_path.split(os.sep)
                    for i in range(len(parts)):
                        folder = os.path.join(*parts[:i+1]) if i > 0 else parts[0]
                        all_folders.add(folder)
    
    print(f"✅ Found {len(all_files)} images to upload")
    print(f"📁 Found {len(all_folders)} folders to create")
    
    if len(all_files) == 0:
        print("❌ No images found!")
        return
    
    # Show preview of folder structure
    print("\n📋 Folder structure to create:")
    for folder in sorted(all_folders)[:10]:
        folder_path = f"{cloudinary_base}/{folder}".replace('\\', '/') if cloudinary_base else folder.replace('\\', '/')
        print(f"   📁 {folder_path}")
    if len(all_folders) > 10:
        print(f"   ... and {len(all_folders) - 10} more folders")
    
    # Show preview of how files will be uploaded
    print("\n📋 Preview of files:")
    preview_count = min(5, len(all_files))
    for full_path, relative_path in all_files[:preview_count]:
        # Build the exact cloudinary path including file extension
        if cloudinary_base:
            cloudinary_path = f"{cloudinary_base}/{relative_path}".replace('\\', '/')
        else:
            cloudinary_path = relative_path.replace('\\', '/')
        print(f"   {relative_path} → {cloudinary_path}")
    if len(all_files) > preview_count:
        print(f"   ... and {len(all_files) - preview_count} more files")
    
    # Confirm
    confirm = input(f"\n⚠️  Upload {len(all_files)} images? (y/n): ").strip().lower()
    if confirm != 'y':
        print("❌ Upload cancelled")
        return
    
    # Step 1: Create folders explicitly
    print("\n📁 Creating folder structure in Cloudinary...")
    created_folders = 0
    
    # First, create the base folder if specified
    if cloudinary_base:
        try:
            cloudinary.api.create_folder(cloudinary_base)
            print(f"✅ Created base folder: {cloudinary_base}")
            created_folders += 1
        except Exception as e:
            if 'already exists' in str(e).lower() or 'exist' in str(e).lower():
                print(f"⏭️  Base folder exists: {cloudinary_base}")
            else:
                print(f"⚠️  Note: {str(e)[:50]}")
    
    # Then create all subfolders
    for folder in sorted(all_folders):
        try:
            folder_path = f"{cloudinary_base}/{folder}".replace('\\', '/') if cloudinary_base else folder.replace('\\', '/')
            # Create folder by calling the create_folder API
            cloudinary.api.create_folder(folder_path)
            print(f"✅ Created folder: {folder_path}")
            created_folders += 1
        except cloudinary.exceptions.Error as e:
            # Folder might already exist, that's okay
            if 'already exists' in str(e).lower() or 'exist' in str(e).lower():
                print(f"⏭️  Folder exists: {folder_path}")
            else:
                print(f"⚠️  Could not create folder {folder_path}: {str(e)[:50]}")
        except Exception as e:
            print(f"⚠️  Could not create folder {folder_path}: {str(e)[:50]}")
    
    print(f"\n✅ Folder structure ready!")
    print(f"💡 TIP: In Cloudinary UI, use 'Folder View' to see organized structure")
    
    # Step 2: Get existing images if skipping
    existing_public_ids = set()
    if skip_existing:
        print("\n🔍 Checking existing images in Cloudinary...")
        existing_public_ids = get_all_public_ids_with_extension(cloudinary_base)
        print(f"✅ Found {len(existing_public_ids)} existing images")
    
    # Upload files
    uploaded = 0
    skipped = 0
    failed = 0
    
    print("\n📤 Starting upload...\n")
    
    for i, (full_path, relative_path) in enumerate(all_files, 1):
        # Build public_id WITHOUT extension (Cloudinary adds it automatically)
        relative_no_ext = os.path.splitext(relative_path)[0]
        
        if cloudinary_base:
            public_id = f"{cloudinary_base}/{relative_no_ext}".replace('\\', '/')
        else:
            public_id = relative_no_ext.replace('\\', '/')
        
        # Normalize path separators
        public_id = public_id.replace('\\', '/')
        
        # For checking existing, we need the version with extension (normalized)
        file_ext = os.path.splitext(relative_path)[1].lower().lstrip('.')
        # Normalize jpeg to jpg
        if file_ext == 'jpeg':
            file_ext = 'jpg'
        public_id_with_ext = f"{public_id}.{file_ext}"
        
        # Skip if exists
        if skip_existing and public_id_with_ext in existing_public_ids:
            print(f"⏭️  [{i}/{len(all_files)}] Skipping (exists): {public_id}")
            skipped += 1
            continue
        
        try:
            # Extract just the filename without extension for public_id
            filename_no_ext = os.path.splitext(os.path.basename(relative_path))[0]
            
            # Get the folder path (everything except the filename)
            folder_path = os.path.dirname(relative_path).replace('\\', '/')
            if cloudinary_base:
                full_folder_path = f"{cloudinary_base}/{folder_path}".replace('\\', '/') if folder_path else cloudinary_base
            else:
                full_folder_path = folder_path if folder_path else None
            
            # Clean up any double slashes
            if full_folder_path:
                full_folder_path = full_folder_path.replace('//', '/')
            
            # Upload with folder parameter
            upload_params = {
                'public_id': filename_no_ext,
                'overwrite': False,
                'resource_type': "auto",
                'use_filename': False,
                'unique_filename': False
            }
            
            # Add folder parameter if we have a folder path
            if full_folder_path:
                upload_params['folder'] = full_folder_path
            
            result = cloudinary.uploader.upload(full_path, **upload_params)
            
            # Show the full path that was uploaded
            uploaded_public_id = result.get('public_id', public_id)
            print(f"✅ [{i}/{len(all_files)}] Uploaded: {uploaded_public_id}")
            uploaded += 1
            
        except Exception as e:
            error_msg = str(e)
            print(f"❌ [{i}/{len(all_files)}] Failed: {public_id} - {error_msg[:80]}")
            failed += 1
    
    # Summary
    print("\n" + "="*60)
    print("📊 UPLOAD SUMMARY")
    print("="*60)
    print(f"✅ Uploaded: {uploaded}")
    print(f"⏭️  Skipped: {skipped}")
    print(f"❌ Failed: {failed}")
    print(f"📁 Total: {len(all_files)}")
    print("\n" + "="*60)


# ============================================
# OPTION 2: EXTRACT METADATA
# ============================================

def extract_metadata():
    """Extract metadata from Cloudinary"""
    print("\n📥 EXTRACT METADATA FROM CLOUDINARY")
    print("="*60)
    
    folder_path = input("\n📁 Enter folder path (leave empty for all): ").strip()
    output_file = input("💾 Output filename (default: cloudinary_metadata.json): ").strip()
    
    if not output_file:
        output_file = "public/metadata/cloudinary_metadata.json"
    else:
        output_file = f"public/metadata/{output_file}"
    
    print(f'\n🔍 Extracting from: "{folder_path or "root"}"...')
    
    all_resources = []
    
    try:
        # Get all resources recursively
        all_resources = get_all_resources_recursive(folder_path)
        
        if len(all_resources) == 0:
            print("❌ No images found!")
            return
        
        # Format the data
        cloud_name = cloudinary.config().cloud_name
        formatted_data = []
        
        for resource in all_resources:
            public_id = resource.get('public_id', '')
            folder = public_id.rsplit('/', 1)[0] if '/' in public_id else 'root'
            filename = public_id.split('/')[-1]
            
            formatted_data.append({
                'filename': filename,
                'public_id': public_id,
                'folder': folder,
                'url': resource.get('secure_url'),
                'cloudinary_url': f"cloudinary://{cloud_name}/{resource.get('resource_type', 'image')}/upload/{public_id}",
                'format': resource.get('format'),
                'width': resource.get('width'),
                'height': resource.get('height'),
                'size_bytes': resource.get('bytes'),
                'size_kb': round(resource.get('bytes', 0) / 1024),
                'created_at': resource.get('created_at'),
                'resource_type': resource.get('resource_type'),
                'type': resource.get('type'),
                'tags': resource.get('tags', [])
            })
        
        # Save to JSON
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(formatted_data, f, indent=2, ensure_ascii=False)
        
        # Save to CSV
        csv_file = output_file.replace('.json', '.csv')
        save_to_csv(formatted_data, csv_file, folder="E:/UOM/My-CODE_RUSH/projects/HiManga/metadata")
        
        # Print summary
        print('\n✅ Extraction Complete!')
        print(f'📊 Total images: {len(formatted_data)}')
        print(f'💾 JSON saved: {output_file}')
        print(f'📄 CSV saved: {csv_file}')
        
        # Folder breakdown
        folder_counts = {}
        for item in formatted_data:
            folder = item['folder']
            folder_counts[folder] = folder_counts.get(folder, 0) + 1
        
        print('\n📁 Folder Breakdown:')
        for folder, count in sorted(folder_counts.items()):
            print(f'   {folder}: {count} images')
        
    except Exception as error:
        print(f'❌ Error: {error}')


# ============================================
# OPTION 3: LIST FOLDERS
# ============================================

def list_folders():
    """List all folders in Cloudinary"""
    print("\n📁 LISTING ALL FOLDERS")
    print("="*60)
    
    try:
        print("\n🔍 Fetching folders...")
        
        all_folders = []
        next_cursor = None
        
        while True:
            result = cloudinary.api.root_folders(
                max_results=500,
                next_cursor=next_cursor
            )
            
            folders = result.get('folders', [])
            all_folders.extend([f['path'] for f in folders])
            
            next_cursor = result.get('next_cursor')
            if not next_cursor:
                break
        
        print(f'\n✅ Found {len(all_folders)} folders:\n')
        for folder in sorted(all_folders):
            print(f'   📁 {folder}')
            
    except Exception as e:
        print(f'❌ Error: {e}')


# ============================================
# OPTION 4: SEARCH BY TAG
# ============================================

def search_by_tag():
    """Search images by tag"""
    print("\n🏷️  SEARCH BY TAG")
    print("="*60)
    
    tag = input("\n🔍 Enter tag to search: ").strip()
    
    if not tag:
        print("❌ Tag cannot be empty")
        return
    
    output_file = input("💾 Output filename (default: tagged_images.json): ").strip()
    if not output_file:
        output_file = "tagged_images.json"
    
    print(f'\n🔍 Searching for tag: "{tag}"...')
    
    try:
        all_resources = []
        next_cursor = None
        
        while True:
            result = cloudinary.api.resources_by_tag(
                tag,
                max_results=500,
                next_cursor=next_cursor
            )
            
            resources = result.get('resources', [])
            all_resources.extend(resources)
            
            next_cursor = result.get('next_cursor')
            if not next_cursor:
                break
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_resources, f, indent=2)
        
        print(f'\n✅ Found {len(all_resources)} images with tag "{tag}"')
        print(f'💾 Saved to: {output_file}')
        
    except Exception as e:
        print(f'❌ Error: {e}')


# ============================================
# OPTION 5: COMPARE LOCAL VS CLOUDINARY
# ============================================

def compare_local_cloudinary():
    """Compare local folder with Cloudinary to find missing images"""
    print("\n🔍 COMPARE LOCAL VS CLOUDINARY")
    print("="*60)
    
    local_folder = input("\n📁 Enter local folder path : ").strip()
    
    if not os.path.exists(local_folder):
        print(f"❌ Folder not found: {local_folder}")
        return
    
    cloudinary_base = input("☁️  Enter Cloudinary base folder (leave empty for root): ").strip()
    
    print("\n🔍 Scanning local files...")
    
    # Get local files WITH extension (normalized)
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff'}
    local_files = set()
    
    for root, dirs, files in os.walk(local_folder):
        for file in files:
            if Path(file).suffix.lower() in image_extensions:
                full_path = os.path.join(root, file)
                relative_path = os.path.relpath(full_path, local_folder)
                # Keep the full filename with extension
                if cloudinary_base:
                    public_id = f"{cloudinary_base}/{relative_path}".replace('\\', '/')
                else:
                    public_id = relative_path.replace('\\', '/')
                # Normalize the extension (jpeg -> jpg)
                local_files.add(normalize_extension(public_id))
    
    print(f"✅ Found {len(local_files)} local images")
    
    print("\n🔍 Fetching Cloudinary images...")
    cloudinary_files = get_all_public_ids_with_extension(cloudinary_base)
    print(f"✅ Found {len(cloudinary_files)} Cloudinary images")
    
    # Compare
    missing_in_cloudinary = local_files - cloudinary_files
    only_in_cloudinary = cloudinary_files - local_files
    
    print("\n" + "="*60)
    print("📊 COMPARISON RESULTS")
    print("="*60)
    print(f"📁 Local files: {len(local_files)}")
    print(f"☁️  Cloudinary files: {len(cloudinary_files)}")
    print(f"❌ Missing in Cloudinary: {len(missing_in_cloudinary)}")
    print(f"☁️  Only in Cloudinary: {len(only_in_cloudinary)}")
    
    if missing_in_cloudinary:
        print("\n❌ Missing in Cloudinary:")
        for public_id in sorted(list(missing_in_cloudinary)[:20]):
            print(f"   - {public_id}")
        if len(missing_in_cloudinary) > 20:
            print(f"   ... and {len(missing_in_cloudinary) - 20} more")
    
    if only_in_cloudinary:
        print("\n☁️  Only in Cloudinary:")
        for public_id in sorted(list(only_in_cloudinary)[:20]):
            print(f"   - {public_id}")
        if len(only_in_cloudinary) > 20:
            print(f"   ... and {len(only_in_cloudinary) - 20} more")


# ============================================
# OPTION 6: DELETE IMAGES
# ============================================

def delete_images():
    """Delete images from Cloudinary"""
    print("\n🗑️  DELETE IMAGES FROM CLOUDINARY")
    print("="*60)
    print("\n⚠️  WARNING: This action cannot be undone!")
    
    folder_path = input("\n📁 Enter folder path to delete from: ").strip()
    
    confirm1 = input(f'\n⚠️  Delete ALL images in "{folder_path}"? (yes/no): ').strip().lower()
    if confirm1 != 'yes':
        print("❌ Deletion cancelled")
        return
    
    confirm2 = input("⚠️  Are you ABSOLUTELY sure? Type 'DELETE' to confirm: ").strip()
    if confirm2 != 'DELETE':
        print("❌ Deletion cancelled")
        return
    
    print("\n🔍 Fetching images to delete...")
    
    try:
        resources = get_all_resources_recursive(folder_path)
        public_ids = [r['public_id'] for r in resources]
        
        print(f"⚠️  Found {len(public_ids)} images to delete")
        
        if len(public_ids) == 0:
            print("❌ No images found")
            return
        
        deleted = 0
        failed = 0
        
        for i, public_id in enumerate(public_ids, 1):
            try:
                cloudinary.uploader.destroy(public_id)
                print(f"✅ [{i}/{len(public_ids)}] Deleted: {public_id}")
                deleted += 1
            except Exception as e:
                print(f"❌ [{i}/{len(public_ids)}] Failed: {public_id}")
                failed += 1
        
        print(f"\n✅ Deleted: {deleted}")
        print(f"❌ Failed: {failed}")
        
    except Exception as e:
        print(f'❌ Error: {e}')


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_all_resources_recursive(folder_path=""):
    """Get all resources from Cloudinary recursively"""
    all_resources = []
    next_cursor = None
    
    while True:
        try:
            result = cloudinary.api.resources(
                type='upload',
                prefix=folder_path,
                max_results=500,
                next_cursor=next_cursor,
                resource_type='image'
            )
            
            resources = result.get('resources', [])
            all_resources.extend(resources)
            
            next_cursor = result.get('next_cursor')
            if not next_cursor:
                break
                
        except Exception as e:
            print(f'⚠️  Warning: {e}')
            break
    
    return all_resources


def get_all_public_ids_with_extension(folder_path=""):
    """Get set of all public_ids in Cloudinary WITH file extensions (normalized)"""
    resources = get_all_resources_recursive(folder_path)
    public_ids = set()
    
    for r in resources:
        public_id = r['public_id']
        # Public IDs in Cloudinary already include the path structure
        # but NOT the extension - we need to add it back
        file_format = r.get('format', '')
        if file_format:
            # Normalize jpeg to jpg for consistent comparison
            if file_format.lower() == 'jpeg':
                file_format = 'jpg'
            full_path = f"{public_id}.{file_format}"
            public_ids.add(normalize_extension(full_path))
        else:
            public_ids.add(normalize_extension(public_id))
    
    return public_ids


def save_to_csv(data, filename, folder="output"):
    """Save metadata to CSV in a specific folder"""
    
    if not data:
        return
    
    # Ensure folder exists
    os.makedirs(folder, exist_ok=True)
    
    # Combine folder path with filename
    filepath = os.path.join(folder, filename)
    
    fieldnames = [
        'filename', 'public_id', 'folder', 'url', 'cloudinary_url',
        'format', 'width', 'height', 'size_kb', 
        'created_at', 'resource_type'
    ]
    
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(data)
    
    print(f"✅ CSV saved to: {filepath}")

# ============================================
# MAIN PROGRAM
# ============================================

def main():
    """Main program loop"""
    
    # Check configuration
    config = cloudinary.config()
    if not config.cloud_name or config.cloud_name == "YOUR_CLOUD_NAME":
        print("\n❌ ERROR: Please configure Cloudinary credentials!")
        print("Edit the script and update:")
        print("  - cloud_name")
        print("  - api_key")
        print("  - api_secret")
        print("\nFind them at: https://console.cloudinary.com/console")
        return
    
    while True:
        choice = show_menu()
        
        if choice == '1':
            upload_images()
        elif choice == '2':
            extract_metadata()
        elif choice == '3':
            list_folders()
        elif choice == '4':
            search_by_tag()
        elif choice == '5':
            compare_local_cloudinary()
        elif choice == '6':
            delete_images()
        elif choice == '7':
            auto_upload_missing()
        elif choice == '8':
            print("\n👋 Goodbye!")
            break
        else:
            print("\n❌ Invalid choice. Please enter 1-8")
        
        input("\n⏎ Press Enter to continue...")


if __name__ == "__main__":
    main()