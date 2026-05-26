import os
import json
import glob
import urllib.request
import urllib.parse
import urllib.error
import base64

def load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    parts = line.split('=', 1)
                    if len(parts) == 2:
                        key = parts[0].strip()
                        val = parts[1].strip().strip('"').strip("'")
                        env_vars[key] = val
    return env_vars

def get_decoded_string(b64_str):
    return base64.b64decode(b64_str.encode('utf-8')).decode('utf-8')

def query_notion_db(db_id, token):
    url = f"https://api.notion.com/v1/databases/{db_id}/query"
    req = urllib.request.Request(
        url,
        data=b'{}',
        headers={
            "Authorization": f"Bearer {token}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            return data.get('results', [])
    except urllib.error.HTTPError as e:
        print(f"Error querying DB {db_id}: HTTP Error {e.code}: {e.reason}")
        try:
            print(e.read().decode('utf-8'))
        except Exception:
            pass
        return []
    except Exception as e:
        print(f"Error querying DB {db_id}: {e}")
        return []

def create_notion_page(db_id, properties, token):
    url = "https://api.notion.com/v1/pages"
    body = {
        "parent": {"database_id": db_id},
        "properties": properties
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {token}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Error creating page in DB {db_id}: HTTP Error {e.code}: {e.reason}")
        try:
            print(e.read().decode('utf-8'))
        except Exception:
            pass
        return None
    except Exception as e:
        print(f"Error creating page in DB {db_id}: {e}")
        return None

def main():
    env = load_env()
    token = env.get('NOTION_TOKEN')
    if not token:
        print("Error: NOTION_TOKEN not found in .env")
        return
        
    main_db_id = "36b59276-212b-8156-b9e8-c84b9f720a28"
    news_db_id = "36b59276-212b-81f5-8e88-de7650513cff"
    
    col_main_title = get_decoded_string("5bCI5qyE5Li76aGM") # "專題主題"
    col_news_title = get_decoded_string("5paw6IGe5qiZ6aGM") # "新聞主題"
    col_status = get_decoded_string("55m85biD54uA5oWL")     # "發布狀態"
    status_archive = get_decoded_string("5bey5q245qqU")    # "已歸檔"
    
    # 1. Query existing titles from Notion to prevent duplicates
    print("Querying existing entries in Notion...")
    main_results = query_notion_db(main_db_id, token)
    news_results = query_notion_db(news_db_id, token)
    
    existing_mains = set()
    for item in main_results:
        props = item.get('properties', {})
        title_prop = props.get(col_main_title, {}).get('title', [])
        if title_prop:
            existing_mains.add(title_prop[0].get('plain_text', '').strip())
            
    existing_news = set()
    for item in news_results:
        props = item.get('properties', {})
        title_prop = props.get(col_news_title, {}).get('title', [])
        if title_prop:
            existing_news.add(title_prop[0].get('plain_text', '').strip())
            
    print(f"Found {len(existing_mains)} existing main topics and {len(existing_news)} existing news topics in Notion.")
    
    # 2. Extract historical topics from local archives
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    archive_dir = os.path.join(project_root, 'data', 'archive')
    draft_path = os.path.join(project_root, 'data', 'draft.json')
    
    files_to_scan = []
    if os.path.exists(draft_path):
        files_to_scan.append(draft_path)
    if os.path.exists(archive_dir):
        files_to_scan.extend(glob.glob(os.path.join(archive_dir, '*.json')))
        
    mains_to_add = {}
    news_to_add = {}
    
    for filepath in files_to_scan:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                # Main topic
                main_title = data.get('aestheticSpark', {}).get('title', '').strip()
                if main_title and main_title not in existing_mains:
                    mains_to_add[main_title] = mains_to_add.get(main_title, [])
                    
                # News topics
                for news in data.get('dynamicNews', []):
                    headline = news.get('headline', '').strip()
                    if headline and headline not in existing_news:
                        news_to_add[headline] = news_to_add.get(headline, [])
        except Exception as e:
            print(f"Error reading file {filepath}: {e}")
            
    # 3. Add missing topics to Notion with status "已歸檔" (Archived)
    print(f"Adding {len(mains_to_add)} missing main topics to Notion...")
    for title in mains_to_add:
        properties = {
            col_main_title: {
                "title": [{"text": {"content": title}}]
            },
            col_status: {
                "select": {"name": status_archive}
            }
        }
        res = create_notion_page(main_db_id, properties, token)
        if res:
            print(f"Created main topic page: {title}")
            
    print(f"Adding {len(news_to_add)} missing news topics to Notion...")
    for headline in news_to_add:
        properties = {
            col_news_title: {
                "title": [{"text": {"content": headline}}]
            },
            col_status: {
                "select": {"name": status_archive}
            }
        }
        res = create_notion_page(news_db_id, properties, token)
        if res:
            print(f"Created news page: {headline}")
            
    print("History sync complete!")

if __name__ == '__main__':
    main()
