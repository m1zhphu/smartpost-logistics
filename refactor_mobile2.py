import re
import os

def extract_components(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    components_to_extract = [
        "GlassTextInput", "GlassCard", "SelectionBox", "SectionTitle", "FieldLabel"
    ]

    for comp in components_to_extract:
        # We look for '  const CompName = ({ ... }) => (\n ... \n  );\n'
        # Or similar. We can use a regex that matches `  const CompName =` and ends at `  );\n` or `  );`
        pattern = rf'([ \t]*const {comp} = [\s\S]*?\n[ \t]*\);[\r\n]+)'
        match = re.search(pattern, content)
        if match:
            comp_str = match.group(1)
            content = content.replace(comp_str, "")
            
            # Unindent lines
            lines = comp_str.split('\n')
            unindented_lines = []
            for line in lines:
                if line.startswith('  '):
                    unindented_lines.append(line[2:])
                else:
                    unindented_lines.append(line)
            comp_str_unindented = '\n'.join(unindented_lines)
            
            # Place it before the default export
            content = content.replace('export default function', comp_str_unindented + 'export default function', 1)
            
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

extract_components(r'd:\code\smartpost-logistics\mobile\src\screens\CustomerCreatePickupScreen.js')
