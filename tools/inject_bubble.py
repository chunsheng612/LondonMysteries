import re

js_path = "js/app.js"

with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

bubble_methods = """
    setupBubbleBoard(title, desc, slotCount = 5, levelData = null) {
        this.clearCombatTimer();
        this.els.gameTitle.textContent = title;
        this.els.gameDesc.textContent = desc;
        this.gameState.rule = 'bubble';
        this.gameState.slotCount = slotCount;
        this.gameState.maxMana = this.gameState.maxMana || this.getModeMaxMana(this.gameMode);
        
        // Secret is 1 to slotCount
        const sorted = Array.from({length: slotCount}, (_, i) => String(i + 1));
        this.gameState.secret = sorted;
        
        // Shuffle for input, ensure it's not already sorted
        let shuffled;
        do {
            shuffled = this.shuffleSequence([...sorted], Math.random);
        } while (shuffled.join(',') === sorted.join(','));
        this.gameState.input = shuffled;
        
        this.gameState.turn = 0;
        this.gameState.solved = false;
        this.gameState.levelData = levelData;
        this.gameState.timeLimit = this.gameMode === 'story' && levelData?.timeLimit ? levelData.timeLimit + this.getStoryTimerBonus() : 0;
        this.gameState.timeLeft = this.gameState.timeLimit || 0;
        this.gameState.selectedBubbleIndex = null;
        this.gameState.isSwapping = false;

        this.els.slotsContainer.innerHTML = '';
        this.els.inputConsole.classList.add('hidden');
        this.els.paletteContainer.classList.add('hidden');
        this.els.history.innerHTML = '<div class="empty-hint">冒泡排序：點擊相鄰的兩個節點進行交換，直到數字從小到大排列。</div>';
        
        this.updateCombatStage();
        this.renderBubbleUI();
        
        requestAnimationFrame(() => this.updateLayoutMetrics());
        if (this.gameMode === 'story' && this.gameState.timeLimit) this.startStoryTimer();
    }

    renderBubbleUI() {
        // Find or create bubble container
        let bContainer = document.getElementById('bubble-container');
        if (!bContainer) {
            bContainer = document.createElement('div');
            bContainer.id = 'bubble-container';
            // Insert it between history and inputConsole
            this.els.history.parentNode.insertBefore(bContainer, this.els.inputConsole);
        }
        
        bContainer.innerHTML = `
            <div class="bubble-row">
                ${this.gameState.input.map((val, idx) => `
                    <div class="bubble-node ${this.gameState.selectedBubbleIndex === idx ? 'selected' : ''}" data-idx="${idx}" data-val="${val}">
                        ${val}
                    </div>
                `).join('')}
            </div>
            <div class="bubble-status">步數：${this.gameState.turn}</div>
        `;
        
        const nodes = bContainer.querySelectorAll('.bubble-node');
        nodes.forEach(node => {
            node.addEventListener('click', (e) => {
                if (this.gameState.solved || this.gameState.isSwapping) return;
                const idx = parseInt(node.getAttribute('data-idx'));
                this.handleBubbleClick(idx);
            });
        });
    }

    handleBubbleClick(idx) {
        if (this.gameState.selectedBubbleIndex === null) {
            this.gameState.selectedBubbleIndex = idx;
            if (window.audio && window.audio.playClick) window.audio.playClick();
            this.renderBubbleUI();
        } else {
            const prevIdx = this.gameState.selectedBubbleIndex;
            if (prevIdx === idx) {
                // deselect
                this.gameState.selectedBubbleIndex = null;
                if (window.audio && window.audio.playClick) window.audio.playClick();
                this.renderBubbleUI();
            } else if (Math.abs(prevIdx - idx) === 1) {
                // swap adjacent
                this.gameState.isSwapping = true;
                if (window.audio && window.audio.playScan) window.audio.playScan();
                
                const bContainer = document.getElementById('bubble-container');
                const nodes = bContainer.querySelectorAll('.bubble-node');
                nodes[prevIdx].classList.add('swapping');
                nodes[idx].classList.add('swapping');
                
                setTimeout(() => {
                    const temp = this.gameState.input[prevIdx];
                    this.gameState.input[prevIdx] = this.gameState.input[idx];
                    this.gameState.input[idx] = temp;
                    this.gameState.turn++;
                    this.gameState.selectedBubbleIndex = null;
                    this.gameState.isSwapping = false;
                    this.renderBubbleUI();
                    this.checkBubbleWin();
                }, 400);
            } else {
                // Not adjacent, just select the new one
                this.gameState.selectedBubbleIndex = idx;
                if (window.audio && window.audio.playClick) window.audio.playClick();
                this.renderBubbleUI();
            }
        }
    }

    checkBubbleWin() {
        if (this.gameState.input.join(',') === this.gameState.secret.join(',')) {
            this.gameState.solved = true;
            this.clearCombatTimer();
            if (window.audio && window.audio.playSuccess) window.audio.playSuccess();
            const bContainer = document.getElementById('bubble-container');
            const nodes = bContainer.querySelectorAll('.bubble-node');
            nodes.forEach(n => n.classList.add('sorted'));
            
            setTimeout(() => {
                this.showStoryResult(this.gameState.input, { exact: this.gameState.slotCount, totalSlots: this.gameState.slotCount, turns: this.gameState.turn, hintUsed: false }, 3);
            }, 1000);
        }
    }
"""

if "setupBubbleBoard" not in js:
    # Inject bubble_methods right before setupBoard
    js = js.replace(
        "    setupBoard(title, desc, rule, slotCount = 5, levelData = null) {",
        bubble_methods + "\n    setupBoard(title, desc, rule, slotCount = 5, levelData = null) {"
    )

    # Inject check inside setupBoard
    setup_board_start = "    setupBoard(title, desc, rule, slotCount = 5, levelData = null) {\n        this.clearCombatTimer();"
    setup_board_new = setup_board_start + "\n        if (rule === 'bubble') return this.setupBubbleBoard(title, desc, slotCount, levelData);"
    js = js.replace(setup_board_start, setup_board_new)

    # Make sure we clean up bubble container when exiting or starting non-bubble
    update_ui_start = "    updateGameUI() {"
    update_ui_new = update_ui_start + "\n        if (this.gameState && this.gameState.rule === 'bubble') return; // Handled by renderBubbleUI\n        const bContainer = document.getElementById('bubble-container');\n        if (bContainer) bContainer.remove();\n        this.els.inputConsole.classList.remove('hidden');\n        this.els.paletteContainer.classList.remove('hidden');"
    js = js.replace(update_ui_start, update_ui_new)

    with open(js_path, "w", encoding="utf-8") as f:
        f.write(js)
    print("Bubble logic injected successfully.")
else:
    print("Bubble logic already exists.")
