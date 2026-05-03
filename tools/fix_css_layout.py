import re

css_path = "css/style.css"

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# 1. Update root variables for better Aesthetics
css = re.sub(
    r"--shadow-soft:.*?;", 
    "--shadow-soft: 0 16px 40px rgba(0, 0, 0, 0.65), inset 0 1px 1px rgba(255,255,255,0.08);", 
    css
)
css = re.sub(
    r"--glass-border:.*?;", 
    "--glass-border: 1px solid rgba(212, 168, 83, 0.35);", 
    css
)
css = re.sub(
    r"--glass-bg:.*?;", 
    "--glass-bg: rgba(18, 28, 40, 0.75);", 
    css
)

# 2. Fix layout breaking (跑版)
# Make sure .view-section and .hub-content are strictly bounded
if "max-width: 100vw;" not in css.split(".view-section {")[1][:200]:
    css = css.replace(".view-section {\n", ".view-section {\n    max-width: 100vw;\n    box-sizing: border-box;\n")

# 3. Add Bubble Sort UI Styles at the end
bubble_styles = """
/* ================= BUBBLE SORT MODE ================= */
#bubble-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 20px 10px;
    z-index: 10;
}
.bubble-row {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
    width: 100%;
    max-width: 380px;
    min-height: 120px;
    perspective: 1000px;
}
.bubble-node {
    width: 65px;
    height: 85px;
    background: linear-gradient(145deg, rgba(30,45,65,0.9), rgba(15,25,35,0.95));
    border: 1px solid rgba(212, 168, 83, 0.6);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 900;
    color: var(--color-primary);
    box-shadow: 0 10px 25px rgba(0,0,0,0.6), inset 0 2px 10px rgba(212, 168, 83, 0.2);
    cursor: pointer;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s, background 0.3s;
    user-select: none;
    position: relative;
    overflow: hidden;
}
.bubble-node::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 40%;
    background: linear-gradient(180deg, rgba(255,255,255,0.1), transparent);
    pointer-events: none;
}
.bubble-node[data-val]::after {
    content: attr(data-val);
    font-size: 10px;
    position: absolute;
    bottom: 5px;
    color: var(--color-text-dim);
    letter-spacing: 1px;
}
.bubble-node.selected {
    transform: translateY(-15px) scale(1.1);
    box-shadow: 0 20px 40px rgba(212, 168, 83, 0.4), inset 0 2px 15px rgba(212, 168, 83, 0.5);
    border-color: #ffd6a5;
    color: #fff;
    background: linear-gradient(145deg, rgba(60,85,115,0.95), rgba(25,45,65,0.95));
    z-index: 5;
}
.bubble-node.swapping {
    animation: swapAnim 0.4s ease-in-out;
    z-index: 4;
}
.bubble-node.sorted {
    border-color: var(--color-mana);
    color: var(--color-mana);
    box-shadow: 0 0 15px rgba(46, 204, 113, 0.3);
    animation: sortedPulse 1s ease-out;
}
@keyframes swapAnim {
    0% { transform: scale(1.1); filter: brightness(1.5); }
    50% { transform: scale(0.9); filter: brightness(0.8); }
    100% { transform: scale(1); filter: brightness(1); }
}
@keyframes sortedPulse {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); }
    50% { transform: scale(1.1); box-shadow: 0 0 0 15px rgba(46, 204, 113, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
}
.bubble-status {
    font-size: 14px;
    color: var(--color-text-dim);
    text-align: center;
    margin-top: 10px;
    font-weight: 800;
}
"""
if "BUBBLE SORT MODE" not in css:
    css += bubble_styles

# Add a glow effect on buttons
btn_glow = """
.btn-primary {
    position: relative;
    overflow: hidden;
}
.btn-primary::after {
    content: '';
    position: absolute;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 60%);
    opacity: 0;
    transform: scale(0.5);
    transition: opacity 0.3s, transform 0.3s;
    pointer-events: none;
}
.btn-primary:active::after {
    opacity: 1;
    transform: scale(1);
    transition: 0s;
}
"""
if "btn-primary::after" not in css:
    css += btn_glow

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("CSS styling updated successfully.")
