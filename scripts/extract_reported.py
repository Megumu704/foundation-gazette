import os
import json
import glob

def clean_topic(topic):
    if not topic:
        return ""
    # Strip brackets and extra spaces
    for char in ["《", "》", "【", "】", "[", "]", "“", "”", '"', "'"]:
        topic = topic.replace(char, "")
    return topic.strip()

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    archive_dir = os.path.join(project_root, 'data', 'archive')
    draft_path = os.path.join(project_root, 'data', 'draft.json')
    output_path = os.path.join(project_root, 'data', 'reported_topics.json')
    
    reported_topics = set()
    
    # Read draft.json
    if os.path.exists(draft_path):
        try:
            with open(draft_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if 'aestheticSpark' in data and 'title' in data['aestheticSpark']:
                    t = clean_topic(data['aestheticSpark']['title'])
                    if t: reported_topics.add(t)
                if 'dynamicNews' in data and isinstance(data['dynamicNews'], list):
                    for news in data['dynamicNews']:
                        if 'headline' in news:
                            t = clean_topic(news['headline'])
                            if t: reported_topics.add(t)
        except Exception as e:
            print(f"Warning: Failed to parse draft.json: {e}")
            
    # Read all archived JSONs
    if os.path.exists(archive_dir):
        json_files = glob.glob(os.path.join(archive_dir, '*.json'))
        for filepath in json_files:
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if 'aestheticSpark' in data and 'title' in data['aestheticSpark']:
                        t = clean_topic(data['aestheticSpark']['title'])
                        if t: reported_topics.add(t)
                    if 'dynamicNews' in data and isinstance(data['dynamicNews'], list):
                        for news in data['dynamicNews']:
                            if 'headline' in news:
                                t = clean_topic(news['headline'])
                                if t: reported_topics.add(t)
            except Exception as e:
                print(f"Warning: Failed to parse archive file {filepath}: {e}")
                
    output_data = {
        "reportedTopics": sorted(list(reported_topics))
    }
    
    # Write to data/reported_topics.json
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully compiled {len(reported_topics)} unique reported topics to data/reported_topics.json")

if __name__ == "__main__":
    main()
