import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_markup = r'    getLevelCardMarkup\(level, stars\) \{.*?return `.*?<div class="level-card-top">.*?<span class="level-tag">\$\{level\.chapter\}</span>.*?<span class="level-tag alt">\$\{level\.slotCount\} 格</span>.*?</div>.*?<h3>案件 #\$\{level\.id\.toString\(\)\.padStart\(2, \'0\'\)\}：\$\{level\.title\}</h3>'
new_markup = """    getLevelCardMarkup(level, stars) {
        const status = this.getLevelStatus(level, stars);
        const chapterStep = ((level.id - 1) % 6) + 1;

        return `
            <div class="level-card-top">
                <div class="level-icon-wrap">
                    <img src="assets/icons/ui_casefile.png" alt="案件">
                </div>
                <div style="display:flex; flex-direction:column; gap:2px;">
                    <span class="level-tag">${level.chapter}</span>
                    <span class="level-tag alt">${level.slotCount} 格</span>
                </div>
            </div>
            <h3>案件 #${level.id.toString().padStart(2, '0')}：${level.title}</h3>"""

content = re.sub(old_markup, new_markup, content, flags=re.DOTALL)

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
