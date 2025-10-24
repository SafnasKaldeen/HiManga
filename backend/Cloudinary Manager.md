# 🌥️ Cloudinary Manager

An interactive Python tool for managing Cloudinary images with full folder structure preservation.

## ✨ Features

- 📤 **Upload images** preserving exact folder structure and filenames
- 📁 **Automatic folder creation** in Cloudinary UI
- 📥 **Extract metadata** to JSON/CSV
- 🔍 **Compare** local vs Cloudinary to find missing files
- 🏷️ **Search** images by tags
- 🗑️ **Bulk delete** with safety confirmations
- ⏭️ **Skip existing** files to avoid duplicates

## 🚀 Quick Start

### Installation

```bash
pip install cloudinary
```

### Configuration

1. Open `cloudinary_manager.py`
2. Update your credentials:

```python
cloudinary.config(
    cloud_name="YOUR_CLOUD_NAME",
    api_key="YOUR_API_KEY",
    api_secret="YOUR_API_SECRET"
)
```

Find your credentials at: https://console.cloudinary.com/console

### Run

```bash
python cloudinary_manager.py
```

## 📋 Menu Options

### 1. 📤 Upload Images

Upload local images while preserving folder structure and exact filenames.

**Example:**

```
Local:  E:\images\manga\one-piece\chapter-1\page-001.jpg
Result: one-piece/chapter-1/page-001.jpg
URL:    https://res.cloudinary.com/YOUR_CLOUD/image/upload/one-piece/chapter-1/page-001.jpg
```

**Features:**

- ✅ Preserves exact filenames (including extensions)
- ✅ Creates folder structure in Cloudinary UI
- ✅ Skip existing files option
- ✅ Progress tracking
- ✅ Upload summary with statistics

**Prompts:**

1. Local folder path to upload
2. Cloudinary base folder (optional)
3. Skip existing files? (default: yes)

### 2. 📥 Extract Metadata

Export Cloudinary metadata to JSON and CSV files.

**Output includes:**

- Filename, public_id, folder
- URLs (secure_url, cloudinary_url)
- Dimensions (width, height)
- File size (bytes, KB)
- Format, resource type
- Tags, creation date

**Generated files:**

- `cloudinary_metadata.json` - Full metadata
- `cloudinary_metadata.csv` - Spreadsheet format

### 3. 📁 List All Folders

Display all folders in your Cloudinary account.

**Output:**

```
✅ Found 15 folders:
   📁 manga/one-piece
   📁 manga/naruto
   📁 images/backgrounds
   ...
```

### 4. 🏷️ Search by Tag

Find all images with a specific tag.

**Output:**

- JSON file with tagged resources
- Count of matching images

### 5. 🔍 Compare Local vs Cloudinary

Compare your local folder with Cloudinary to identify:

- ❌ Files missing in Cloudinary
- ☁️ Files only in Cloudinary

**Useful for:**

- Verifying upload completion
- Finding files to upload
- Identifying orphaned cloud files

### 6. 🗑️ Delete Images

Bulk delete images from Cloudinary.

**Safety features:**

- ⚠️ Double confirmation required
- Must type "DELETE" to confirm
- Progress tracking
- Deletion summary

## 📊 Folder Structure Examples

### Example 1: Manga Collection

**Local structure:**

```
E:\manga\
├── one-piece\
│   ├── chapter-1\
│   │   ├── page-001.jpg
│   │   └── page-002.jpg
│   └── chapter-2\
│       ├── page-001.jpg
│       └── page-002.jpg
└── naruto\
    └── chapter-1\
        └── page-001.jpg
```

**Upload with base folder:** `manga`

**Cloudinary structure:**

```
manga/
├── one-piece/
│   ├── chapter-1/
│   │   ├── page-001.jpg
│   │   └── page-002.jpg
│   └── chapter-2/
│       ├── page-001.jpg
│       └── page-002.jpg
└── naruto/
    └── chapter-1/
        └── page-001.jpg
```

**Cloudinary URLs:**

```
https://res.cloudinary.com/YOUR_CLOUD/image/upload/manga/one-piece/chapter-1/page-001.jpg
https://res.cloudinary.com/YOUR_CLOUD/image/upload/manga/naruto/chapter-1/page-001.jpg
```

### Example 2: Website Assets

**Local structure:**

```
public\
├── images\
│   ├── hero.jpg
│   └── logo.png
└── icons\
    ├── home.svg
    └── menu.svg
```

**Upload with base folder:** `website-assets`

**Cloudinary structure:**

```
website-assets/
├── images/
│   ├── hero.jpg
│   └── logo.png
└── icons/
    ├── home.svg
    └── menu.svg
```

## 🎯 Usage Tips

### Best Practices

1. **Always use a base folder** to keep Cloudinary organized

   ```
   ✅ base-folder/subfolder/image.jpg
   ❌ image.jpg (clutters root)
   ```

2. **Enable "skip existing"** to avoid re-uploading

   - Saves time and bandwidth
   - Prevents duplicates

3. **Extract metadata regularly** for backup

   - Keep JSON/CSV records
   - Track your assets

4. **Use meaningful folder names**
   ```
   ✅ manga/solo-leveling/chapter-1
   ❌ folder1/folder2/folder3
   ```

### Supported Image Formats

- `.jpg`, `.jpeg` - JPEG images
- `.png` - PNG images
- `.gif` - GIF images
- `.webp` - WebP images
- `.bmp` - Bitmap images
- `.svg` - SVG vectors
- `.tiff` - TIFF images

## 🛠️ Troubleshooting

### Issue: "Folder not found"

**Solution:** Check that the path exists and use absolute paths

```bash
# Windows
E:\projects\images

# Mac/Linux
/Users/username/projects/images
```

### Issue: "Upload failed"

**Possible causes:**

- Invalid credentials
- File too large (>100MB default limit)
- Network issues
- Invalid characters in filename

**Solution:**

1. Verify credentials in configuration
2. Check Cloudinary account limits
3. Test with a small file first

### Issue: "Rate limit exceeded"

**Solution:**

- Wait a few minutes
- Upload in smaller batches
- Upgrade Cloudinary plan if needed

### Issue: Folders not showing in UI

**Solution:**

- The script now creates folders explicitly
- Refresh the Cloudinary dashboard
- Check that folder creation succeeded in the console output

## 📈 Advanced Features

### Batch Operations

Upload multiple folders:

```bash
# Run script multiple times with different folders
1. Upload: E:\manga\one-piece → base: manga/one-piece
2. Upload: E:\manga\naruto → base: manga/naruto
3. Upload: E:\manga\bleach → base: manga/bleach
```

### Metadata Analysis

Use the CSV export for:

- Analyzing image sizes
- Finding large files
- Grouping by format
- Date-based filtering

### Backup Strategy

1. **Before bulk operations:**
   - Extract metadata (Option 2)
   - Save JSON backup
2. **Compare regularly:**

   - Run comparison (Option 5)
   - Verify all files uploaded

3. **Clean up:**
   - Identify unused files
   - Delete orphaned images

## 🔒 Security Notes

- ⚠️ **Never commit credentials** to version control
- ⚠️ **Use environment variables** for production
- ⚠️ **Restrict API key permissions** in Cloudinary console
- ⚠️ **Keep api_secret private**

### Environment Variables (Optional)

```python
import os

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)
```

## 📝 License

This is a utility script. Use at your own risk. Always backup your data before bulk operations.

## 🆘 Support

- **Cloudinary Docs:** https://cloudinary.com/documentation
- **API Reference:** https://cloudinary.com/documentation/admin_api
- **Console:** https://console.cloudinary.com

## 🎨 Example Workflows

### Workflow 1: New Project Upload

```
1. Run script
2. Choose Option 1 (Upload)
3. Enter local folder: E:\project\images
4. Enter base folder: project-name
5. Skip existing: y
6. Confirm upload
7. Verify in Cloudinary UI
```

### Workflow 2: Sync Local Changes

```
1. Run script
2. Choose Option 5 (Compare)
3. Identify missing files
4. Choose Option 1 (Upload)
5. Upload only missing files
```

### Workflow 3: Cleanup

```
1. Run script
2. Choose Option 2 (Extract metadata)
3. Analyze CSV for unused files
4. Choose Option 6 (Delete)
5. Remove unwanted images
```

## 📊 Statistics

The script provides detailed statistics for every operation:

**Upload Summary:**

```
✅ Uploaded: 150
⏭️  Skipped: 25
❌ Failed: 2
📁 Total: 177
```

**Comparison Results:**

```
📁 Local files: 200
☁️  Cloudinary files: 175
❌ Missing in Cloudinary: 25
☁️  Only in Cloudinary: 10
```

---

**Made with ☁️ for efficient Cloudinary management**
