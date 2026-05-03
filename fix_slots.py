import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix slotCount calculation in generateLevels
old_calc = r'const slotCount = id >= 18 \? 6 : id >= 6 \? 5 : 4;'
new_calc = 'const slotCount = (chapterIndex >= 3) ? 6 : (chapterIndex >= 1) ? 5 : 4;'

content = re.sub(old_calc, new_calc, content)

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
