import re

def find_inline(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.search(r'export default function [^{]+{', content)
    if not match:
        return
    
    start_idx = match.end()
    
    inline_comps = re.findall(r'const ([A-Z]\w+)\s*=\s*(?:\([^)]*\)|props)\s*=>\s*[{(]', content[start_idx:])
    if inline_comps:
        print("Found inline components:", inline_comps)
    else:
        print("No inline components found.")

find_inline(r'd:\code\smartpost-logistics\mobile\src\screens\CustomerCreatePickupScreen.js')
