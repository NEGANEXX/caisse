import os
import requests
from duckduckgo_search import DDGS

denominations = [
    # USD
    {"query": "100 dollar bill front transparent png", "file": "usd_100.jpg"},
    {"query": "50 dollar bill front transparent png", "file": "usd_50.jpg"},
    {"query": "20 dollar bill front transparent png", "file": "usd_20.jpg"},
    {"query": "10 dollar bill front transparent png", "file": "usd_10.jpg"},
    {"query": "5 dollar bill front transparent png", "file": "usd_5.jpg"},
    {"query": "1 dollar bill front transparent png", "file": "usd_1.jpg"},
    # EUR
    {"query": "500 euro banknote front white background", "file": "eur_500.jpg"},
    {"query": "200 euro banknote front white background", "file": "eur_200.jpg"},
    {"query": "100 euro banknote front white background", "file": "eur_100.jpg"},
    {"query": "50 euro banknote front white background", "file": "eur_50.jpg"},
    {"query": "20 euro banknote front white background", "file": "eur_20.jpg"},
    {"query": "10 euro banknote front white background", "file": "eur_10.jpg"},
    {"query": "5 euro banknote front white background", "file": "eur_5.jpg"},
    {"query": "2 euro coin transparent", "file": "eur_2.jpg"},
    {"query": "1 euro coin transparent", "file": "eur_1.jpg"}
]

output_dir = os.path.join(os.path.dirname(__file__), 'public', 'currency')
os.makedirs(output_dir, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def download_image(url, filepath):
    try:
        response = requests.get(url, stream=True, headers=headers, timeout=10)
        response.raise_for_status()
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False

with DDGS() as ddgs:
    for item in denominations:
        print(f"Searching for: {item['query']}")
        try:
            results = list(ddgs.images(item['query'], max_results=3))
            success = False
            for res in results:
                print(f"  Trying URL: {res['image']}")
                if download_image(res['image'], os.path.join(output_dir, item['file'])):
                    print(f"  Successfully downloaded {item['file']}")
                    success = True
                    break
            if not success:
                print(f"  Could not download any image for {item['file']}")
        except Exception as e:
            print(f"Error searching for {item['query']}: {e}")
