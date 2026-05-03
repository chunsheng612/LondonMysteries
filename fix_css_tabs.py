import re

with open('css/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

new_tabs_css = """
/* ===== Hub Tabs (Cases & Inv) ===== */
.case-tabs, .inv-tabs {
    display: flex;
    gap: 8px;
    margin: 12px 0 16px;
    padding: 4px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
}

.case-tab-btn, .inv-tab-btn {
    flex: 1;
    padding: 10px;
    border: none;
    background: transparent;
    color: var(--color-text-dim);
    font-size: 13px;
    font-weight: 700;
    border-radius: 9px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.case-tab-btn.active, .inv-tab-btn.active {
    background: rgba(212, 168, 83, 0.15);
    color: #f0dfbe;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* ===== Level Card Icon Fix ===== */
.level-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.level-icon-wrap {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    border: 1px solid rgba(212, 168, 83, 0.1);
}

.level-icon-wrap img {
    width: 20px;
    height: 20px;
    object-fit: contain;
    filter: sepia(0.4) brightness(1.2);
}
"""
content += new_tabs_css

with open('css/style.css', 'w', encoding='utf-8') as f:
    f.write(content)
