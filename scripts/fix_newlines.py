import json
import os

def fix_string(val):
    if isinstance(val, str):
        # Replace literal '\n' (two characters) with actual newline character
        # Also replace literal '\\n' if any, but let's be careful to target the '\n' string
        return val.replace('\\n', '\n')
    elif isinstance(val, dict):
        return {k: fix_string(v) for k, v in val.items()}
    elif isinstance(val, list):
        return [fix_string(x) for x in val]
    return val

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    draft_path = os.path.join(project_root, 'data', 'draft.json')
    archive_path = os.path.join(project_root, 'data', 'archive', '2026_05_29.json')
    
    for filepath in [draft_path, archive_path]:
        if os.path.exists(filepath):
            print(f"Fixing newlines in: {filepath}")
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                # If there are literal escaped newlines like '\\n' in raw text
                # We can load it as JSON first
                data = json.loads(content)
            
            fixed_data = fix_string(data)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(fixed_data, f, ensure_ascii=False, indent=2)
            print(f"Successfully fixed {filepath}")

if __name__ == "__main__":
    main()
