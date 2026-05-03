import re

with open('css/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix hub-nav-btn
old_nav = r'\.hub-nav-btn \{.*?background: transparent !important;.*?\}'
new_nav = """.hub-nav-btn {
    position: relative;
    overflow: visible;
    background: transparent !important;
    display: flex;
    align-items: center;
    justify-content: center;
}"""
content = re.sub(old_nav, new_nav, content, flags=re.DOTALL)

# Fix hub-nav-btn::before
old_before = r'\.hub-nav-btn::before \{.*?pointer-events: none;.*?\}'
new_before = """.hub-nav-btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 50%, rgba(212, 168, 83, 0.24), rgba(212, 168, 83, 0.02) 72%, transparent 100%);
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.86);
    transition: opacity 180ms ease, transform 180ms ease;
    pointer-events: none;
}"""
content = re.sub(old_before, new_before, content, flags=re.DOTALL)

# Add tabs and animation at the end
new_styles = """
/* ===== Modal Tabs ===== */
.modal-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    padding: 4px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 14px;
}

.modal-tab {
    flex: 1;
    padding: 10px;
    border: none;
    background: transparent;
    color: var(--color-text-dim);
    font-size: 14px;
    font-weight: 900;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.modal-tab.active {
    background: rgba(212, 168, 83, 0.15);
    color: #f0dfbe;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* ===== Upgrade Animation ===== */
@keyframes upgradePulse {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 168, 83, 0.4); }
    50% { transform: scale(1.02); box-shadow: 0 0 20px 10px rgba(212, 168, 83, 0.2); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 168, 83, 0); }
}

.upgrade-success-anim {
    animation: upgradePulse 0.8s cubic-bezier(0.22, 1, 0.36, 1);
    border-color: rgba(212, 168, 83, 0.6) !important;
}

/* ===== Icon Pill Fix ===== */
.icon-pill {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    vertical-align: middle;
}

.icon-pill img {
    width: 20px;
    height: 20px;
    object-fit: contain;
}
"""
content += new_styles

with open('css/style.css', 'w', encoding='utf-8') as f:
    f.write(content)
