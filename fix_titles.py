import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_open_title = """    openTitleUpgradePage(initialTab = 'equip') {
        this.currentTitleTab = initialTab;
        const catalog = this.getTitleCatalog();
        const unlockedTitles = new Set(this.data.player.unlockedTitles);
        
        const tabsHtml = `
            <div class="modal-tabs">
                <button class="modal-tab ${this.currentTitleTab === 'equip' ? 'active' : ''}" data-title-tab="equip">稱號裝備</button>
                <button class="modal-tab ${this.currentTitleTab === 'upgrade' ? 'active' : ''}" data-title-tab="upgrade">稱號強化</button>
            </div>
        `;

        const cards = catalog.map((title) => {
            const isUnlocked = unlockedTitles.has(title.id);
            const isActive = this.data.player.activeTitle === title.id;
            const level = this.getTitleLevel(title.id);
            const maxLevel = title.maxLevel || 10;
            const atMax = level >= maxLevel;
            const upgradeCost = this.getTitleUpgradeCost(title.id);
            const canUpgrade = isUnlocked && !atMax && this.data.coins >= upgradeCost;
            const canBuy = !isUnlocked && this.data.coins >= title.cost;
            const desc = title.levelDesc ? title.levelDesc(level) : title.desc;

            if (this.currentTitleTab === 'equip') {
                let actionButton = '';
                if (!isUnlocked) {
                    actionButton = `<button class="menu-btn primary-btn" data-title-action="${title.id}" ${canBuy ? '' : 'disabled'}>解鎖 (${title.cost} 英鎊)</button>`;
                } else {
                    actionButton = `<button class="menu-btn ${isActive ? 'active' : ''}" data-title-action="${title.id}" ${isActive ? 'disabled' : ''}>${isActive ? '使用中' : '裝備'}</button>`;
                }

                return `
                    <article class="inventory-card title-card ${isActive ? 'selected' : ''}">
                        <div class="inventory-meta">
                            <h3>${title.name}</h3>
                            <p>${desc}</p>
                        </div>
                        ${actionButton}
                    </article>
                `;
            } else {
                if (!isUnlocked) return ''; 
                
                let upgradeButton = '';
                if (!atMax) {
                    upgradeButton = `<button class="menu-btn primary-btn" data-title-upgrade="${title.id}" ${canUpgrade ? '' : 'disabled'}>升級 (${upgradeCost})</button>`;
                } else {
                    upgradeButton = `<button class="menu-btn" disabled>已滿級</button>`;
                }

                return `
                    <article class="inventory-card title-card" id="title-upgrade-${title.id}">
                        <span class="inventory-label">Lv.${level}/${maxLevel}</span>
                        <div class="inventory-meta">
                            <h3>${title.name}</h3>
                            <p>${desc}</p>
                        </div>
                        ${upgradeButton}
                    </article>
                `;
            }
        }).join('');

        this.els.titleModalDesc.innerHTML = `
            ${tabsHtml}
            <div class="title-grid ${this.currentTitleTab === 'upgrade' ? 'upgrade-view' : ''}">${cards}</div>
        `;
        this.setModalActive(this.els.titleModal, true);

        this.els.titleModalDesc.querySelectorAll('[data-title-tab]').forEach(el => {
            el.addEventListener('click', () => {
                if (window.audio) window.audio.playClick();
                this.openTitleUpgradePage(el.dataset.titleTab);
            });
        });

        this.els.titleModalDesc.querySelectorAll('[data-title-action]').forEach(el => {
            el.addEventListener('click', () => {
                if (window.audio) window.audio.playClick();
                this.unlockOrEquipTitle(el.dataset.titleAction);
                if (this.data.player.unlockedTitles.includes(el.dataset.titleAction)) {
                     this.setModalActive(this.els.titleModal, false);
                } else {
                     this.openTitleUpgradePage('equip');
                }
            });
        });
        this.els.titleModalDesc.querySelectorAll('[data-title-upgrade]').forEach(el => {
            el.addEventListener('click', () => {
                if (window.audio) window.audio.playClick();
                this.upgradeTitleLevel(el.dataset.titleUpgrade);
            });
        });
    }"""

new_upgrade_func = """    upgradeTitleLevel(titleId) {
        const title = this.getTitleCatalog().find(t => t.id === titleId);
        if (!title) return;
        if (!this.data.player.unlockedTitles.includes(titleId)) return;
        const level = this.getTitleLevel(titleId);
        const maxLevel = title.maxLevel || 10;
        if (level >= maxLevel) {
            this.showMessage('已達最高等級', 'error');
            return;
        }
        const cost = this.getTitleUpgradeCost(titleId);
        if (this.data.coins < cost) {
            this.showMessage('英鎊不足', 'error');
            return;
        }
        this.data.coins -= cost;
        this.data.stats.coinsSpent += cost;
        if (!this.data.player.titleLevels) this.data.player.titleLevels = {};
        this.data.player.titleLevels[titleId] = level + 1;
        this.saveData();
        
        const targetCard = document.getElementById(`title-upgrade-${titleId}`);
        if (targetCard) {
            targetCard.classList.add('upgrade-success-anim');
            setTimeout(() => targetCard.classList.remove('upgrade-success-anim'), 1000);
        }

        this.renderInventoryPanel();
        this.openTitleUpgradePage('upgrade');
        this.showMessage(`${title.name} 升級至 Lv.${level + 1}`, 'success');
    }"""

# Use regex to replace the old functions
content = re.sub(r'    openTitleUpgradePage\(\) \{.*?^    \}' , new_open_title, content, flags=re.DOTALL | re.MULTILINE)
content = re.sub(r'    upgradeTitleLevel\(titleId\) \{.*?^    \}', new_upgrade_func, content, flags=re.DOTALL | re.MULTILINE)

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
