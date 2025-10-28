import csv

expected = list(range(1, 1163))
found = []

with open('E:/UOM/My-CODE_RUSH/projects/HiManga/public/one-piece/manga_metadata.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        found.append(int(float(row['chapter_number'])))

missing = [ch for ch in expected if ch not in found]
print("Missing chapters:", missing)
