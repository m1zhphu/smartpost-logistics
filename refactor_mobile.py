import re
import os

def extract_components(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Move blurProps outside
    if "const blurProps = {" in content:
        blur_props_match = re.search(r'(const blurProps = \{[\s\S]*?\n  \};\n)', content)
        if blur_props_match:
            blur_props_str = blur_props_match.group(1)
            # Remove ONLY the FIRST occurrence inside the component
            # Actually, to be safe, find `export default function` and remove the first `blurProps` after it
            content = content.replace(blur_props_str, "", 1)
            # Add it before `export default function`
            content = content.replace('export default function', blur_props_str + '\nexport default function', 1)

    components_to_extract = [
        "HeaderButton", "GlassInput", "SelectBox", 
        "GlassTextInput", "GlassCard", "SelectionBox", "SectionTitle", "FieldLabel"
    ]

    for comp in components_to_extract:
        # Regex to match `const CompName = ({...}) => (` ... `);`
        # Because nested parenthesis can be tricky, let's use a regex that looks for 
        # `  const CompName = ({` or `  const CompName = (` and goes until `  );\n`
        
        pattern = rf'(  const {comp} = \([\s\S]*?\n  \);\n)'
        match = re.search(pattern, content)
        if match:
            comp_str = match.group(1)
            content = content.replace(comp_str, "")
            
            # Unindent the extracted component
            lines = comp_str.split('\n')
            unindented_lines = [line[2:] if line.startswith('  ') else line for line in lines]
            comp_str_unindented = '\n'.join(unindented_lines)
            
            # Place it before the default export
            content = content.replace('export default function', comp_str_unindented + '\nexport default function', 1)
            
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

files = [
    r'd:\code\smartpost-logistics\mobile\src\screens\CustomerUpdateProfileScreen.js',
    r'd:\code\smartpost-logistics\mobile\src\screens\ForgotPasswordScreen.js',
    r'd:\code\smartpost-logistics\mobile\src\screens\CustomerCreatePickupScreen.js'
]

for f in files:
    if os.path.exists(f):
        print("Refactoring:", f)
        extract_components(f)
