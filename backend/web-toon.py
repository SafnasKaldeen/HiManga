# demo_webtoon.py
from webtoon_api import WebtoonApi

def main():
    api = WebtoonApi()

    # Example: "Lore Olympus" (WEBTOON titleNo = 1320)
    title_no = 1320

    print("Fetching Webtoon info...")
    title_info = api.titleInfo(titleNo=title_no, language="en", serviceZone="GLOBAL")
    print("Title Info:")
    print(f"Title: {title_info['titleInfo']['title']}")
    print(f"Author: {title_info['titleInfo']['author']}")
    print(f"Genre: {title_info['titleInfo']['genre']}")
    print(f"Summary: {title_info['titleInfo']['synopsis'][:150]}...")

    print("\nFetching episode list...")
    episodes = api.episodeList(titleNo=title_no, page=1, language="en", serviceZone="GLOBAL")

    for ep in episodes["episodeList"][:5]:  # limit to first 5
        print(f"- Episode {ep['episodeNo']}: {ep['title']}")
        print(f"  Thumbnail: {ep['thumbnail']['url']}\n")

if __name__ == "__main__":
    main()
