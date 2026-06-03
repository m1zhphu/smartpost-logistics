import os
import re

css_dir = r'd:\smartpost-logistics\frontend\src\styles'

color_map = {
    # Primary
    '#4318ff': 'var(--sp-primary)',
    '#3311db': 'var(--sp-primary-hover)',
    '#409eff': 'var(--sp-primary)',
    '#868cff': 'var(--sp-primary-light)',
    
    # Text main
    '#2b3674': 'var(--sp-text-main)',
    '#1b2559': 'var(--sp-text-main)',
    '#1e293b': 'var(--sp-text-main)',
    '#1f2937': 'var(--sp-text-main)',
    '#111827': 'var(--sp-text-main)',
    
    # Text muted
    '#a3aed0': 'var(--sp-text-muted)',
    '#8f9bba': 'var(--sp-text-muted)',
    '#6b7280': 'var(--sp-text-muted)',
    '#64748b': 'var(--sp-text-muted)',
    '#4b5563': 'var(--sp-text-muted)',
    '#9ca3af': 'var(--sp-text-muted)',
    '#a0aec0': 'var(--sp-text-muted)',
    
    # Backgrounds
    '#f4f7fe': 'var(--sp-bg-app)',
    '#e9edf7': 'var(--sp-bg-app)',
    '#f0f2f5': 'var(--sp-bg-app)',
    '#f1f5f9': 'var(--sp-bg-app)',
    
    # Success
    '#05cd99': 'var(--sp-success)',
    '#16a34a': 'var(--sp-success)',
    '#15803d': 'var(--sp-success)',
    '#28a745': 'var(--sp-success)',
    
    # Warning
    '#ffb547': 'var(--sp-warning)',
    '#ffc107': 'var(--sp-warning)',
    '#eab308': 'var(--sp-warning)',
    
    # Danger
    '#ee5d50': 'var(--sp-danger)',
    '#ff3b30': 'var(--sp-danger)',
    '#f56c6c': 'var(--sp-danger)',
    '#dc3545': 'var(--sp-danger)',
    
    # Borders
    '#e2e8f0': 'var(--sp-border)',
    '#cbd5e1': 'var(--sp-border)',
    '#d1d5db': 'var(--sp-border)'
}

def replacer(match):
    hex_color = match.group(0).lower()
    return color_map.get(hex_color, match.group(0))

pattern = re.compile('(?i)' + '|'.join(map(re.escape, color_map.keys())))

count = 0
for root, _, files in os.walk(css_dir):
    for f in files:
        if f.endswith('.css'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
                
            new_content = pattern.sub(replacer, content)
            
            # also replace white background with glassmorphism surface where appropriate
            new_content = re.sub(r'(?i)background-color:\s*#ffffff\s*;', 'background-color: var(--sp-surface); backdrop-filter: blur(12px);', new_content)
            new_content = re.sub(r'(?i)background:\s*#ffffff\s*;', 'background: var(--sp-surface); backdrop-filter: blur(12px);', new_content)
            new_content = re.sub(r'(?i)background-color:\s*#fff\s*;', 'background-color: var(--sp-surface); backdrop-filter: blur(12px);', new_content)
            new_content = re.sub(r'(?i)background:\s*#fff\s*;', 'background: var(--sp-surface); backdrop-filter: blur(12px);', new_content)
            
            if content != new_content:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                count += 1

print(f'Replaced colors in {count} files.')
