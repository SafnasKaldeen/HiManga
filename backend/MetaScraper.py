#!/usr/bin/env python3
"""
LOCAL MANGA SCRAPER
Scans a manga folder with chapter subfolders and outputs CSV with:
manga_id, chapter_number, title, total_panels
"""

import os
import csv
import uuid
from pathlib import Path
from datetime import datetime
import re

# Allowed image extensions
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'}

def extract_chapter_number(name: str):
    """Extract chapter number from folder name (e.g. 'Chapter 5.5' -> 5.5)."""
    numbers = re.findall(r'\d+(?:\.\d+)?', name)
    if numbers:
        return float(numbers[0])
    return None

def scrape_local_manga(folder_path: str, manga_id=None):
    """Scrape chapter and panel data from local folder."""
    if not os.path.exists(folder_path):
        print(f"❌ Folder not found: {folder_path}")
        return []

    if manga_id is None:
        manga_id = str(uuid.uuid4())

    print(f"\n📁 Scanning manga folder: {folder_path}")
    print(f"🆔 Assigned Manga ID: {manga_id}\n")

    chapters_data = []

    # Get all chapter folders
    for item in sorted(os.listdir(folder_path)):
        chapter_path = os.path.join(folder_path, item)
        if not os.path.isdir(chapter_path):
            continue

        # Count panel (image) files
        panel_count = sum(
            1 for f in os.listdir(chapter_path)
            if Path(f).suffix.lower() in IMAGE_EXTENSIONS
        )

        chapter_number = extract_chapter_number(item)
        if chapter_number is None:
            print(f"⚠️ Skipping '{item}' (no numeric chapter number found)")
            continue

        chapters_data.append({
            'manga_id': manga_id,
            'chapter_number': chapter_number,
            'title': item,
            'total_panels': panel_count,
        })

        print(f"✅ Chapter {chapter_number}: {panel_count} panels")

    return chapters_data

def save_to_csv(chapters_data, output_path='manga_chapters.csv'):
    """Save scraped data to CSV in the required format."""
    if not chapters_data:
        print("❌ No data to save.")
        return

    fieldnames = ['manga_id', 'chapter_number', 'title', 'total_panels']
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(chapters_data)

    print(f"\n💾 Data saved to: {output_path}")
    print(f"📊 Total chapters: {len(chapters_data)}")

def main():
    folder_path = input("📁 Enter manga folder path: ").strip()
    data = scrape_local_manga(folder_path)
    if data:
        csv_path = os.path.join(folder_path, 'manga_chapters.csv')
        save_to_csv(data, csv_path)

if __name__ == "__main__":
    main()
