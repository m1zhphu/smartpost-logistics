import json

log_path = r'C:\Users\XienDev-PC\.gemini\antigravity\brain\114b7d66-d04c-4f86-a062-0b0d55c920f3\.system_generated\logs\transcript.jsonl'
found_content = None

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            entry = json.loads(line)
            if 'tool_calls' in entry:
                for call in entry['tool_calls']:
                    if call['name'] in ['write_to_file', 'replace_file_content', 'multi_replace_file_content']:
                        args = call.get('args', {})
                        target = args.get('TargetFile', '')
                        if 'CustomerCreatePickupScreen.js' in target:
                            if 'CodeContent' in args:
                                found_content = args['CodeContent']
                            elif 'ReplacementContent' in args:
                                # Not perfect but at least we see something
                                pass
        except Exception as e:
            pass

if found_content:
    with open(r'd:\code\smartpost-logistics\mobile\src\screens\CustomerCreatePickupScreen.js', 'w', encoding='utf-8') as f:
        f.write(found_content)
    print("Recovered CustomerCreatePickupScreen.js")
else:
    print("Could not find full CodeContent")
