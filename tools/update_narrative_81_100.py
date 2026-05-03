import re
import json

md_path = "docs/narrative/VOLUME_05_LAST_EQUATION.md"
js_path = "js/narrative.js"

with open(md_path, "r", encoding="utf-8") as f:
    md_content = f.read()

levels = {}
blocks = md_content.split("### 第 ")
for block in blocks[1:]:
    level_match = re.search(r"(\d+) 關：(.*?)\n", block)
    if not level_match:
        continue
    level_num = int(level_match.group(1))
    
    novel_match = re.search(r"\*\*【小說敘事】\*\*\n(.*?)(?=\*\*【開場對話】\*\*)", block, re.DOTALL)
    novel_text = novel_match.group(1).strip().replace("\n", "") if novel_match else ""
    
    dialogue_match = re.search(r"\*\*【開場對話】\*\*\n(.*?)(?=\*\*【章節結尾|---|$)", block, re.DOTALL)
    dialogues = []
    if dialogue_match:
        lines = dialogue_match.group(1).strip().split("\n")
        for line in lines:
            line = line.strip()
            if line.startswith("*   **"):
                # e.g. *   **護衛長伊凡**：「它剛才還在那裡閃閃發光...」
                # match names to roles
                m = re.search(r"\*\*(.*?)\*\*：「(.*?)」", line)
                if m:
                    name = m.group(1)
                    text = m.group(2)
                    
                    char_id = "client"
                    if "主角" in name: char_id = "player"
                    elif "夏洛特" in name: char_id = "iris"
                    elif "莫里亞蒂" in name: char_id = "rival"
                    
                    dialogues.append({"char": char_id, "text": text})

    levels[level_num] = {
        "novel": novel_text,
        "dialogue": dialogues
    }

with open(js_path, "r", encoding="utf-8") as f:
    js_content = f.read()

import re
# Replace from `    81: {` to the end.
start_idx = js_content.find("    81: {")
if start_idx == -1:
    print("Could not find start of level 81")
    exit(1)

new_js = js_content[:start_idx]
for i in range(81, 101):
    if i not in levels:
        print(f"Warning: level {i} not found in MD")
        continue
    
    level = levels[i]
    new_js += f"    {i}: {{\n"
    new_js += f"        novel: \"{level['novel']}\",\n"
    new_js += f"        dialogue: [\n"
    for j, d in enumerate(level['dialogue']):
        comma = "," if j < len(level['dialogue']) - 1 else ""
        new_js += f"            {{ char: \"{d['char']}\", text: \"{d['text']}\" }}{comma}\n"
    new_js += f"        ]\n"
    comma_level = "," if i < 100 else ""
    new_js += f"    }}{comma_level}\n"

new_js += "};\n"

with open(js_path, "w", encoding="utf-8") as f:
    f.write(new_js)

print("Updated js/narrative.js successfully!")
