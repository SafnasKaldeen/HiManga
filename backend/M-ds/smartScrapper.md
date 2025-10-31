# One Piece Manga Scraper - Complete Workflow Guide

## 📋 Table of Contents

- [Initial Setup](#initial-setup)
- [Download Workflows](#download-workflows)
- [Verification & Fixing](#verification--fixing)
- [Common Scenarios](#common-scenarios)
- [Understanding the Output](#understanding-the-output)

---

## 🚀 Initial Setup

### Prerequisites

```bash
pip install requests beautifulsoup4
```

### Directory Structure

```
E:\UOM\My-CODE_RUSH\projects\One Piece\manga-app\
├── backend/
│   └── SmartScrapperWithMetaData.py
└── public/
    └── one-piece/
        ├── chapter-001/
        │   ├── panel-001.jpg
        │   ├── panel-002.jpg
        │   └── ...
        ├── chapter-002/
        └── chapter_metadata.csv
```

---

## 📥 Download Workflows

### Workflow 1: Download All Chapters (First Time)

**Use Case:** Starting from scratch, want to download everything

```
1. Run script
2. Choose option: 1
3. Confirm: yes
4. Script will:
   ✓ Fetch chapter list from web
   ✓ Download all chapters sequentially
   ✓ Save metadata to chapter_metadata.csv
   ✓ Automatically verify after download
5. If issues found:
   ✓ Shows list of failed chapters
   ✓ Asks if you want to re-download them
```

**Expected Output:**

```
============================================================
Will download 1161 chapters
Metadata CSV: E:\...\chapter_metadata.csv
============================================================

[1/1161] Downloading Chapter 1...
Found 51 images in .page-break.no-gaps
✓ Done! 51/51 images saved

[2/1161] Downloading Chapter 2...
...

============================================================
DOWNLOAD SUMMARY
============================================================
✓ Successfully downloaded: 1161/1161 chapters
Location: E:\...\one-piece
============================================================

[Automatic Verification starts...]
```

---

### Workflow 2: Download Specific Range

**Use Case:** Want to download chapters 100-200 only

```
1. Run script
2. Choose option: 2
3. Enter start: 100
4. Enter end: 200
5. Script downloads only those chapters
6. Automatic verification after download
```

**Best for:**

- Testing the scraper
- Filling gaps in your collection
- Updating with new chapters

---

### Workflow 3: Download Single Chapter

**Use Case:** Need to re-download one specific chapter

```
1. Run script
2. Choose option: 3
3. Enter chapter number: 6
4. Script downloads just that chapter
5. Updates metadata
```

**Best for:**

- Quick fixes
- Testing
- Manual corrections

---

## 🔍 Verification & Fixing

### Workflow 4: Verify All Chapters

**Use Case:** Check if all downloaded chapters are complete

```
1. Run script
2. Choose option: 4
3. Script will:
   ✓ Load existing metadata
   ✓ Fetch chapter list from web
   ✓ Check each chapter against web source
   ✓ Show progress: [1/1161] Checking Chapter 1... ✓ OK (51 panels)
```

**Real-time Output:**

```
[1/1161] Checking Chapter 1... ✓ OK (51 panels)
[2/1161] Checking Chapter 2... ✓ OK (18 panels)
[3/1161] Checking Chapter 3... ✓ OK (19 panels)
[6/1161] Checking Chapter 6... ✗ Panel count mismatch (has 21, expected 22)
...
```

**After Verification:**

```
============================================================
VERIFICATION SUMMARY
============================================================
Total chapters checked: 1161
Issues found: 21
Chapters to re-download: 21
Chapter numbers: 6, 164, 315, 381, ...
============================================================

Update metadata CSV with verified expected counts? (yes/no):
```

**What to do:**

- Type `yes` → Updates metadata with correct expected panel counts
- Type `no` → Skips metadata update

**Why update metadata?**

- Keeps track of what the web source actually has
- Helps identify future issues
- Makes re-verification faster

---

### Workflow 5: Re-download Failed Chapters

**Use Case:** Fix all chapters with issues

```
1. Run script
2. Choose option: 5
3. Script will:
   ✓ Run verification (like option 4)
   ✓ Show which chapters have issues
   ✓ Ask: "Re-download 21 chapters? (yes/no):"
4. Type 'yes'
5. Script automatically re-downloads all problematic chapters
6. Runs verification again
```

**Complete Flow:**

```
[Verification runs...]
============================================================
VERIFICATION SUMMARY
============================================================
Issues found: 21
Chapter numbers: 6, 164, 315, ...
============================================================

Re-download 21 chapters? (yes/no): yes

[Re-downloading starts...]
============================================================
Chapter 6: Chapter 6
============================================================
Fetching page: https://...
Found 22 images
✓ Done! 22/22 images saved

...

[Verification runs again to confirm fixes]
✓ All chapters verified successfully!
```

---

## 🎯 Common Scenarios

### Scenario 1: First Time Setup

```
Goal: Download entire One Piece manga

Steps:
1. Run script → Option 1
2. Confirm → yes
3. Wait for download (may take hours)
4. Automatic verification runs
5. If issues found → say 'yes' to re-download
6. Done!

Result: Complete manga collection with verified metadata
```

---

### Scenario 2: You Have Issues After Download

```
Problem: Some chapters are incomplete

Steps:
1. Run script → Option 4 (Verify)
2. See which chapters have issues
3. Update metadata → yes
4. Run script → Option 5 (Re-download failed)
5. Confirm → yes
6. Done!

Result: All chapters fixed and verified
```

---

### Scenario 3: New Chapters Released

```
Goal: Download chapters 1162-1170

Steps:
1. Run script → Option 2 (Range)
2. Start: 1162
3. End: 1170
4. Downloads new chapters
5. Automatic verification
6. Done!

Result: Up-to-date collection
```

---

### Scenario 4: Periodic Maintenance Check

```
Goal: Check if everything is still good

Steps:
1. Run script → Option 4 (Verify)
2. Wait for verification
3. If issues found:
   - Update metadata → yes
   - Run Option 5 to fix
4. If no issues:
   - Update metadata anyway → yes
   - Done!

Result: Confidence that your collection is complete
```

---

## 📊 Understanding the Output

### Color Coding

```
🟢 GREEN: ✓ Chapter is perfect
🔴 RED:   ✗ Chapter has issues (missing panels, gaps, etc.)
🟡 YELLOW: ⚠ Warning (URL not found, can't verify, etc.)
```

### Progress Indicators

```
[23/1161] Checking Chapter 23...
 ^    ^                    ^
 |    |                    └─ Current chapter number
 |    └─ Total chapters
 └─ Current progress
```

### Status Messages

```
✓ OK (51 panels)                    → Perfect, no issues
✓ OK (51 panels) - Metadata updated → Good, but metadata was corrected
✗ Panel count mismatch              → Problem found
⚠ URL not found                     → Can't verify this chapter
```

---

## 📁 Metadata CSV Structure

### Columns

```csv
manga_name, chapter_number, panel_count, expected_count, status, timestamp, error
One Piece,  1,              51,          51,             success, 2025-10-22T...,
One Piece,  6,              21,          22,             incomplete, 2025-10-22T..., Downloaded 21/22
One Piece,  10,             0,           0,              failed, 2025-10-22T..., Connection timeout
```

### Status Types

- **success**: Chapter fully downloaded, matches expected count
- **partial**: Some panels downloaded, but not all
- **incomplete**: Downloaded but doesn't match expected count
- **failed**: Download failed completely

---

## ⚡ Quick Reference

| Option | Purpose         | When to Use             |
| ------ | --------------- | ----------------------- |
| 1      | Download all    | First time setup        |
| 2      | Download range  | New chapters, fill gaps |
| 3      | Download single | Quick fixes, testing    |
| 4      | Verify only     | Check collection health |
| 5      | Fix issues      | After finding problems  |

---

## 🔧 Troubleshooting

### Issue: Verification taking too long

**Solution:** It checks each chapter against the web (0.5s delay per chapter). For 1161 chapters = ~10 minutes. This is normal.

### Issue: Many chapters show mismatch

**Reasons:**

1. Download was interrupted
2. Network issues during download
3. Website changed/updated chapters
4. Corrupt image files

**Fix:** Run Option 5 to re-download all

### Issue: Script stuck at one chapter

**Reasons:**

1. Network timeout
2. Chapter doesn't exist on website anymore
3. Website blocking requests

**Fix:**

- Press Ctrl+C to cancel
- Check that specific chapter URL manually
- Wait a bit and try again

---

## 💡 Best Practices

1. **Always verify after downloading**

   - Catches issues immediately
   - Updates metadata with correct counts

2. **Update metadata when prompted**

   - Keeps your records accurate
   - Helps with future verifications

3. **Don't run verification too frequently**

   - Respects the server (0.5s delay per chapter)
   - Run weekly or after downloads only

4. **Keep backups of metadata CSV**

   - Tracks download history
   - Useful if something goes wrong

5. **Check the logs**
   - Console output shows exactly what's happening
   - Red messages = need attention
   - Green messages = all good

---

## 🎓 Example Session

```bash
$ python SmartScrapperWithMetaData.py

============================================================
One Piece Manga Scraper with Panel Count Verification
============================================================

Choose option:
1. Download all chapters
2. Download specific chapter range
3. Download single chapter
4. Verify existing chapters (with web check)
5. Re-download failed/incomplete chapters

Enter choice (1-5): 4

============================================================
VERIFYING ALL CHAPTERS
============================================================

Loaded metadata for 1161 chapters
Found 1161 chapter folders

Starting verification... (this may take a while)

[1/1161] Checking Chapter 1... ✓ OK (51 panels)
[2/1161] Checking Chapter 2... ✓ OK (18 panels)
[3/1161] Checking Chapter 3... ✓ OK (19 panels)
[4/1161] Checking Chapter 4... ✓ OK (20 panels)
[5/1161] Checking Chapter 5... ✓ OK (22 panels)
[6/1161] Checking Chapter 6... ✗ Panel count mismatch: expected 22, got 21 (has 21, expected 22)
...

============================================================
VERIFICATION SUMMARY
============================================================
Total chapters checked: 1161
Issues found: 21
Chapters to re-download: 21
Chapter numbers: 6, 164, 315, 381, 448, 531, 599, 648, 651, 661, 680, 695, 707, 713, 720, 742, 744, 764, 765, 970, 1087
============================================================

Update metadata CSV with verified expected counts? (yes/no): yes
✓ Metadata updated

# Now fix the issues
$ python SmartScrapperWithMetaData.py
Enter choice (1-5): 5

[Re-downloads 21 chapters...]
✓ All chapters verified successfully!
```

---

## 📞 Summary

**For first-time users:**

1. Option 1 → Download everything
2. Let verification run
3. Fix any issues with Option 5
4. Done!

**For maintenance:**

1. Option 4 → Check health
2. Option 5 → Fix issues (if any)
3. Done!

**For updates:**

1. Option 2 → Download new range
2. Automatic verification
3. Done!

---

_Happy reading! 📚_
