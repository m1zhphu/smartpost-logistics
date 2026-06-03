import os
import re

src_dir = r"d:\smartpost-logistics\frontend\src"
styles_dir = r"d:\smartpost-logistics\frontend\src\styles"

def process_vue_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = re.compile(r'^(<style[^>]*>)(.*?)^</style>', re.MULTILINE | re.DOTALL)
    matches = list(pattern.finditer(content))

    if not matches:
        return False

    rel_path = os.path.relpath(file_path, src_dir)
    base_name = os.path.splitext(rel_path)[0]
    
    processed = False
    new_content = content
    
    # Process from last to first
    for idx, match in enumerate(reversed(matches)):
        style_tag_open = match.group(1)
        css_content = match.group(2).strip()
        
        # skip if already just a src import or empty
        if ('src=' in style_tag_open and not css_content) or not css_content:
            continue
            
        suffix = f"-{len(matches) - idx}" if len(matches) > 1 else ""
        css_rel_path = f"{base_name}{suffix}.css"
        css_full_path = os.path.join(styles_dir, css_rel_path)
        
        os.makedirs(os.path.dirname(css_full_path), exist_ok=True)
        
        with open(css_full_path, 'w', encoding='utf-8') as f:
            f.write(css_content + '\n')
            
        import_path = '@/styles/' + css_rel_path.replace('\\\\', '/').replace('\\', '/')
        new_style_tag_open = re.sub(r'\s*src=(["\']).*?\1', '', style_tag_open)
        
        tag_inner = new_style_tag_open[:-1]
        new_style_block = f'{tag_inner} src="{import_path}"></style>'
        
        start, end = match.span()
        new_content = new_content[:start] + new_style_block + new_content[end:]
        processed = True

    if processed:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Processed: {rel_path} -> {css_rel_path}")
        return True
    return False

count = 0
for root, dirs, files in os.walk(src_dir):
    if 'styles' in root.split(os.sep): continue
    for file in files:
        if file.endswith('.vue'):
            if process_vue_file(os.path.join(root, file)):
                count += 1
print(f"Done. Processed {count} files.")
