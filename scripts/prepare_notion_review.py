import os
import json
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

def update_page_properties(page_id, properties, token):
    url = f"https://api.notion.com/v1/pages/{page_id}"
    body = {"properties": properties}
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {token}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        },
        method="PATCH"
    )
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Error updating page {page_id}: HTTP Error {e.code}: {e.reason}")
        try:
            print(e.read().decode('utf-8'))
        except Exception:
            pass
        return None
    except Exception as e:
        print(f"Error updating page {page_id}: {e}")
        return None

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
    except Exception as e:
        print(f"Error querying DB {db_id}: {e}")
        return []

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
    col_priority = get_decoded_string("5YSq5YWI6aCG5L2N")   # "優先順位"
    
    news1_title = "第十屆CR動漫大獎東京揭曉"
    news2_title = "007初光發售重塑龐德起源"
    main_title = "天野喜孝"
    
    print("Querying databases to find the current issue pages...")
    main_results = query_notion_db(main_db_id, token)
    news_results = query_notion_db(news_db_id, token)
    
    # 1. Update News DB pages
    print("Updating current issue news pages to active status...")
    for item in news_results:
        props = item.get('properties', {})
        
        # Safe title retrieval
        title_prop = props.get(col_news_title)
        t = ""
        if title_prop and title_prop.get('title'):
            t = title_prop['title'][0].get('plain_text', '').strip() if title_prop['title'] else ""
            
        # Safe status retrieval
        status_prop = props.get(col_status)
        status_name = None
        if status_prop and status_prop.get('select'):
            status_name = status_prop['select'].get('name')
            
        if t == news1_title:
            # Set status to empty (Pending) and priority to 1
            properties = {
                col_status: {"select": None},
                col_priority: {"number": 1}
            }
            res = update_page_properties(item['id'], properties, token)
            if res:
                print(f"Set {news1_title} to Active (Priority 1)")
        elif t == news2_title:
            # Set status to empty (Pending) and priority to 2
            properties = {
                col_status: {"select": None},
                col_priority: {"number": 2}
            }
            res = update_page_properties(item['id'], properties, token)
            if res:
                print(f"Set {news2_title} to Active (Priority 2)")
        elif status_name is None:
            # Deprioritize other active news pages to avoid conflict
            properties = {
                col_priority: {"number": 99}
            }
            update_page_properties(item['id'], properties, token)
            print(f"Deprioritized other active news page: {t}")

    # 2. Update Main DB pages
    print("Updating current issue main page to active status...")
    for item in main_results:
        props = item.get('properties', {})
        
        # Safe title retrieval
        title_prop = props.get(col_main_title)
        t = ""
        if title_prop and title_prop.get('title'):
            t = title_prop['title'][0].get('plain_text', '').strip() if title_prop['title'] else ""
            
        # Safe status retrieval
        status_prop = props.get(col_status)
        status_name = None
        if status_prop and status_prop.get('select'):
            status_name = status_prop['select'].get('name')
            
        if t == main_title:
            properties = {
                col_status: {"select": None},
                col_priority: {"number": 1}
            }
            res = update_page_properties(item['id'], properties, token)
            if res:
                print(f"Set {main_title} to Active (Priority 1)")
        elif status_name is None:
            # Deprioritize other active main pages
            properties = {
                col_priority: {"number": 99}
            }
            update_page_properties(item['id'], properties, token)
            print(f"Deprioritized other active main page: {t}")
                
    print("Notion review preparation complete!")

if __name__ == '__main__':
    main()
