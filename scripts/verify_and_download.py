import os
import json
import urllib.request
import urllib.parse
import hashlib
import mimetypes
import sys

def get_extension(url, content_type):
    # Try to guess extension from content-type
    ext = mimetypes.guess_extension(content_type)
    if ext:
        return ext
    # Fallback to URL path extension
    parsed = urllib.parse.urlparse(url)
    path = parsed.path
    _, ext = os.path.splitext(path)
    if ext:
        return ext.lower()
    return '.jpg' # default fallback

def verify_and_download_image(url, output_dir):
    # If the URL is already a local path, skip download and verify it exists
    if not (url.startswith('http://') or url.startswith('https://')):
        # Check if local file exists relative to the gazette project root
        local_path = os.path.join(os.path.dirname(output_dir), url)
        if os.path.exists(local_path):
            print(f"[VERIFIED] Local image exists: {url}")
            return url
        else:
            raise ValueError(f"Local image file not found: {local_path}")

    print(f"[HTTP GET] Verifying and downloading: {url}")
    
    # Setup request with User-Agent to avoid blocks
    req = urllib.request.Request(
        url, 
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
    )
    
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            status = response.status
            content_type = response.headers.get('Content-Type', '')
            
            if status != 200:
                raise ValueError(f"HTTP response status is {status}")
            
            if 'image' not in content_type and 'octet-stream' not in content_type:
                raise ValueError(f"Invalid content type: {content_type}")
            
            # Read image data
            img_data = response.read()
            
            # Generate unique filename based on URL hash
            url_hash = hashlib.md5(url.encode('utf-8')).hexdigest()
            ext = get_extension(url, content_type)
            filename = f"img_{url_hash}{ext}"
            filepath = os.path.join(output_dir, filename)
            
            # Save local copy
            with open(filepath, 'wb') as f:
                f.write(img_data)
                
            relative_path = f"data/images/{filename}"
            print(f"[SUCCESS] Saved to local path: {relative_path}")
            return relative_path
            
    except Exception as e:
        print(f"[ERROR] Failed to fetch image from URL: {url}\nReason: {e}")
        raise

def main():
    # Paths are relative to the script location or gazette root
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    draft_path = os.path.join(project_root, 'data', 'draft.json')
    images_dir = os.path.join(project_root, 'data', 'images')
    
    # Create images directory
    os.makedirs(images_dir, exist_ok=True)
    
    if not os.path.exists(draft_path):
        print(f"[ERROR] draft.json not found at: {draft_path}")
        sys.exit(1)
        
    print(f"Reading draft data from: {draft_path}")
    with open(draft_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    has_changes = False
    
    # 1. Verify and download main visual artifact image
    if 'visualArtifact' in data and 'imageUrl' in data['visualArtifact']:
        img_url = data['visualArtifact']['imageUrl']
        if img_url:
            try:
                local_url = verify_and_download_image(img_url, images_dir)
                if local_url != img_url:
                    data['visualArtifact']['imageUrl'] = local_url
                    has_changes = True
            except Exception:
                print(f"[FATAL] Visual Artifact image verification failed!")
                sys.exit(1)
                
    # 2. Verify and download dynamic news images
    if 'dynamicNews' in data and isinstance(data['dynamicNews'], list):
        for idx, news_item in enumerate(data['dynamicNews']):
            if 'imageUrl' in news_item:
                news_img_url = news_item['imageUrl']
                if news_img_url:
                    try:
                        local_news_url = verify_and_download_image(news_img_url, images_dir)
                        if local_news_url != news_img_url:
                            news_item['imageUrl'] = local_news_url
                            has_changes = True
                    except Exception:
                        print(f"[FATAL] News item {idx} ({news_item.get('headline', '')[:15]}) image verification failed!")
                        sys.exit(1)
                        
    # Save back to draft.json if there are updates
    if has_changes:
        print("Updating draft.json with local relative image links...")
        with open(draft_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("[FINISHED] Image links successfully localized.")
    else:
        print("[FINISHED] No external image link updates needed.")

if __name__ == "__main__":
    main()
