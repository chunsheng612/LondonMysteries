// app.js

class ParticleEngine {
    constructor() {
        this.container = document.getElementById('particles-container');
        this.colors = ['#ffb703', '#8ecae6', '#ff8fab', '#06d6a0'];
        this.sceneTimer = null;
        this.currentScene = 'hub';
        this.maxAmbientParticles = 26;
        this.setScene('hub');
    }

    random(min, max) {
        return Math.random() * (max - min) + min;
    }

    createParticle({
        x,
        y,
        variant = 'burst',
        colors = this.colors,
        minSize = 4,
        maxSize = 10,
        duration = 1100,
        distance = [30, 100],
        driftX = null,
        driftY = null,
        opacity = [0.75, 1],
        rotate = true
    }) {
        if (!this.container) return;
        const p = document.createElement('div');
        const size = this.random(minSize, maxSize);
        p.className = `particle particle-${variant}`;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.opacity = this.random(opacity[0], opacity[1]).toFixed(2);
        p.style.setProperty('--particle-duration', `${duration}ms`);
        p.style.setProperty('--particle-scale', this.random(1.05, 1.7).toFixed(2));
        p.style.setProperty('--rot', rotate ? `${this.random(0, 360)}deg` : '0deg');

        if (driftX === null || driftY === null) {
            const angle = this.random(0, Math.PI * 2);
            const velocity = this.random(distance[0], distance[1]);
            driftX = Math.cos(angle) * velocity;
            driftY = Math.sin(angle) * velocity;
        }
        p.style.setProperty('--tx', `${driftX}px`);
        p.style.setProperty('--ty', `${driftY}px`);

        this.container.appendChild(p);
        setTimeout(() => {
            if (p.parentNode) p.parentNode.removeChild(p);
        }, duration + 60);
    }

    createExplosion(x, y, count = 20, options = {}) {
        for (let i = 0; i < count; i++) {
            this.createParticle({
                x,
                y,
                variant: options.variant || (i % 5 === 0 ? 'rune' : 'burst'),
                duration: options.duration || this.random(850, 1250),
                minSize: options.minSize || 4,
                maxSize: options.maxSize || 10,
                distance: options.distance || [35, 110],
                colors: options.colors || this.colors
            });
        }
    }

    createCelebration(x, y) {
        this.createExplosion(x, y, 24, { variant: 'burst', colors: ['#ffd166', '#ff8fab', '#8ecae6', '#caffbf'], distance: [40, 120], duration: 1300 });
        this.createExplosion(x, y, 16, { variant: 'spark', colors: ['#fff4bf', '#ffffff', '#a9def9'], distance: [25, 85], minSize: 3, maxSize: 7, duration: 900 });
    }

    createCauldronPulse(x, y) {
        this.createExplosion(x, y, 14, { variant: 'mist', colors: ['#b8f2e6', '#cddafd', '#e4c1f9'], distance: [20, 65], minSize: 6, maxSize: 14, duration: 1600 });
    }

    setScene(scene = 'hub') {
        this.currentScene = scene;
        if (this.sceneTimer) clearInterval(this.sceneTimer);

        const interval = scene === 'game' ? 520 : scene === 'shop' ? 860 : 980;
        this.sceneTimer = setInterval(() => this.spawnAmbient(scene), interval);
    }

    spawnAmbient(scene = this.currentScene) {
        if (!this.container) return;
        if (this.container.querySelectorAll('.particle-ambient, .particle-mist').length > this.maxAmbientParticles) return;

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const palettes = {
            hub: ['#fff0a8', '#ffd6e0', '#c7f0ff'],
            map: ['#ffe08c', '#d0c1ff', '#a4f5df'],
            shop: ['#ffd6a5', '#f9f0c1', '#bde0fe'],
            game: ['#a9def9', '#d0f4de', '#e4c1f9']
        };
        const variant = scene === 'game' && Math.random() > 0.55 ? 'mist' : 'ambient';
        this.createParticle({
            x: this.random(vw * 0.08, vw * 0.92),
            y: vh + this.random(12, 40),
            variant,
            colors: palettes[scene] || palettes.hub,
            minSize: variant === 'mist' ? 10 : 4,
            maxSize: variant === 'mist' ? 18 : 8,
            duration: this.random(2400, 4200),
            driftX: this.random(-32, 32),
            driftY: this.random(-220, -120),
            opacity: variant === 'mist' ? [0.2, 0.38] : [0.32, 0.65],
            rotate: false
        });

        // Add subtle environmental motes
        if (Math.random() < 0.25) {
            this.createParticle({
                x: this.random(0, vw),
                y: this.random(0, vh),
                variant: 'mote',
                colors: ['#ffffff', '#fff4bf'],
                minSize: 1,
                maxSize: 3,
                duration: this.random(4000, 8000),
                driftX: this.random(-15, 15),
                driftY: this.random(-25, -10),
                opacity: [0.08, 0.22],
                rotate: true
            });
        }
    }
}

class DialogueManager {
    constructor(appContext) {
        this.app = appContext;
        this.overlay = document.getElementById('dialogue-overlay');
        this.dialogueBox = document.querySelector('.dialogue-box');
        this.textArea = document.getElementById('dialogue-text');
        this.nameArea = document.getElementById('dialogue-name');
        this.portrait = document.getElementById('dialogue-character-image');
        // Legacy support for 'content' if used elsewhere
        this.els = {
            content: this.textArea,
            name: this.nameArea,
            portrait: this.portrait
        };

        this.scriptQueue = [];
        this.isPlaying = false;
        this.isTyping = false;
        this.currentText = '';

        this.dialogueBox.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            if (this.isTyping) {
                this.completeCurrentLine();
                return;
            }
            this.next();
        });
    }

    play(lines, onComplete) {
        if (!lines || lines.length === 0) {
            if (onComplete) onComplete();
            return;
        }
        this.scriptQueue = [...lines];
        this.onComplete = onComplete;
        this.overlay.classList.add('show');
        this.isPlaying = true;
        this.next();
    }

    next() {
        if (this.scriptQueue.length > 0) {
            const line = this.scriptQueue.shift();
            this.applySpeaker(line);
            this.typeWriter(typeof line === 'string' ? line : line.text || '');
        } else {
            this.finish();
        }
    }

    applySpeaker(line) {
        const fallback = this.app.getCharacterProfile('iris');
        const speakerName = typeof line === 'object' && line?.speaker
            ? line.speaker
            : fallback.name;
        const portraitClass = typeof line === 'object' && line?.portrait
            ? line.portrait
            : fallback.portraitClass;
        const portraitImage = typeof line === 'object' && line?.image
            ? line.image
            : this.app.getCharacterImageForPortrait(portraitClass);

        if (this.nameArea) this.nameArea.textContent = speakerName;
        if (this.portrait) {
            this.portrait.className = portraitClass;
            this.portrait.alt = speakerName;
            this.portrait.src = portraitImage;
        }
    }

    typeWriter(text) {
        if (this.typingInterval) clearInterval(this.typingInterval);
        this.currentText = text;
        this.isTyping = true;
        this.textArea.textContent = '';
        let i = 0;
        this.typingInterval = setInterval(() => {
            this.textArea.textContent += text.charAt(i);
            i++;
            if (i >= text.length) {
                clearInterval(this.typingInterval);
                this.typingInterval = null;
                this.isTyping = false;
            }
        }, 30);
    }

    completeCurrentLine() {
        if (this.typingInterval) clearInterval(this.typingInterval);
        this.typingInterval = null;
        this.isTyping = false;
        if (this.textArea) this.textArea.textContent = this.currentText;
    }

    finish() {
        if (this.typingInterval) clearInterval(this.typingInterval);
        this.typingInterval = null;
        this.isTyping = false;
        this.overlay.classList.remove('show');
        this.isPlaying = false;
        if (this.onComplete) this.onComplete();
    }

    abort() {
        if (this.typingInterval) clearInterval(this.typingInterval);
        this.typingInterval = null;
        this.isTyping = false;
        this.overlay.classList.remove('show');
        this.isPlaying = false;
        this.scriptQueue = [];
    }
}

class QuestManager {
    constructor(appContext) {
        this.app = appContext;
        this.widget = document.getElementById('quest-widget');
        this.descEl = document.getElementById('quest-desc');
        this.claimBtn = document.getElementById('btn-quest-claim');

        this.quests = [
            { id: 'q1', text: '通關 1 次', rule: (data) => data.stats.wins >= 1, reward: 50 },
            { id: 'q2', text: '通關 5 次', rule: (data) => data.stats.wins >= 5, reward: 100 },
            { id: 'q3', text: '消耗 100 點推理力', rule: (data) => data.stats.manaSpent >= 100, reward: 150 },
            { id: 'q4', text: '累積獲得 15 枚評級章', rule: (data) => data.stats.stars >= 15, reward: 200 },
            { id: 'q5', text: '通過第 10 關', rule: (data) => data.highestLevel >= 11, reward: 400 },
            { id: 'q6', text: '解鎖任一稱號', rule: (data) => (data.player?.unlockedTitles?.length || 1) >= 2, reward: 250 },
            { id: 'q7', text: '通過第 30 關', rule: (data) => data.highestLevel >= 31, reward: 1000 },
            { id: 'q_max', text: '所有考核皆已通過', rule: () => false, reward: 0 }
        ];

        this.claimBtn.addEventListener('click', (e) => {
            if (!this.claimBtn.classList.contains('disabled')) {
                const rect = e.target.getBoundingClientRect();
                this.app.particles.createExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, 30);
                this.claimCurrent();
            }
        });
    }

    getCurrentQuest() {
        const id = this.app.data.activeQuestId;
        return this.quests.find(q => q.id === id) || this.quests[this.quests.length - 1];
    }

    check() {
        const q = this.getCurrentQuest();
        if (q.id === 'q_max') {
            this.widget.classList.remove('show');
            return;
        }

        this.descEl.textContent = `${q.text} (獎勵: ${q.reward})`;
        if (q.rule(this.app.data)) {
            this.widget.classList.add('show');
            this.claimBtn.classList.remove('disabled');
            this.claimBtn.textContent = '領取';
        } else {
            this.widget.classList.add('show');
            this.claimBtn.classList.add('disabled');
            this.claimBtn.textContent = '進行中';
        }
    }

    claimCurrent() {
        const q = this.getCurrentQuest();
        if (q.rule(this.app.data)) {
            if (window.audio) window.audio.playLoot ? window.audio.playLoot() : window.audio.playSuccess();
            this.app.data.coins += q.reward;
            this.app.showMessage(`考核達成！獲得 ${q.reward} 英鎊`);

            const idx = this.quests.findIndex(x => x.id === q.id);
            if (idx < this.quests.length - 1) {
                this.app.data.activeQuestId = this.quests[idx + 1].id;
            }
            this.app.saveData();
            this.check();
        }
    }
}


class DetectiveMysteryGame {
    constructor() {
        this.sessionStarted = false;
        this.pendingEndlessContinue = null;
        this.nextHubPanel = 'home';
        // Essential DOM setup
        this.els = {
            appContainer: document.getElementById('app-container'),
            bootOverlay: document.getElementById('boot-overlay'),
            bootLoader: document.getElementById('boot-loader'),
            bootStatus: document.getElementById('boot-status'),
            authCard: document.getElementById('auth-card'),
            homeSaveNote: document.getElementById('home-save-note'),
            greetingOverlay: document.getElementById('greeting-overlay'),
            greetingImage: document.getElementById('greeting-image'),
            greetingName: document.getElementById('greeting-name'),
            greetingText: document.getElementById('greeting-text'),
            views: document.querySelectorAll('.view-section'),
            viewGame: document.getElementById('view-game'),
            globalHeader: document.getElementById('global-header'),
            headerTitle: document.getElementById('header-title'),
            globalCoins: document.getElementById('global-coins'),
            btnGlobalBack: document.getElementById('btn-global-back'),
            saveToast: document.getElementById('save-toast'),
            hubTip: document.getElementById('hub-stamina-tip'),
            hubTipText: document.getElementById('hub-tip-text'),
            btnHubTipShop: document.getElementById('btn-hub-tip-shop'),
            btnGuestStart: document.getElementById('btn-guest-start'),
            btnHubHome: document.getElementById('btn-hub-home'),
            btnDailyStart: document.getElementById('btn-daily-start'),
            btnEndlessStart: document.getElementById('btn-endless-start'),
            hubPanels: Array.from(document.querySelectorAll('.hub-panel')),
            hubBottomNav: document.getElementById('hub-bottom-nav'),
            storyProgressBadge: document.getElementById('story-progress-badge'),
            storyNextTitle: document.getElementById('story-next-title'),
            storyNextDesc: document.getElementById('story-next-desc'),
            homeStoryCopy: document.getElementById('home-story-copy'),
            dailyTitle: document.getElementById('daily-title'),
            dailyDesc: document.getElementById('daily-desc'),
            dailyRuleLabel: document.getElementById('daily-rule-label'),
            dailyRewardStatus: document.getElementById('daily-reward-status'),
            weeklyCalendar: document.getElementById('weekly-calendar'),
            weeklyProgressText: document.getElementById('weekly-progress-text'),
            weeklyRewardText: document.getElementById('weekly-reward-text'),
            inventoryGrid: document.getElementById('inventory-grid'),
            btnToggleAudio: document.getElementById('btn-toggle-audio'),
            levelGrid: document.getElementById('level-grid'),
            btnMapShop: document.getElementById('btn-map-shop'),
            btnMapDaily: document.getElementById('btn-map-daily'),
            shopItems: document.getElementById('shop-items'),
            gameTitle: document.getElementById('game-title'),
            gameDesc: document.getElementById('game-desc'),
            manaVal: document.getElementById('mana-val'),
            manaFill: document.getElementById('mana-fill'),
            topPlayerThumb: document.getElementById('top-player-thumb'),
            history: document.getElementById('history-display'),
            slots: Array.from(document.querySelectorAll('.slot')),
            palette: document.getElementById('palette-container'),
            paletteContainer: document.getElementById('palette-container'),
            btnSubmit: document.getElementById('btn-submit'),
            btnHint: document.getElementById('btn-hint'),
            msg: document.getElementById('game-message'),
            modal: document.getElementById('result-modal'),
            resultPanel: document.getElementById('result-panel'),
            modalTopline: document.getElementById('modal-topline'),
            modalTitle: document.getElementById('modal-title'),
            modalDesc: document.getElementById('modal-desc'),
            modalStory: document.getElementById('modal-story'),
            modalStars: document.getElementById('modal-stars'),
            modalStats: document.getElementById('modal-stats'),
            modalCoinReward: document.getElementById('modal-coin-reward'),
            modalNext: document.getElementById('modal-next'),
            btnModalAction: document.getElementById('btn-modal-action'),
            btnQuit: document.getElementById('btn-quit-game'),
            gameHeader: document.querySelector('.game-header'),
            leaderboardBox: document.getElementById('leaderboard-box'),
            hubTaskText: document.getElementById('hub-task-text'),
            heroGuideMeta: document.getElementById('hero-guide-meta'),
            storyProgressText: document.getElementById('story-progress-text'),
            dailyStatusText: document.getElementById('daily-status-text'),
            btnHeroInteract: document.getElementById('btn-hero-interact'),
            heroBubble: document.getElementById('hero-bubble'),
            hubHeroImage: document.getElementById('hub-hero-image'),
            globalStamina: document.getElementById('global-stamina'),
            confirmModal: document.getElementById('confirm-modal'),
            confirmTitle: document.getElementById('confirm-title'),
            confirmDesc: document.getElementById('confirm-desc'),
            btnConfirmCancel: document.getElementById('btn-confirm-cancel'),
            btnConfirmOk: document.getElementById('btn-confirm-ok'),
            characterModal: document.getElementById('character-modal'),
            characterModalDesc: document.getElementById('character-modal-desc'),
            btnCharacterClose: document.getElementById('btn-character-close'),
            monsterModal: document.getElementById('monster-modal'),
            monsterModalTitle: document.getElementById('monster-modal-title'),
            monsterModalDesc: document.getElementById('monster-modal-desc'),
            btnMonsterClose: document.getElementById('btn-monster-close'),
            monsterDropModal: document.getElementById('monster-drop-modal'),
            monsterDropTitle: document.getElementById('monster-drop-title'),
            monsterDropImage: document.getElementById('monster-drop-image'),
            monsterDropDesc: document.getElementById('monster-drop-desc'),
            btnMonsterDropAction: document.getElementById('btn-monster-drop-action'),
            btnMonsterDropClose: document.getElementById('btn-monster-drop-close'),
            missionModal: document.getElementById('mission-modal'),
            missionModalTopline: document.getElementById('mission-modal-topline'),
            missionModalTitle: document.getElementById('mission-modal-title'),
            missionModalImage: document.getElementById('mission-modal-image'),
            missionModalDesc: document.getElementById('mission-modal-desc'),
            missionModalMeta: document.getElementById('mission-modal-meta'),
            missionModalExtra: document.getElementById('mission-modal-extra'),
            btnMissionBack: document.getElementById('btn-mission-back'),
            btnMissionStart: document.getElementById('btn-mission-start'),
            storyPaperModal: document.getElementById('story-paper-modal'),
            storyPaperTopline: document.getElementById('story-paper-topline'),
            storyPaperTitle: document.getElementById('story-paper-title'),
            storyPaperBody: document.getElementById('story-paper-body'),
            btnStoryPaperContinue: document.getElementById('btn-story-paper-continue'),
            titleModal: document.getElementById('title-modal'),
            titleModalDesc: document.getElementById('title-modal-desc'),
            btnTitleClose: document.getElementById('btn-title-close'),
            settingsCloudTitle: document.getElementById('settings-cloud-title'),
            settingsCloudCopy: document.getElementById('settings-cloud-copy'),
            btnCloudSync: document.getElementById('btn-cloud-sync'),
            btnDeleteData: document.getElementById('btn-delete-data'),
            settingsAuthCard: document.getElementById('settings-auth-card'),
            inputConsole: document.getElementById('input-console'),
            slotsContainer: document.getElementById('slots-container'),
            questWidget: document.getElementById('quest-widget'),
            combatStage: document.getElementById('combat-stage'),
            gamePlayerImage: document.getElementById('game-player-image'),
            gamePlayerName: document.getElementById('game-player-name'),
            gamePlayerTitle: document.getElementById('game-player-title'),
            combatModeTag: document.getElementById('combat-mode-tag'),
            combatTimer: document.getElementById('combat-timer'),
            combatTimerLabelText: document.getElementById('combat-timer-label-text'),
            combatTimerValue: document.getElementById('combat-timer-value'),
            combatTimerFill: document.getElementById('combat-timer-fill'),
            combatHp: document.getElementById('combat-hp'),
            combatHpValue: document.getElementById('combat-hp-value'),
            combatHpFill: document.getElementById('combat-hp-fill'),
            combatManaFill: document.getElementById('combat-mana-fill'),
            combatManaValue: document.getElementById('combat-mana-value'),
            combatEnemy: document.getElementById('combat-enemy'),
            combatEnemyImage: document.getElementById('combat-enemy-image'),
            combatEnemyName: document.getElementById('combat-enemy-name'),
            combatEnemyCount: document.getElementById('combat-enemy-count')
        };

        // Greeting quotes for each character (used in boot greeting)
        this.greetingQuotes = {
            iris: [
                '早安！今天的案件檔案已經整理好了，準備開工吧。',
                '歡迎回來！我整理好了待調查的案件清單。',
                '推理力充沛！今天要挑戰新的案件嗎？',
                '倫敦的霧氣很適合思考。'
            ],
            mentor: [
                '你來了。今天的案件難度有所提升，做好準備。',
                '別急著下結論，先觀察線索的排列規律。',
                '嚴謹比速度更重要，這是偵探的基礎。'
            ],
            scout: [
                '蘇格蘭場剛送來新情報，今天的案件很有趣。',
                '嗨！倫敦最近很平靜，正好多練練推理。',
                '我在周圍偵查了一圈，今天應該能順利。'
            ],
            broker: [
                '道具剛補貨完畢，要不要先看看有沒有需要的？',
                '今天有個不錯的交易機會，別錯過了。',
                '歡迎來到事務所！我這裡什麼都有。'
            ],
            rival: [
                '喲，又來了。今天打算破幾個案？',
                '希望你的表現能讓我提起興趣。',
                '別讓我等太久，見習偵探。'
            ],
            client: [
                '太好了你來了！我有個急案要拜託。',
                '今天的案件難度可不低哦。',
                '期待你的推理！上次的結果非常精彩。'
            ]
        };

        this.symbols = [
            { id: '1', label: '1', name: '1' },
            { id: '2', label: '2', name: '2' },
            { id: '3', label: '3', name: '3' },
            { id: '4', label: '4', name: '4' },
            { id: '5', label: '5', name: '5' },
            { id: '6', label: '6', name: '6' },
            { id: '7', label: '7', name: '7' },
            { id: '8', label: '8', name: '8' },
            { id: '9', label: '9', name: '9' }
        ];

        this.storyVolumeData = window.STORY_VOLUME_DATA || null;
        this.levels = this.generateCasebookLevels();
        this.applyStoryVolumeOverrides();
        this.characters = this.getCharacterRoster();

        // ALWAYS USE V4 to prevent crashes from old save data missing objects.
        this.storageKey = 'detective_mystery_save_v1';

        // Auto-clear all old save versions to prevent stale data conflicts
        Object.keys(localStorage)
            .filter(k => k.startsWith('detective_mystery_') && k !== this.storageKey)
            .forEach(k => localStorage.removeItem(k));

        this.data = this.loadData();
        // Always land on the front door after a reload so the start/login actions remain visible.
        this.sessionStarted = false;

        this.viewState = 'hub';
        this.previousView = 'hub';
        this.gameMode = null;
        this.currentLevel = 1;
        this.gameState = {};
        this.lastHighestLevel = this.data.highestLevel;
        this.pendingConfirmAction = null;
        this.pendingConfirmCancelAction = null;
        this.currentUser = null;
        this.activeHubPanel = 'home';
        this.bootFinished = false;
        this.bootTimers = [];
        this.combatTimerId = null;
        this.dailyChallenge = this.generateDailyChallenge();
        this.auditPuzzleCatalog();
        this.currentHubGreeter = 'iris';
        this._hubGreetingSeed = '';
        this.storyArchiveState = { openArcs: new Set(), selectedHistoryArc: null };
        this.currentCaseTab = 'current';
        this.currentInvTab = 'character';
        this.inventorySubtab = 'character';
        this.pendingGameStart = null;
        this.activeMonsterModalId = '';

        this.particles = new ParticleEngine();
        this.dialogue = new DialogueManager(this);
        this.quests = new QuestManager(this);

        this.setupCheats();
        this.init();
    }

    getStoryArcCatalog() {
        return [
            {
                key: 'ash_letter',
                actLabel: '起',
                title: '第一卷｜灰印來函',
                summary: '一封蓋著灰燼封蠟的匿名信，把貝克街的零散委託串成同一條線。',
                antagonist: '灰印會',
                chapters: [
                    {
                        key: 'baker_street',
                        title: '貝克街事件簿',
                        slotCount: 3,
                        locale: '貝克街',
                        clientPortrait: 'portrait-iris',
                        clients: ['威廉斯', '瑪麗', '老湯姆', '愛瑪', '莉莉'],
                        caseTitles: ['失蹤的懷錶', '消失的信件', '神秘腳印', '被偷的蛋糕', '花店威脅信', '迷路的貓咪', '假鈔疑雲', '深夜尖叫', '畫廊竊案', '貝克街考驗'],
                        modes: ['1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b']
                    },
                    {
                        key: 'thames',
                        title: '泰晤士回聲',
                        slotCount: 4,
                        locale: '泰晤士碼頭',
                        clientPortrait: 'portrait-scout',
                        clients: ['亨利', '理查德', '格雷', '伊恩', '奧利佛'],
                        caseTitles: ['碼頭走私案', '船長遺囑', '河上浮屍', '倉庫大火', '黑市古董', '渡輪威脅', '失蹤漁夫', '水下密室', '河畔毒殺', '河運總結案'],
                        modes: ['1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b']
                    }
                ]
            },
            {
                key: 'whitechapel_choir',
                actLabel: '承',
                title: '第二卷｜白教堂聖詠',
                summary: '白教堂區的連環案件顯示灰印會正在滲透蘇格蘭場。',
                antagonist: '白教堂合唱團',
                chapters: [
                    {
                        key: 'whitechapel',
                        title: '白教堂暗影',
                        slotCount: 4,
                        locale: '白教堂市場',
                        clientPortrait: 'portrait-scout',
                        clients: ['安妮', '傑克', '艾倫', '瑪莎', '約翰'],
                        caseTitles: ['暗巷襲擊', '地下賭場', '假藥販賣', '失蹤孤兒', '神秘教派', '連環縱火', '珠寶失竊', '瘟疫恐慌', '地下通道', '白教堂總結案'],
                        modes: ['1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', 'sudoku']
                    },
                    {
                        key: 'scotland_yard',
                        title: '蘇格蘭場密檔',
                        slotCount: 4,
                        locale: '警署檔案室',
                        clientPortrait: 'portrait-mentor',
                        clients: ['探長', '羅賓', '蘇珊', '哈洛德', '艾琳'],
                        caseTitles: ['間諜密函', '證人保護', '失蹤證物', '偽造身份', '雙面間諜', '密室殺人', '連環失蹤', '黑函勒索', '內鬼調查', '密檔總結案'],
                        modes: ['1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', 'sudoku']
                    }
                ]
            },
            {
                key: 'academy_engine',
                actLabel: '轉',
                title: '第三卷｜機關學會之眼',
                summary: '學院技術外流，顯示灰印會正在打造機關母體。',
                antagonist: '機關學會',
                chapters: [
                    {
                        key: 'royal_academy',
                        title: '皇家學院懸案',
                        slotCount: 4,
                        locale: '皇家學院',
                        clientPortrait: 'portrait-mentor',
                        clients: ['院長', '海斯', '溫蒂', '莉安', '克萊夫'],
                        caseTitles: ['教授秘密', '被竄改論文', '實驗室爆炸', '圖書館暗號', '失蹤獎章', '學生會陰謀', '校友復仇', '實驗室竊案', '詛咒畫像', '學院總結案'],
                        modes: ['1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', 'pipe']
                    },
                    {
                        key: 'east_end',
                        title: '東區走私網',
                        slotCount: 5,
                        locale: '東區碼頭',
                        clientPortrait: 'portrait-broker',
                        clients: ['傑克', '伊萊', '娜塔莉', '丹恩', '弗林'],
                        caseTitles: ['碼頭暗號', '地下交易', '假鑽石案', '走私路線', '雙面線人', '毒品工廠', '保護費風波', '幽靈貨船', '走私王陷阱', '東區總結案'],
                        modes: ['1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', 'pipe']
                    }
                ]
            },
            {
                key: 'crown_underpass',
                actLabel: '合',
                title: '第四卷｜王冠下的密道',
                summary: '議會與地鐵的案件揭露了真正的目標。',
                antagonist: '王冠密道網',
                chapters: [
                    {
                        key: 'parliament',
                        title: '議會陰謀錄',
                        slotCount: 5,
                        locale: '議會大廈',
                        clientPortrait: 'portrait-broker',
                        clients: ['查爾斯', '艾琳', '米勒', '佛瑞德', '潔西卡'],
                        caseTitles: ['議員秘密', '選票操控', '政治暗殺', '外交密件', '間諜網路', '權力交易', '議會炸彈案', '內閣洩密', '首相危機', '議會總結案'],
                        modes: ['1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', 'klotski']
                    },
                    {
                        key: 'underground',
                        title: '地下鐵道之謎',
                        slotCount: 5,
                        locale: '地下隧道',
                        clientPortrait: 'portrait-scout',
                        clients: ['哈維', '蘿絲', '約拿', '巴奈特', '妮娜'],
                        caseTitles: ['幽靈列車', '勞工失蹤', '地底實驗室', '鑽地獸', '灰燼站', '數位浮游', '機械鎧甲', '地底總圖', '時間囊', '地底總結案'],
                        modes: ['1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', 'klotski']
                    }
                ]
            },
            {
                key: 'final_reckoning',
                actLabel: '結',
                title: '第五卷｜終局瀑聲',
                summary: '莫里亞蒂的終極佈局，倫敦的命運懸於一線。',
                finale: '最終密碼既是關閉灰印會的鑰匙，也是莫里亞蒂留給夏洛特的邀請函：要麼結束整場布局，要麼成為唯一能看懂它的人。',
                antagonist: '莫里亞蒂',
                chapters: [
                    {
                        key: 'royal_treasure',
                        title: '王室寶藏失蹤案',
                        slotCount: 5,
                        locale: '王室金庫',
                        clientPortrait: 'portrait-client',
                        clients: ['伊凡', '瑪莉安', '奧托', '賽門', '芙蘿拉'],
                        caseTitles: ['皇冠失竊', '金脈圖', '守衛背叛', '石柱機關', '預測表', '數字詛咒', '真假邊界', '法律抹除', '數位階梯', '王室總結案'],
                        modes: ['1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', 'bubble']
                    },
                    {
                        key: 'moriarty',
                        title: '莫里亞蒂最後挑戰',
                        slotCount: 5,
                        locale: '倫敦高塔',
                        clientPortrait: 'portrait-rival',
                        clients: ['莫里亞蒂', '代理人', '傳令', '信差', '見證人'],
                        caseTitles: ['灰印天幕', '地標炸彈', '鏡像自我', '倫敦方程式', '數位瀑布', '反轉倫敦', '意識上傳', '生死棋盤', '灰印病毒', '名偵探的榮耀'],
                        modes: ['1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', 'bubble']
                    }
                ]
            }
        ];
    }

    getStoryVolumeLevel(levelId) {
        return this.storyVolumeData?.levels?.[String(levelId)] || null;
    }

    buildNarrativeRequest(override, fallbackRequest) {
        if (override?.quickSummary) return override.quickSummary;
        return fallbackRequest || '請進入卷宗查看詳細案件委託。';
    }

    applyStoryVolumeOverrides() {
        const source = this.storyVolumeData;
        if (!source?.levels) return;

        const actLabels = ['起', '承', '轉', '合', '終'];
        const volumeIndexMap = new Map(
            (source.volumes || []).map((volume, index) => [volume.title, index])
        );

        this.levels = this.levels.map((level) => {
            const override = this.getStoryVolumeLevel(level.id);
            if (!override) return level;

            const volumeIndex = volumeIndexMap.get(override.volumeTitle) ?? level.storyArcIndex ?? 0;
            const slotCount = override.slotCountHint || level.slotCount;
            const chapterIntro = override.narrativeParagraphs?.[0] || level.chapterIntro;
            const chapterSummary = override.endingHook || level.chapterSummary;
            const request = this.buildNarrativeRequest(override, level.request);
            const failText = override.quickSummary
                ? `案件「${override.title || level.title}」暫時失手。${override.quickSummary}`
                : `案件「${override.title || level.title}」暫時失手，線索還沒完全接回來。`;

            return this.normalizePuzzleDefinition({
                ...level,
                title: override.title || level.title,
                name: `案件 #${String(level.id).padStart(2, '0')}：${override.title || level.title}`,
                chapter: override.chapterTitle || level.chapter,
                storyArcTitle: override.volumeTitle || level.storyArcTitle,
                storyArcSummary: override.volumeCorePlot || level.storyArcSummary,
                storyArcIntro: override.volumeCorePlot || level.storyArcIntro,
                storyArcIndex: volumeIndex,
                storyArcAct: actLabels[volumeIndex] || level.storyArcAct,
                chapterIntro,
                chapterSummary,
                client: override.client || level.client,
                clientPortrait: override.clientPortrait || level.clientPortrait,
                request,
                intro: override.quickSummary || override.narrativeParagraphs?.[0] || level.intro,
                perfect: override.endingHook || level.perfect,
                good: override.endingHook || level.good,
                rough: override.endingHook || level.rough,
                fail: failText,
                slotCount,
                rule: override.rule || level.rule,
                ruleLabel: override.ruleLabel || level.ruleLabel,
                gameplayDetail: override.gameplayDetail || level.gameplayDetail,
                storyClue: override.gameplayDetail || level.storyClue,
                storyNarrative: override.narrative || '',
                storyNarrativeParagraphs: override.narrativeParagraphs || [],
                storyOpeningDialogue: override.openingDialogue || [],
                storyEndingHook: override.endingHook || '',
                volumePrimaryModes: override.volumePrimaryModes || '',
                quickSummary: override.quickSummary || ''
            });

            // 如果原本沒有 stages，且 rule 不是 1a2b，則自動建立兩個階段 (開胃菜 + 主菜)
            if (override.stages) {
                finalLevel.stages = override.stages;
            } else if (finalLevel.rule && finalLevel.rule !== '1a2b') {
                const appetizerRule = finalLevel.rule;
                finalLevel.stages = [
                    {
                        id: `${level.id}-appetizer`,
                        rule: appetizerRule,
                        slotCount: finalLevel.slotCount,
                        title: `${finalLevel.title}：前奏`,
                        closingDialogue: [
                            { speaker: '夏洛特', text: '這只是開胃菜...真正的難題還在後頭。', portrait: 'portrait-iris' }
                        ]
                    },
                    {
                        id: `${level.id}-main`,
                        rule: '1a2b',
                        slotCount: finalLevel.slotCount,
                        title: `${finalLevel.title}：核心碼`,
                        openingDialogue: [
                            { speaker: '你', text: '現在，讓我們解開真正的密碼。', portrait: 'portrait-client' }
                        ]
                    }
                ];
            }
            return finalLevel;
        });
    }

    getChapterNarrativeMeta(chapterKey) {
        const meta = {
            baker_street: {
                intro: '貝克街的第一批委託看似只是失物、郵件與街坊怪事，但每一案都在測試街區多久會發現異常。',
                summary: '十件小案最後指向同一個灰燼封蠟。貝克街不是偶然出事，而是被人當成第一座測試場。'
            },
            thames: {
                intro: '泰晤士碼頭把線索推向河運。貨物、船班、倉庫與遺囑都像被同一套暗碼重新排序。',
                summary: '河運線與貝克街共用同一批暗號，灰印會已能把街區犯罪擴大成跨區同步行動。'
            },
            whitechapel: {
                intro: '白教堂的案件不只傷人，還刻意放大恐慌。敵人把群眾反應當成可計算的資料。',
                summary: '白教堂像被布置成實驗場，灰印會正在學會操縱街區情緒與目擊證詞。'
            },
            scotland_yard: {
                intro: '蘇格蘭場的密檔開始失真。有人不只是犯罪，還在改寫追查犯罪的制度。',
                summary: '問題不是單一內鬼，而是一條長期經營的情報抽取鏈，案卷流向早已被提前掌握。'
            },
            royal_academy: {
                intro: '皇家學院把真相推向技術來源。研究、論文與實驗裝置都留下灰印會採購的痕跡。',
                summary: '敵人正在把推理規則機械化、標準化，準備把犯罪模組大量複製出去。'
            },
            east_end: {
                intro: '東區黑市讓學院外流技術落地。碼頭、工坊與線人把知識變成真正的犯罪產業。',
                summary: '灰印會已不只是秘密社團，而是一條能批量生產機關與暗碼裝置的犯罪鏈。'
            },
            parliament: {
                intro: '議會案件把威脅推上國家中樞。敵人不只要偷文件，而是要改寫決策節奏。',
                summary: '政策、選票與外交資訊被放進同一個操縱模型，灰印會想奪走城市的決定權。'
            },
            underground: {
                intro: '地下鐵道把物流、避難線與城市生命線全部綁在一起。每一條隧道都可能是陷阱。',
                summary: '灰印會正在奪取地下運輸與避難路線，倫敦的表面秩序開始從地底鬆動。'
            },
            royal_treasure: {
                intro: '王室金庫案件看似是寶藏失竊，實際上是在測試法律、身份與保管制度的邊界。',
                summary: '王室寶藏只是外殼，真正被偷走的是城市相信秩序仍然有效的理由。'
            },
            moriarty: {
                intro: '莫里亞蒂不再躲在幕後。他把全城案件整理成最後一套方程式，等主角親手解開。',
                summary: '最後的密碼不是單一答案，而是主角是否能拒絕被操縱、並關閉整座城市級布局。'
            }
        };
        return meta[chapterKey] || {
            intro: '新的卷宗被送進事務所，線索表面分散，背後卻有同一種排列痕跡。',
            summary: '本章案件逐步收束，讓主角更接近灰印會真正的運作方式。'
        };
    }

    getGameplayDesignCopy(rule, slotCount) {
        const copies = {
            '1a2b': `玩法：輸入 ${slotCount} 位不重複數字。A 代表數字與位置都正確，B 代表數字正確但位置錯誤。每一次提交都會留下紀錄，用來縮小答案範圍。`,
            sudoku: '玩法設計：以數獨式交叉比對作為章末演出，重點是從多組證詞中排除衝突。目前會先用密碼推理盤承接，避免未完成玩法阻斷主線。',
            pipe: '玩法設計：以接水管式路徑修復作為工坊核心演出，重點是接通被切斷的動力與證據流。目前會先用密碼推理盤承接，保持關卡可通關。',
            klotski: '玩法設計：以華容道式空間移動作為地下鐵逃生演出，重點是調整障礙與出口順序。目前會先用密碼推理盤承接，保持關卡可通關。',
            bubble: '玩法設計：以氣泡排序作為終局證據排序演出，重點是把時間軸與證據逐步歸位。目前會先用密碼推理盤承接，保持關卡可通關。'
        };
        return copies[rule] || copies['1a2b'];
    }

    getRuleDisplayLabel(rule, slotCount) {
        const labels = {
            '1a2b': `${slotCount} 位數密碼`,
            sudoku: '數獨式證詞比對',
            pipe: '接水管式機關導流',
            klotski: '華容道式路線調整',
            bubble: '氣泡排序式證據歸位'
        };
        return labels[rule] || `${slotCount} 位數密碼`;
    }

    generateCasebookLevels() {
        const arcs = this.getStoryArcCatalog();
        const levels = [];
        let id = 1;

        arcs.forEach((arc, arcIndex) => {
            let storyArcOrder = 0;
            const arcCaseTotal = arc.chapters.reduce((sum, chapter) => sum + chapter.caseTitles.length, 0);

            arc.chapters.forEach((chapter, chapterIndexInArc) => {
                const chapterMeta = this.getChapterNarrativeMeta(chapter.key);
                const chapterIntro = chapter.chapterIntro || chapterMeta.intro;
                const chapterSummary = chapter.chapterSummary || chapterMeta.summary;
                chapter.caseTitles.forEach((caseTitle, caseIndex) => {
                    storyArcOrder += 1;
                    const client = chapter.clients[caseIndex % chapter.clients.length];
                    const chapterIndex = arcIndex * 2 + chapterIndexInArc;
                    const isChapterOpener = caseIndex === 0;
                    const isChapterFinale = caseIndex === chapter.caseTitles.length - 1;
                    const isArcFinale = storyArcOrder === arcCaseTotal;
                    const timeLimit = (caseIndex % 3 === 2 || isChapterFinale)
                        ? Math.max(16, 34 - chapter.slotCount * 2 - arcIndex * 2 - Math.floor(caseIndex / 3))
                        : 0;

                    const requestTarget = isChapterFinale
                        ? `${chapter.title} 的總結關鍵`
                        : `「${caseTitle}」的核心證據`;

                    const intro = isChapterOpener
                        ? `${chapterIntro} 第一份卷宗是「${caseTitle}」。`
                        : `卷宗編號 ${id.toString().padStart(2, '0')} 已送達：${caseTitle}。${chapter.locale} 的證據開始朝同一個方向收束。`;

                    const perfect = isArcFinale
                        ? `最終卷宗被你完整拆開。${arc.finale}`
                        : isChapterFinale
                            ? `你把 ${chapter.title} 的最後一道鎖打開了。${chapterSummary}`
                            : `「${caseTitle}」被乾淨俐落地偵破，新的證據立刻把調查往 ${arc.antagonist} 身上推進。`;

                    const good = isChapterFinale
                        ? `${chapter.title} 暫時畫下句點，雖然還有些邊角得回頭補查。`
                        : `「${caseTitle}」順利結案，事務所把新證物編入主卷宗。`;

                    const rough = `案件總算被壓住，但你能感覺到「${caseTitle}」背後還留著沒有完全清乾淨的痕跡。`;
                    const fail = `線索在 ${chapter.locale} 斷掉了。「${caseTitle}」沒有順利結案，對方也因此多拿到一些喘息時間。`;

                    const rule = chapter.modes ? chapter.modes[caseIndex] : '1a2b';
                    const gameplayDetail = this.getGameplayDesignCopy(rule, chapter.slotCount);
                    levels.push(this.normalizePuzzleDefinition({
                        id,
                        title: caseTitle,
                        name: `案件 #${id.toString().padStart(2, '0')}：${caseTitle}`,
                        chapter: chapter.title,
                        chapterKey: chapter.key,
                        chapterIndex,
                        chapterOrder: caseIndex + 1,
                        chapterIntro,
                        chapterSummary,
                        chapterLocale: chapter.locale,
                        storyArcKey: arc.key,
                        storyArcTitle: arc.title,
                        storyArcIndex: arcIndex,
                        storyArcIntro: arc.summary,
                        storyArcSummary: arc.summary,
                        storyArcFinale: arc.finale || `${arc.title} 暫時收束，但灰印會留下的暗碼還沒有真正結束。`,
                        storyArcOrder,
                        storyArcCaseTotal: arcCaseTotal,
                        client,
                        clientPortrait: chapter.clientPortrait,
                        requestTarget,
                        request: `破解 ${chapter.slotCount} 位數密碼鎖，從 ${chapter.locale} 的案件中鎖定核心證據。`,
                        intro,
                        perfect,
                        good,
                        rough,
                        fail,
                        slotCount: chapter.slotCount,
                        rule,
                        ruleLabel: this.getRuleDisplayLabel(rule, chapter.slotCount),
                        gameplayDetail,
                        storyClue: gameplayDetail,
                        mentor: '',
                        timeLimit
                    }));
                    id += 1;
                });
            });
        });

        return levels;
    }


    getAdvancedStoryOrderTitles(prefix = '倫敦') {
        return [
            `${prefix}封鎖列印`,
            `${prefix}巡燈導流`,
            `${prefix}倉印校正`,
            `${prefix}回聲封條`,
            `${prefix}脈衝護欄`,
            `${prefix}夜航節拍`,
            `${prefix}抑霧封箱`,
            `${prefix}觀測回環`,
            `${prefix}補給轉譜`,
            `${prefix}總驗存檔`
        ];
    }

    getAdvancedStoryTemplates(slotCount = 6) {
        const templates = [
            { rule: 'three-types', ruleLabel: '三材編列', storyHint: () => '全密碼只會使用 3 種數字，而且這 3 種都一定會出現。', request: '這批調配只能留下三種明確訊號，避免現場誤判。' },
            { rule: 'weighted', ruleLabel: '主核重壓', storyHint: (count) => `會有 1 種數字明顯主導整體，至少會佔到 ${Math.floor(count / 2) + 1} 格。`, request: '案件要求先鎖定一個主導訊號，把整份密碼壓穩。' },
            { rule: 'no-adjacent', ruleLabel: '避鄰抗擾', storyHint: () => '任何相鄰兩格都不會出現相同數字。', request: '相鄰反應不能互撞，整體節奏要乾淨分開。' },
            { rule: 'alternating', ruleLabel: '交錯節拍', storyHint: () => '只會出現 2 種數字，並且會固定交錯排列。', request: '這份密碼要有穩定拍點，讓後續流程能直接跟上。' },
            { rule: 'palindrome', ruleLabel: '鏡面回文', storyHint: () => '整體會以前後鏡像的方式排列。', request: '前後結構必須完全對映，否則校準值會整段偏掉。' },
            { rule: 'split-pairs', ruleLabel: '雙對拆列', storyHint: (count) => `會形成 2 組成對數字，外加 ${count - 4} 個單點數字。`, request: '要先把成對訊號架起來，再留單點去做尾段修正。' },
            { rule: 'triplet', ruleLabel: '三重主核', storyHint: () => '其中 1 種數字會剛好出現 3 次，其餘數字各 1 次。', request: '這批需要三重主核去穩住主反應，其他位置只做陪襯。' }
        ];

        if (slotCount === 6) {
            templates.push(
                { rule: 'twin-pairs', ruleLabel: '三對列陣', storyHint: () => '整體會形成 3 組成對數字。', request: '案件要把整批訊號拆成三組對位，方便前線快速辨識。' },
                { rule: 'spectrum', ruleLabel: '全譜護壁', storyHint: () => '五種數字都會出現，並且其中 1 種會再重複 1 次。', request: '這次需要完整覆蓋所有訊號，再額外補上一層強化核。' },
                { rule: 'crown', ruleLabel: '冠式重心', storyHint: () => '第 1、6 格相同，第 2、5 格相同，整體會形成明確重心。', request: '整體結構必須鎖出明確重心，首尾不能有任何漂移。' },
                { rule: 'bookend', ruleLabel: '封環首尾', storyHint: () => '第 1 格與最後 1 格必定相同，中間每格都要和首尾不同。', request: '這批封環液要求首尾完全呼應，中段則必須各自獨立。' }
            );
            return templates;
        }

        return templates.concat([
            { rule: 'bookend-pair', ruleLabel: '首尾雙鎖', storyHint: () => '首尾會相同，另外還會有 1 種數字剛好成對出現 2 次。', request: '案件要先鎖住首尾，再用一組成對數字把中段壓穩。' },
            { rule: 'spectrum-plus', ruleLabel: '全譜雙補', storyHint: () => '五種數字都會出現，並且其中 2 種會各再多出現 1 次。', request: '這份密碼要先覆蓋全譜，再額外補兩段強化訊號。' }
        ]);
    }

    getGeneratedStoryTimeLimit(levelId, slotCount, orderIndex) {
        const cycleIndex = (levelId - 1) % 10;
        if (![1, 4, 7].includes(cycleIndex)) return 0;
        const chapterDepth = Math.floor((levelId - 31) / 10);
        const base = slotCount >= 7 ? 25 : 30;
        return Math.max(slotCount >= 7 ? 18 : 22, base - chapterDepth * 2 - (orderIndex % 2));
    }

    getCharacterRoster() {
        return {
            iris: {
                id: 'iris',
                name: '夏洛特',
                role: '偵探助手',
                portraitClass: 'portrait-iris',
                image: 'assets/char_alchemist.png',
                summary: '剛從偵探學院被派往倫敦事務所，擅長把混亂的線索整理成可執行的推理。'
            },
            mentor: {
                id: 'mentor',
                name: '華生教授',
                role: '資深偵探',
                portraitClass: 'portrait-mentor',
                image: 'assets/char_mentor.png',
                summary: '負責審核案件分析與升格考核，說話簡短，但每句都指向重點。'
            },
            scout: {
                id: 'scout',
                name: '貝蒂探員',
                role: '蘇格蘭場聯絡人',
                portraitClass: 'portrait-scout',
                image: 'assets/char_scout.png',
                summary: '蘇格蘭場與事務所之間的聯絡人，總把案件與時限一起帶進辦公室。'
            },
            broker: {
                id: 'broker',
                name: '哈德森太太',
                role: '事務所管家',
                portraitClass: 'portrait-broker',
                image: 'assets/char_broker.png',
                summary: '負責事務所營運與道具供應，對報價和效率都異常敏感。'
            },
            rival: {
                id: 'rival',
                name: '莫里亞蒂',
                role: '犯罪顧問',
                portraitClass: 'portrait-rival',
                image: 'assets/char_rival.png',
                summary: '帶著些微笑意，專注於挑戰偵探推理極限的競爭對手。'
            },
            client: {
                id: 'client',
                name: '委託人',
                role: '倫敦市民',
                portraitClass: 'portrait-client',
                image: 'assets/char_client.png',
                summary: '倫敦各界的委託人，對案件的調查品質非常在意。'
            }
        };
    }

    getPlayableCharacters() {
        return [
            {
                id: 'female',
                name: '愛德琳',
                gender: '女生',
                role: '倫敦名偵探',
                stages: [
                    { label: '見習偵探裝', unlockLevel: 1, image: 'assets/chars/female_stage1.png' },
                    { label: '正式偵探裝', unlockLevel: 11, image: 'assets/chars/female_stage2.png' },
                    { label: '皇家偵探裝', unlockLevel: 21, image: 'assets/chars/female_stage3.png' }
                ]
            },
            {
                id: 'male',
                name: '亞瑟',
                gender: '男生',
                role: '皇家偵探',
                stages: [
                    { label: '見習偵探裝', unlockLevel: 1, image: 'assets/chars/male_stage1.png' },
                    { label: '正式偵探裝', unlockLevel: 11, image: 'assets/chars/male_stage2.png' },
                    { label: '皇家偵探裝', unlockLevel: 21, image: 'assets/chars/male_stage3.png' }
                ]
            }
        ];
    }

    getTitleCatalog() {
        return [
            {
                id: 'apprentice',
                name: '見習偵探',
                cost: 0,
                maxLevel: 1,
                desc: '初始稱號，沒有額外加成。',
                levelDesc: () => '初始稱號，沒有額外加成。',
                effects: {},
                levelEffects: () => ({})
            },
            {
                id: 'frontier_focus',
                name: '案件專注者',
                cost: 500,
                maxLevel: 10,
                desc: '故事案件推理力上限 +15。',
                levelDesc: (lv) => `故事案件推理力上限 +${15 + (lv - 1) * 5}。`,
                effects: { storyManaBonus: 15 },
                levelEffects: (lv) => ({ storyManaBonus: 15 + (lv - 1) * 5 })
            },
            {
                id: 'starlight_reader',
                name: '密碼解讀者',
                cost: 500,
                maxLevel: 10,
                desc: '每日推理推理力上限 +20。',
                levelDesc: (lv) => `每日推理推理力上限 +${20 + (lv - 1) * 5}。`,
                effects: { dailyManaBonus: 20 },
                levelEffects: (lv) => ({ dailyManaBonus: 20 + (lv - 1) * 5 })
            },
            {
                id: 'spell_duelist',
                name: '怪獸追跡者',
                cost: 500,
                maxLevel: 10,
                desc: '怪獸追跡得分 +20%，HP +1。',
                levelDesc: (lv) => `怪獸追跡得分 +${20 + (lv - 1) * 5}%，HP +${1 + Math.floor((lv - 1) / 3)}。`,
                effects: { endlessScoreBonus: 0.2, endlessHpBonus: 1 },
                levelEffects: (lv) => ({ endlessScoreBonus: 0.2 + (lv - 1) * 0.05, endlessHpBonus: 1 + Math.floor((lv - 1) / 3) })
            },
            {
                id: 'grand_alchemist',
                name: '皇家偵探',
                cost: 500,
                maxLevel: 10,
                desc: '故事與每日推理力 +10，追跡得分 +10%。',
                levelDesc: (lv) => `故事與每日推理力 +${10 + (lv - 1) * 3}，追跡得分 +${10 + (lv - 1) * 3}%。`,
                effects: { storyManaBonus: 10, dailyManaBonus: 10, endlessScoreBonus: 0.1 },
                levelEffects: (lv) => ({ storyManaBonus: 10 + (lv - 1) * 3, dailyManaBonus: 10 + (lv - 1) * 3, endlessScoreBonus: 0.1 + (lv - 1) * 0.03 })
            }
        ];
    }

    getPlayableCharacter(id = this.data?.player?.selectedCharacter) {
        const roster = this.getPlayableCharacters();
        return roster.find((character) => character.id === id) || roster[0];
    }

    getPlayerStageIndex() {
        if ((this.data?.highestLevel || 1) >= 21) return 2;
        if ((this.data?.highestLevel || 1) >= 11) return 1;
        return 0;
    }

    getPlayerStage(character = this.getPlayableCharacter()) {
        const stageIndex = this.getPlayerStageIndex();
        return character.stages[stageIndex] || character.stages[0];
    }

    getActiveTitle() {
        const catalog = this.getTitleCatalog();
        const title = catalog.find((t) => t.id === this.data?.player?.activeTitle) || catalog[0];
        return title;
    }

    getActiveTitleLevel() {
        return (this.data?.player?.titleLevels?.[this.data?.player?.activeTitle]) || 1;
    }

    getTitleLevel(titleId) {
        return (this.data?.player?.titleLevels?.[titleId]) || 1;
    }

    getTitleUpgradeCost(titleId) {
        const title = this.getTitleCatalog().find(t => t.id === titleId);
        if (!title) return Infinity;
        const currentLevel = this.getTitleLevel(titleId);
        if (currentLevel >= (title.maxLevel || 10)) return Infinity;
        // 500, 1000, 1500, 2000...
        return 500 * currentLevel;
    }

    getModeMaxMana(mode = this.gameMode) {
        const title = this.getActiveTitle();
        const level = this.getActiveTitleLevel();
        const effects = title.levelEffects ? title.levelEffects(level) : (title.effects || {});
        const monsterEffects = this.getActiveMonsterEffects();
        if (mode === 'story') return this.data.maxMana + (effects.storyManaBonus || 0) + (monsterEffects.storyManaBonus || 0);
        if (mode === 'daily') return this.data.maxMana + (effects.dailyManaBonus || 0) + (monsterEffects.dailyManaBonus || 0);
        return this.data.maxMana;
    }

    getEndlessScoreMultiplier() {
        const title = this.getActiveTitle();
        const level = this.getActiveTitleLevel();
        const effects = title.levelEffects ? title.levelEffects(level) : (title.effects || {});
        const monsterEffects = this.getActiveMonsterEffects();
        return 1 + (effects.endlessScoreBonus || 0) + (monsterEffects.endlessScoreBonus || 0);
    }

    getEndlessMaxHp() {
        const title = this.getActiveTitle();
        const level = this.getActiveTitleLevel();
        const effects = title.levelEffects ? title.levelEffects(level) : (title.effects || {});
        const monsterEffects = this.getActiveMonsterEffects();
        return 3 + (effects.endlessHpBonus || 0) + (monsterEffects.endlessHpBonus || 0);
    }

    getEndlessTimeLimit(slotCount = this.gameState.slotCount || 3) {
        return Math.max(10, 23 - slotCount * 2);
    }

    getEnemyRoster() {
        return [
            { id: 'starry_slime', name: '雷鳥', image: 'assets/enemies/starry_slime.png', clue: '空氣中帶有微微的靜電，遠處傳來雷鳴...' },
            { id: 'cinder_fox', name: '火灰蛇', image: 'assets/enemies/cinder_fox.png', clue: '地板上留下了焦黑的痕跡，空氣變得灼熱...' },
            { id: 'leafy_dragon', name: '護樹羅鍋', image: 'assets/enemies/leafy_dragon.png', clue: '樹枝發出細碎的響聲，空氣中帶著草本香氣...' },
            { id: 'moonlight_owl', name: '月癡獸', image: 'assets/enemies/moonlight_owl.png', clue: '地面上有淺淺的圓形腳印，空氣中瀰漫著銀色的微光...' },
            { id: 'solar_sprite', name: '嗅嗅', image: 'assets/enemies/solar_sprite.png', clue: '附近有些閃閃發亮的物品消失了，地上有小巧的爪印...' },
            { id: 'mist_jellyfish', name: '水怪', image: 'assets/enemies/mist_jellyfish.png', clue: '空氣中充滿了潮濕的水氣，地上的積水泛起漣漪...' },
            { id: 'crystal_turtle', name: '毒角獸', image: 'assets/enemies/crystal_turtle.png', clue: '地面傳來沉重的震動感，似乎有龐然大物在附近...' },
            { id: 'shadow_cat', name: '貓豹', image: 'assets/enemies/shadow_cat.png', clue: '林間傳來優雅卻危險的呼吸聲，金色的瞳孔在黑暗中一閃過...' },
            { id: 'clockwork_bird', name: '鳳凰', image: 'assets/enemies/clockwork_bird.png', clue: '空氣中飄落幾根燦爛的羽毛，隱約能聽到神聖的鳴叫...' },
            { id: 'cloud_sheep', name: '隱形獸', image: 'assets/enemies/cloud_sheep.png', clue: '空氣中出現一陣不自然的扭曲，地上的草木被無形的腳步撥動...' },
            { id: 'abyss_moth', name: '深淵星蛾', image: 'assets/enemies/abyss_moth.png', clue: '四周的光線被吸入黑暗中，點點星光在深淵中閃爍...' },
            { id: 'plague_bat', name: '疫鐘蝠', image: 'assets/enemies/plague_bat.png', clue: '遠處傳來刺耳的超音波，似乎有成群的生物在掠過...' },
            { id: 'grave_hound', name: '墓痕獵犬', image: 'assets/enemies/grave_hound.png', clue: '空氣中散發著泥土與陳舊的氣息，地上有深邃的爪痕...' },
            { id: 'teacup_mimic', name: '裂瓷茶妖', image: 'assets/enemies/teacup_mimic.png', clue: '附近傳來瓷器碰撞的清脆聲響，空氣中飄著淡淡的茶香...' },
            { id: 'moonwell_stag', name: '月井鹿靈', image: 'assets/enemies/moonwell_stag.png', clue: '森林深處亮起幽幽的藍光，聖潔的力量在林間湧動...' },
            { id: 'candle_monk', name: '燭芯僧', image: 'assets/enemies/candle_monk.png', clue: '火光在陰影中忽明忽暗，隱約能聽到低沉的誦經聲...' },
            { id: 'mirror_serpent', name: '鏡淵蛇', image: 'assets/enemies/mirror_serpent.png', clue: '四周的景物開始出現鏡面般的重疊與倒影...' },
            { id: 'library_beetle', name: '藏書甲堡', image: 'assets/enemies/library_beetle.png', clue: '空氣中瀰漫著古舊羊皮紙與油墨的乾燥氣息...' },
            { id: 'frost_bell_widow', name: '霜鐘寡蛛', image: 'assets/enemies/frost_bell_widow.png', clue: '清脆的冰晶破碎聲在靜謐中迴盪，空氣寒冷刺骨...' },
            { id: 'velvet_rose_chimera', name: '絨薔獵獸', image: 'assets/enemies/velvet_rose_chimera.png', clue: '空氣中傳來濃郁卻帶有鐵鏽味的玫瑰花香...' }
        ];
    }

    getEnemyForOrder(orderCount = 1) {
        // In endless mode, all 8 rounds track the SAME monster.
        // Pick one randomly when the run starts (stored in gameState.sessionEnemy).
        if (this.gameState?.sessionEnemy) return this.gameState.sessionEnemy;
        const roster = this.getEnemyRoster();
        return roster[(orderCount - 1) % roster.length];
    }

    getMonsterCatalog() {
        const details = {
            starry_slime: {
                passive: '星屑記錄',
                desc: '讓案件線索更容易在腦中留存。',
                baseCost: 120,
                maxLevel: 5,
                levelEffects: (lv) => ({ storyManaBonus: 6 + (lv - 1) * 4 })
            },
            cinder_fox: {
                passive: '餘燼撲襲',
                desc: '追跡時會把連續成功轉成更高得分。',
                baseCost: 130,
                maxLevel: 5,
                levelEffects: (lv) => ({ endlessScoreBonus: 0.08 + (lv - 1) * 0.04 })
            },
            leafy_dragon: {
                passive: '護林延時',
                desc: '在限時案件裡替你撐住更長的觀察窗口。',
                baseCost: 150,
                maxLevel: 5,
                levelEffects: (lv) => ({ storyTimerBonus: 2 + Math.floor((lv - 1) / 2) })
            },
            moonlight_owl: {
                passive: '夜巡眼',
                desc: '每日題型更容易被快速拆解。',
                baseCost: 120,
                maxLevel: 5,
                levelEffects: (lv) => ({ dailyManaBonus: 8 + (lv - 1) * 4 })
            },
            solar_sprite: {
                passive: '金焰回收',
                desc: '結算時多帶回一些英鎊。',
                baseCost: 140,
                maxLevel: 5,
                levelEffects: (lv) => ({ rewardBonus: 0.04 + (lv - 1) * 0.02 })
            },
            mist_jellyfish: {
                passive: '霧潮緩衝',
                desc: '讓每日與限時案件都更容易穩住中盤。',
                baseCost: 140,
                maxLevel: 5,
                levelEffects: (lv) => ({ dailyManaBonus: 6 + (lv - 1) * 3, storyTimerBonus: 1 + Math.floor((lv - 1) / 2) })
            },
            crystal_turtle: {
                passive: '晶甲護身',
                desc: '追跡時替你多扛一兩次失誤反撲。',
                baseCost: 170,
                maxLevel: 5,
                levelEffects: (lv) => ({ endlessHpBonus: 1 + Math.floor((lv - 1) / 2) })
            },
            shadow_cat: {
                passive: '潛影預讀',
                desc: '讓故事推理更穩，追跡收尾也更俐落。',
                baseCost: 140,
                maxLevel: 5,
                levelEffects: (lv) => ({ storyManaBonus: 4 + (lv - 1) * 3, endlessScoreBonus: 0.03 + (lv - 1) * 0.02 })
            },
            clockwork_bird: {
                passive: '鐘輪報時',
                desc: '精準校時，讓限時關卡與報酬都略有提升。',
                baseCost: 180,
                maxLevel: 5,
                levelEffects: (lv) => ({ storyTimerBonus: 3 + Math.floor((lv - 1) / 2), rewardBonus: 0.02 + (lv - 1) * 0.01 })
            },
            cloud_sheep: {
                passive: '霧眠蓄力',
                desc: '每日題會更柔和，收尾也更有餘裕。',
                baseCost: 130,
                maxLevel: 5,
                levelEffects: (lv) => ({ dailyManaBonus: 4 + (lv - 1) * 3, rewardBonus: 0.04 + (lv - 1) * 0.015 })
            },
            abyss_moth: {
                passive: '深淵讀譜',
                desc: '能快速看出長卷宗中重複出現的錯位。',
                baseCost: 160,
                maxLevel: 5,
                levelEffects: (lv) => ({ storyManaBonus: 7 + (lv - 1) * 4, rewardBonus: 0.03 + (lv - 1) * 0.015 })
            },
            plague_bat: {
                passive: '疫鐘急襲',
                desc: '追跡節奏會更凌厲，且能多爭取一點限時空窗。',
                baseCost: 150,
                maxLevel: 5,
                levelEffects: (lv) => ({ endlessScoreBonus: 0.06 + (lv - 1) * 0.03, storyTimerBonus: 1 + Math.floor((lv - 1) / 2) })
            },
            grave_hound: {
                passive: '墓痕嗅覺',
                desc: '對長線案件與追跡耐久都有幫助。',
                baseCost: 165,
                maxLevel: 5,
                levelEffects: (lv) => ({ storyManaBonus: 5 + (lv - 1) * 3, endlessHpBonus: 1 + Math.floor((lv - 1) / 3) })
            },
            teacup_mimic: {
                passive: '茶宴緩釋',
                desc: '每日案件更穩，結算帶回的英鎊也更漂亮。',
                baseCost: 150,
                maxLevel: 5,
                levelEffects: (lv) => ({ dailyManaBonus: 5 + (lv - 1) * 3, rewardBonus: 0.05 + (lv - 1) * 0.015 })
            },
            moonwell_stag: {
                passive: '月井庇護',
                desc: '故事與每日兩種模式都能得到穩定增益。',
                baseCost: 180,
                maxLevel: 5,
                levelEffects: (lv) => ({ storyManaBonus: 8 + (lv - 1) * 4, dailyManaBonus: 8 + (lv - 1) * 4 })
            },
            candle_monk: {
                passive: '燭芯守夜',
                desc: '把案件節奏照亮一點，讓限時場更不容易失手。',
                baseCost: 145,
                maxLevel: 5,
                levelEffects: (lv) => ({ dailyManaBonus: 4 + (lv - 1) * 2, storyTimerBonus: 2 + Math.floor((lv - 1) / 2) })
            },
            mirror_serpent: {
                passive: '鏡淵折返',
                desc: '追跡得分與一般報酬都會向上抬一截。',
                baseCost: 170,
                maxLevel: 5,
                levelEffects: (lv) => ({ endlessScoreBonus: 0.05 + (lv - 1) * 0.03, rewardBonus: 0.04 + (lv - 1) * 0.015 })
            },
            library_beetle: {
                passive: '索引甲殼',
                desc: '像移動檔案櫃一樣，幫你同時整理故事與每日線索。',
                baseCost: 160,
                maxLevel: 5,
                levelEffects: (lv) => ({ storyManaBonus: 6 + (lv - 1) * 3, dailyManaBonus: 5 + (lv - 1) * 2, storyTimerBonus: 1 + Math.floor((lv - 1) / 3) })
            },
            frost_bell_widow: {
                passive: '寒鐘停滯',
                desc: '在追跡受擊前替你多爭取一些時間與血量緩衝。',
                baseCost: 175,
                maxLevel: 5,
                levelEffects: (lv) => ({ endlessHpBonus: 1 + Math.floor((lv - 1) / 2), storyTimerBonus: 2 + Math.floor((lv - 1) / 2) })
            },
            velvet_rose_chimera: {
                passive: '薔薇獵步',
                desc: '追跡輸出與長線推理都會更銳利。',
                baseCost: 170,
                maxLevel: 5,
                levelEffects: (lv) => ({ storyManaBonus: 5 + (lv - 1) * 3, endlessScoreBonus: 0.05 + (lv - 1) * 0.025 })
            }
        };

        return this.getEnemyRoster().map((enemy) => ({
            ...enemy,
            ...(details[enemy.id] || {
                passive: '未知共鳴',
                desc: '這隻怪獸還沒有被完整記錄。',
                baseCost: 140,
                maxLevel: 5,
                levelEffects: () => ({})
            })
        }));
    }

    getMonsterEntry(monsterId) {
        return this.getMonsterCatalog().find((monster) => monster.id === monsterId) || null;
    }

    getMonsterState(monsterId) {
        return this.data?.monsters?.captured?.[monsterId] || null;
    }

    isMonsterCaptured(monsterId) {
        return Boolean(this.getMonsterState(monsterId));
    }

    getMonsterLevel(monsterId) {
        return this.getMonsterState(monsterId)?.level || 1;
    }

    getMonsterUpgradeCost(monsterId) {
        const monster = this.getMonsterEntry(monsterId);
        if (!monster || !this.isMonsterCaptured(monsterId)) return Infinity;
        const level = this.getMonsterLevel(monsterId);
        if (level >= (monster.maxLevel || 5)) return Infinity;
        // 500, 1000, 1500...
        return 500 * level;
    }

    getMonsterEffectSummary(monsterOrId, explicitLevel = null) {
        const monster = typeof monsterOrId === 'string' ? this.getMonsterEntry(monsterOrId) : monsterOrId;
        if (!monster) return '尚未記錄效果';
        const level = explicitLevel || this.getMonsterLevel(monster.id);
        const effects = monster.levelEffects ? monster.levelEffects(level) : {};
        const parts = [];
        if (effects.storyManaBonus) parts.push(`故事推理力 +${effects.storyManaBonus}`);
        if (effects.dailyManaBonus) parts.push(`每日推理力 +${effects.dailyManaBonus}`);
        if (effects.endlessScoreBonus) parts.push(`追跡得分 +${Math.round(effects.endlessScoreBonus * 100)}%`);
        if (effects.endlessHpBonus) parts.push(`追跡 HP +${effects.endlessHpBonus}`);
        if (effects.storyTimerBonus) parts.push(`限時案件 +${effects.storyTimerBonus} 秒`);
        if (effects.rewardBonus) parts.push(`英鎊結算 +${Math.round(effects.rewardBonus * 100)}%`);
        return parts.join('｜') || '暫無明確效果';
    }

    getActiveMonster() {
        const activeId = this.data?.monsters?.activeMonsterId;
        if (!activeId || !this.isMonsterCaptured(activeId)) return null;
        const monster = this.getMonsterEntry(activeId);
        if (!monster) return null;
        const level = this.getMonsterLevel(activeId);
        return {
            ...monster,
            level,
            effectSummary: this.getMonsterEffectSummary(monster, level)
        };
    }

    getActiveMonsterEffects() {
        const active = this.getActiveMonster();
        return active?.levelEffects ? active.levelEffects(active.level) : {};
    }

    getCoinRewardMultiplier(mode = this.gameMode) {
        const effects = this.getActiveMonsterEffects();
        let bonus = effects.rewardBonus || 0;
        if (mode === 'endless') {
            // Scales with current round (orderCount) — more rounds = bigger reward
            const round = this.gameState?.orderCount || 1;
            const roundScale = 1 + (round - 1) * 0.15; // +15% per round
            return (1 + bonus) * 10.0 * roundScale;
        }
        if (mode === 'story') {
            // Scales with story arc progress (highestLevel)
            const highestLevel = this.data?.highestLevel || 1;
            const arcBonus = Math.floor((highestLevel - 1) / 20) * 0.3; // +30% per arc (every 20 levels)
            return (1 + bonus) * (1 + arcBonus);
        }
        return 1 + bonus;
    }

    getStoryTimerBonus() {
        return this.getActiveMonsterEffects().storyTimerBonus || 0;
    }

    getMonsterUnlockCost(monsterId) {
        const monster = this.getMonsterEntry(monsterId);
        if (!monster) return Infinity;
        return Math.max(500, (monster.baseCost || 120) * 10);
    }

    rollMonsterDrop(monsterId) {
        const monster = this.getMonsterEntry(monsterId);
        if (!monster) return { hit: false };
        if (Math.random() > 0.1) return { hit: false };
        if (!this.data.monsters) this.data.monsters = { activeMonsterId: '', captured: {}, pendingUnlocks: {} };
        if (!this.data.monsters.captured) this.data.monsters.captured = {};
        if (!this.data.monsters.pendingUnlocks) this.data.monsters.pendingUnlocks = {};

        if (this.isMonsterCaptured(monsterId) || this.data.monsters.pendingUnlocks[monsterId]) {
            this.data.coins += 3000;
            this.saveData({ showToast: false });
            return { hit: true, duplicate: true, bonus: 3000, monster };
        }

        this.data.monsters.pendingUnlocks[monsterId] = true;
        this.saveData({ showToast: false });
        return { hit: true, duplicate: false, monster, unlockCost: this.getMonsterUnlockCost(monsterId) };
    }

    unlockDroppedMonster(monsterId) {
        const monster = this.getMonsterEntry(monsterId);
        if (!monster) return false;
        if (!this.data.monsters?.pendingUnlocks?.[monsterId]) return false;
        const cost = this.getMonsterUnlockCost(monsterId);
        if (this.data.coins < cost) {
            this.showMessage('英鎊不足，無法解鎖怪獸。', 'error');
            return false;
        }
        this.data.coins -= cost;
        this.data.stats.coinsSpent += cost;
        delete this.data.monsters.pendingUnlocks[monsterId];
        this.data.monsters.captured[monsterId] = {
            level: 1,
            capturedAt: Date.now()
        };
        if (!this.data.monsters.activeMonsterId) this.data.monsters.activeMonsterId = monsterId;
        this.saveData();
        this.renderInventoryPanel();
        return true;
    }

    openMonsterDropModal(dropResult) {
        if (!dropResult?.hit || !this.els.monsterDropModal) return;
        const monster = dropResult.monster;
        if (!monster) return;
        if (this.els.monsterDropTitle) this.els.monsterDropTitle.textContent = dropResult.duplicate ? `${monster.name}（重複）` : `追跡到：${monster.name}`;
        if (this.els.monsterDropImage) {
            this.els.monsterDropImage.src = monster.image;
            this.els.monsterDropImage.alt = monster.name;
        }
        if (this.els.monsterDropDesc) {
            this.els.monsterDropDesc.textContent = dropResult.duplicate
                ? `重複線索已轉換為 ${dropResult.bonus} 英鎊。`
                : `你已抽到怪獸圖鑑條目，花費 ${dropResult.unlockCost} 英鎊即可解鎖。`;
        }
        if (this.els.btnMonsterDropAction) {
            this.els.btnMonsterDropAction.textContent = dropResult.duplicate ? '確認' : `解鎖（${dropResult.unlockCost}）`;
            this.els.btnMonsterDropAction.dataset.monsterDropId = monster.id;
            this.els.btnMonsterDropAction.dataset.monsterDropDuplicate = dropResult.duplicate ? '1' : '0';
            this.els.btnMonsterDropAction.disabled = !dropResult.duplicate && this.data.coins < dropResult.unlockCost;
        }
        this.setModalActive(this.els.monsterDropModal, true);
    }

    equipMonster(monsterId) {
        if (!this.isMonsterCaptured(monsterId)) {
            this.showMessage('尚未收服這隻怪獸。', 'error');
            return;
        }
        if (!this.data.monsters) this.data.monsters = { activeMonsterId: '', captured: {} };
        this.data.monsters.activeMonsterId = this.data.monsters.activeMonsterId === monsterId ? '' : monsterId;
        this.saveData({ showToast: false });
        this.renderInventoryPanel();
        const active = this.getActiveMonster();
        this.showMessage(active ? `已締結同行使魔：${active.name}` : '已解除使魔同行');
    }

    upgradeMonster(monsterId) {
        const monster = this.getMonsterEntry(monsterId);
        if (!monster || !this.isMonsterCaptured(monsterId)) {
            this.showMessage('尚未收服這隻怪獸。', 'error');
            return;
        }
        const level = this.getMonsterLevel(monsterId);
        const maxLevel = monster.maxLevel || 5;
        if (level >= maxLevel) {
            this.showMessage('使魔已達最高等級。', 'error');
            return;
        }
        const cost = this.getMonsterUpgradeCost(monsterId);
        if (this.data.coins < cost) {
            this.showMessage('英鎊不足，無法強化使魔。', 'error');
            return;
        }
        this.data.coins -= cost;
        this.data.stats.coinsSpent += cost;
        this.data.monsters.captured[monsterId].level = level + 1;
        this.saveData({ showToast: false });
        this.renderInventoryPanel();
        if (this.activeMonsterModalId === monsterId) this.openMonsterDetailModal(monsterId);
        this.showMessage(`${monster.name} 強化至 Lv.${level + 1}`);
    }

    setInventorySubtab(tabId = 'character') {
        const safeTab = ['character', 'familiar', 'monsters'].includes(tabId) ? tabId : 'character';
        this.inventorySubtab = safeTab;
        this.renderInventoryPanel();
    }

    openMonsterDetailModal(monsterId) {
        const monster = this.getMonsterEntry(monsterId);
        if (!monster || !this.isMonsterCaptured(monsterId)) {
            this.showMessage('尚未解鎖這隻怪獸。', 'error');
            return;
        }
        const level = this.getMonsterLevel(monsterId);
        const maxLevel = monster.maxLevel || 5;
        const isActive = this.getActiveMonster()?.id === monsterId;
        const upgradeCost = this.getMonsterUpgradeCost(monsterId);
        const nextEffects = level < maxLevel ? this.getMonsterEffectSummary(monster, level + 1) : '已達最高等級';

        this.activeMonsterModalId = monsterId;
        if (this.els.monsterModalTitle) this.els.monsterModalTitle.textContent = `${monster.name}｜怪獸詳情`;
        if (this.els.monsterModalDesc) {
            this.els.monsterModalDesc.innerHTML = `
                <div class="monster-detail-shell ${level >= 5 ? 'is-awakened' : ''}">
                    <div class="monster-detail-art">
                        <img src="${monster.image}" alt="${monster.name}">
                    </div>
                    <div class="monster-detail-copy">
                        <div class="monster-detail-topline">
                            <strong>${monster.name}</strong>
                            <span>Lv.${level}/${maxLevel}</span>
                        </div>
                        <p class="monster-detail-passive">${monster.passive}</p>
                        <p>${monster.desc}</p>
                        <div class="monster-detail-effects">
                            <div class="monster-effect-block">
                                <span>目前增益</span>
                                <strong>${this.getMonsterEffectSummary(monster, level)}</strong>
                            </div>
                            <div class="monster-effect-block ${level >= 5 ? 'is-awakened' : ''}">
                                <span>${level >= maxLevel ? '覺醒狀態' : '下次強化後'}</span>
                                <strong>${nextEffects}</strong>
                            </div>
                        </div>
                        <div class="monster-detail-actions">
                            <button class="btn btn-secondary" data-monster-modal-equip="${monster.id}">${isActive ? '解除同行' : '設為同行'}</button>
                            <button class="btn btn-primary" data-monster-modal-upgrade="${monster.id}" ${Number.isFinite(upgradeCost) && this.data.coins >= upgradeCost ? '' : 'disabled'}>
                                ${Number.isFinite(upgradeCost) ? `強化 ${upgradeCost}` : '已滿級'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        this.setModalActive(this.els.monsterModal, true);
    }

    getCharacterProfile(id = 'iris') {
        return this.characters[id] || this.characters.iris;
    }

    getCharacterImageForPortrait(portraitClass = 'portrait-iris') {
        const profile = Object.values(this.characters).find(character => character.portraitClass === portraitClass);
        return profile?.image || this.getCharacterProfile('iris').image;
    }

    getRandomCharacterId(excludeId = '') {
        const ids = Object.keys(this.characters);
        const pool = excludeId && ids.length > 1 ? ids.filter((id) => id !== excludeId) : ids;
        return pool[Math.floor(Math.random() * pool.length)] || 'iris';
    }

    getHubGuideMeta(panelId = this.activeHubPanel) {
        const nextLevel = this.getStoryProgressLevel();
        const todayRewardReady = this.canClaimDailyReward();
        const remainingWeekly = Math.max(0, 7 - this.data.weekly.stamps.length);

        switch (panelId) {
            case 'missions':
                return nextLevel
                    ? `案件檔案已打開，下一件是第 ${nextLevel.id} 案「${nextLevel.title}」。`
                    : '主線已全數結案，仍可重查已解鎖案件。';
            case 'daily':
                return todayRewardReady
                    ? `先打每日推理可拿今日 500 英鎊；怪獸追跡會消耗 30 精力並累積得分。`
                    : `今日 500 英鎊已領取，仍可練每日或打怪獸追跡；本週再完成 ${remainingWeekly} 天可多拿 500。`;
            case 'inventory':
                return this.data.stamina >= 10
                    ? `人物頁已拆成「人物 / 使魔 / 怪獸」三個分頁。已收服的怪獸會直接影響故事、每日與怪獸追跡。`
                    : `目前精力 ${this.data.stamina}/${this.getMaxStamina()}，可以先整理人物、使魔與怪獸，再補給或挑戰每日。`;
            case 'settings':
                return this.currentUser
                    ? `已登入 ${this.currentUser.displayName || '玩家'}，進度會先保存在裝置，再自動同步雲端；需要時可手動上傳。`
                    : '目前是本機存檔模式；登入 Google 後，英鎊、精力與案件進度都會自動同步到雲端。';
            case 'home':
            default:
                return nextLevel
                    ? `底部中央「案件」會打開委託桌，下一件是第 ${nextLevel.id} 案「${nextLevel.title}」。`
                    : '主線已全數結案，現在可以重查案件、每日與怪獸追跡。';
        }
    }

    refreshHubGuide({ rerollCharacter = false, panelId = this.activeHubPanel } = {}) {
        if (rerollCharacter || !this.characters[this.currentHubGreeter]) {
            this.currentHubGreeter = this.getRandomCharacterId(this.currentHubGreeter);
            this._hubGreetingSeed = '';
        }

        const character = this.getCharacterProfile(this.currentHubGreeter);
        const quotes = this.greetingQuotes[this.currentHubGreeter] || this.greetingQuotes.iris;
        let quote = this._hubGreetingSeed;
        if (!quote) {
            quote = quotes[Math.floor(Math.random() * quotes.length)] || '準備好就開始吧。';
            this._hubGreetingSeed = quote;
        }

        if (this.els.hubHeroImage) {
            this.els.hubHeroImage.src = character.image;
            this.els.hubHeroImage.alt = character.name;
        }
        if (this.els.hubTaskText) {
            this.els.hubTaskText.textContent = quote;
        }
        if (this.els.heroGuideMeta) {
            this.els.heroGuideMeta.textContent = this.getHubGuideMeta(panelId);
        }
    }

    getPortraitForLevel(level) {
        if (!level) return this.getCharacterProfile('iris').portraitClass;
        if (level.clientPortrait) return level.clientPortrait;
        const clientName = level.client || '';
        if (clientName.includes('洛西') || clientName.includes('斥侯')) return 'portrait-scout';
        if (clientName.includes('莫妮') || clientName.includes('書記')) return 'portrait-broker';
        if (clientName.includes('琳塔') || clientName.includes('抄寫員')) return 'portrait-mentor';
        if (clientName.includes('莫里亞蒂')) return 'portrait-rival';
        return 'portrait-client';
    }

    getClientSpeakerName(level) {
        if (!level?.client) return '委託人';
        const parts = level.client.trim().split(/\s+/);
        return parts[parts.length - 1] || level.client;
    }

    getStoryProgressLevel() {
        if (this.data.highestLevel > this.levels.length) return null;
        const nextId = Math.min(this.data.highestLevel, this.levels.length);
        return this.levels.find(level => level.id === nextId) || this.levels[this.levels.length - 1];
    }

    getStoryParchmentText(level) {
        const normalizePOV = (text) => {
            if (!text) return '';
            return String(text)
                .replaceAll('主角', '你')
                .replaceAll('我', '你')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>');
        };
        
        // Handle both 'narrativeParagraphs' and 'storyNarrativeParagraphs'
        const rawParagraphs = level.narrativeParagraphs || level.storyNarrativeParagraphs || [];
        const paragraphs = [...rawParagraphs].map(normalizePOV);
        
        if (paragraphs.length === 0 && (level.narrative || level.intro)) {
            paragraphs.push(normalizePOV(level.narrative || level.intro));
        }
        
        const gameplay = level.gameplayDetail || level.clue || this.getRuleClue(level.rule, level.slotCount);
        if (gameplay) paragraphs.push(`<strong>${gameplay}</strong>`);
        
        return paragraphs.filter(Boolean);
    }

    openStoryParchment(level, onContinue) {
        if (!level || !this.els.storyPaperModal) {
            if (onContinue) onContinue();
            return;
        }

        const paragraphs = this.getStoryParchmentText(level)
            .map((text) => `<p>${text}</p>`)
            .join('');

        if (this.els.storyPaperTopline) {
            this.els.storyPaperTopline.textContent = `${level.storyArcTitle}｜${level.chapter}｜第 ${level.chapterOrder} 件`;
        }
        if (this.els.storyPaperTitle) {
            this.els.storyPaperTitle.textContent = `案件 #${String(level.id).padStart(2, '0')}｜${level.title}`;
        }
        if (this.els.storyPaperBody) {
            this.els.storyPaperBody.innerHTML = paragraphs;
        }
        if (this.els.btnStoryPaperContinue) {
            this.els.btnStoryPaperContinue.textContent = '進行推理';
        }

        this.setModalActive(this.els.storyPaperModal, true);
        const handler = () => {
            if (window.audio) window.audio.playClick();
            this.els.btnStoryPaperContinue?.removeEventListener('click', handler);
            this.setModalActive(this.els.storyPaperModal, false);
            if (onContinue) onContinue();
        };
        this.els.btnStoryPaperContinue?.addEventListener('click', handler);
    }

    openEndingParchment(level, onContinue) {
        const endingHook = level.endingHook || level.storyEndingHook;
        if (!level || !this.els.storyPaperModal || !endingHook) {
            if (onContinue) onContinue();
            return;
        }

        const normalizePOV = (text) => {
            if (!text) return '';
            return String(text)
                .replaceAll('主角', '你')
                .replaceAll('我', '你')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>');
        };

        const endingText = normalizePOV(endingHook);
        const paragraphs = `<p>${endingText}</p>`;

        if (this.els.storyPaperTopline) {
            this.els.storyPaperTopline.textContent = `案件已破獲｜${level.chapter}`;
        }
        if (this.els.storyPaperTitle) {
            this.els.storyPaperTitle.textContent = `案件 #${String(level.id).padStart(2, '0')}：結案筆記`;
        }
        if (this.els.storyPaperBody) {
            this.els.storyPaperBody.innerHTML = paragraphs;
        }
        if (this.els.btnStoryPaperContinue) {
            this.els.btnStoryPaperContinue.textContent = '檢視評級';
        }

        this.setModalActive(this.els.storyPaperModal, true);
        const handler = () => {
            if (window.audio) window.audio.playClick();
            this.els.btnStoryPaperContinue?.removeEventListener('click', handler);
            this.setModalActive(this.els.storyPaperModal, false);
            if (onContinue) onContinue();
        };
        this.els.btnStoryPaperContinue?.addEventListener('click', handler);
    }

    getEndlessMonsterLead(enemy) {
        const leads = {
            starry_slime: '碼頭工人回報看到會發光的黏液拖痕，像在沿著固定座標移動。',
            cinder_fox: '東區巷口留下灼痕與爪印，目擊者說像一隻燃燼狐狸快速掠過。',
            moonlight_owl: '夜巡警察看見高處反覆盤旋的銀色剪影，疑似月光貓頭鷹。',
            clockwork_bird: '鐘樓附近出現規律機械噪音，疑似發條鳥在投放訊號。',
            mist_jellyfish: '泰晤士河霧帶裡有漂浮光斑，疑似霧水母在干擾視線。',
            crystal_turtle: '石橋下出現硬質反光甲殼，疑似水晶龜在慢速巡游。',
            shadow_cat: '多起失竊現場都留下同樣的黑影尾跡，疑似影貓反覆踩點。',
            cloud_sheep: '屋頂上空出現棉雲般生物，風向與電訊雜訊同時異常。',
            solar_sprite: '白教堂巷道有高溫亮點跳動，疑似日耀精靈短暫現形。',
            leafy_dragon: '植物園傳回葉片切痕，像是小型葉龍低空掠行。',
            plague_bat: '地下通道傳出尖銳回音，疑似疫蝠群在校準回聲定位。',
            grave_hound: '墓園看守發現重複足跡，疑似墓獵犬沿舊路線追查。',
            mirror_serpent: '玻璃櫥窗映像延遲異常，疑似鏡蛇利用反射位移。',
            moonwell_stag: '月井周邊出現蹄印與光斑，疑似月泉鹿短距躍遷。',
            velvet_rose_chimera: '花市傳來混合獸鳴，疑似薔薇奇美拉在收集氣味。',
            library_beetle: '圖書館古冊頁角被規律啃蝕，疑似索引甲蟲建立路標。',
            candle_monk: '修道院燭火同時偏轉，疑似燭僧經過帶來熱流扭曲。',
            teacup_mimic: '茶館失物頻傳，疑似茶杯擬態體混入桌面陳列。',
            abyss_moth: '下水道口有深色鱗粉與冷光，疑似深淵蛾夜間出沒。',
            frost_bell_widow: '舊鐘塔結霜加劇，疑似寒鐘寡蛛在牆面結網。'
        };
        return leads[enemy?.id] || '附近傳回未知生物目擊紀錄，委託你立刻追跡確認。';
    }

    buildEndlessMonsterIntro(enemy, orderCount = 1) {
        const scout = this.getCharacterProfile('scout');
        const iris = this.getCharacterProfile('iris');
        const clueText = enemy?.clue || "附近有一些不尋常的動靜...";
        
        return [
            {
                speaker: scout.name,
                portrait: scout.portraitClass,
                text: `追跡目標 ${orderCount}/8：發現了新的線索！${clueText}`
            },
            {
                speaker: iris.name,
                portrait: iris.portraitClass,
                text: `雖然還沒看清目標的樣子，但活動軌跡已經鎖定了。先用密碼推理抓住牠的移動規律。`
            }
        ];
    }

    buildLevelIntro(level) {
        const normalizePOV = (text) => String(text || '')
            .replaceAll('主角', '你')
            .replaceAll('「主角」', '「你」');
        const iris = this.getCharacterProfile('iris');
        const mentor = this.getCharacterProfile('mentor');

        // If the level has dedicated openingDialogue data from VOLUME files, use it directly
        // These are puzzle-context dialogues, NOT the narrative (which was already shown on parchment)
        const openingDialogue = level.storyOpeningDialogue || [];
        if (openingDialogue.length > 0) {
            const lines = openingDialogue.map(d => ({
                speaker: normalizePOV(d.speaker),
                portrait: d.portrait || 'portrait-client',
                text: normalizePOV(d.text)
            }));
            // Append puzzle guidance as final line
            const clue = level.gameplayDetail || level.storyClue || level.clue || this.getRuleClue(level.rule, level.slotCount);
            if (clue) {
                lines.push({
                    speaker: iris.name,
                    portrait: iris.portraitClass,
                    text: `這次的規格是「${level.ruleLabel}」。${clue}`
                });
            }
            return lines;
        }

        // Fallback: no openingDialogue data — provide minimal puzzle guidance only
        const isChapterFinale = level.chapterOrder === 10;
        const clue = level.gameplayDetail || level.storyClue || level.clue || this.getRuleClue(level.rule, level.slotCount);
        const lines = [
            {
                speaker: iris.name,
                portrait: iris.portraitClass,
                text: `案件「${level.title}」的卷宗已經看完了。現在進入推理階段。`
            },
            {
                speaker: mentor.name,
                portrait: mentor.portraitClass,
                text: isChapterFinale
                    ? `這是 ${level.chapter} 的收尾案件。規格還是「${level.ruleLabel}」，前面累積的線索也要一起帶進來。`
                    : `這次的規格是「${level.ruleLabel}」。${clue || '先把不可能的答案排掉，再慢慢縮小範圍。'}`
            }
        ];
        return lines;
    }

    buildVictoryDialogue(level, stars) {
        const milestone = this.getMilestoneLine(level, stars);
        const iris = this.getCharacterProfile('iris');
        const mentor = this.getCharacterProfile('mentor');
        const rival = this.getCharacterProfile('rival');
        const scout = this.getCharacterProfile('scout');

        let opener = stars === 3 ? level.perfect : stars === 2 ? level.good : level.rough;
        const isChapterFinale = level.chapterOrder === 10;
        const isArcFinale = level.storyArcOrder === level.storyArcCaseTotal;

        const lines = [
            {
                speaker: this.getClientSpeakerName(level),
                portrait: this.getPortraitForLevel(level),
                text: opener
            }
        ];

        if (stars === 3) {
            lines.push({
                speaker: iris.name,
                portrait: iris.portraitClass,
                text: isArcFinale
                    ? `這次不是只破掉「${level.title}」，而是把整卷《${level.storyArcTitle}》都接回正軌了。`
                    : `這次收得很乾淨。你前面幾輪就抓到方向，後面幾乎沒有浪費動作。`
            });
        } else if (stars === 2) {
            lines.push({
                speaker: iris.name,
                portrait: iris.portraitClass,
                text: '案件是結了，但中間還是多繞了幾步。方向沒錯，只差把每一輪線索用得更乾淨。'
            });
        } else {
            lines.push({
                speaker: iris.name,
                portrait: iris.portraitClass,
                text: '這次是勉強收住。能結案不代表做得漂亮，還得回頭看是哪一步拖慢了節奏。'
            });
        }

        if (stars === 3 && (isChapterFinale || isArcFinale)) {
            lines.push({
                speaker: rival.name,
                portrait: rival.portraitClass,
                text: isArcFinale
                    ? '漂亮。你不只解開最後一個密碼，還看穿了我整卷是怎麼排的。可惜，真正的代價現在才要開始。'
                    : '章節收尾做得不差。你總算開始像個會看全局的人了。'
            });
        }

        if (milestone) {
            lines.push({
                speaker: mentor.name,
                portrait: mentor.portraitClass,
                text: isArcFinale
                    ? `這卷最難的不是密碼有多長，而是你能不能記住前面所有誤導。你做到了。`
                    : `你把 ${level.chapter} 這一段收住了。重點不是分數，是你開始會用整章的角度看案子了。`
            });
            lines.push({
                speaker: iris.name,
                portrait: iris.portraitClass,
                text: milestone
            });
        }

        if (isChapterFinale) {
            lines.push({
                speaker: scout.name,
                portrait: scout.portraitClass,
                text: isArcFinale
                    ? `結案報告我會送回蘇格蘭場。這一卷先封存，但下一批卷宗只會更直接。`
                    : `這一章的報告我先帶回蘇格蘭場。下一批卷宗會沿著同一條線來，你休息不了太久。`
            });
        }

        if (level.storyEndingHook) {
            lines.push({
                speaker: '',
                portrait: 'portrait-narrator',
                text: `【章節懸念】${level.storyEndingHook}`
            });
        }

        return lines;
    }

    buildFailureDialogue(level) {
        const iris = this.getCharacterProfile('iris');
        const mentor = this.getCharacterProfile('mentor');
        const rival = this.getCharacterProfile('rival');
        const broker = this.getCharacterProfile('broker');
        const isChapterFinale = level.chapterOrder === 10;

        const lines = [
            {
                speaker: this.getClientSpeakerName(level),
                portrait: this.getPortraitForLevel(level),
                text: level.fail
            }
        ];

        lines.push({
            speaker: iris.name,
            portrait: iris.portraitClass,
            text: isChapterFinale
                ? `偏偏倒在 ${level.chapter} 的最後。代表我不是看不懂單一線索，而是還沒把整章接起來。`
                : `這次不是規格太難，是我前幾輪沒有把線索整理乾淨。下次不能再被同樣的錯位拖住。`
        });

        if (level.id % 3 === 0 || isChapterFinale) {
            lines.push({
                speaker: rival.name,
                portrait: rival.portraitClass,
                text: isChapterFinale
                    ? '真可惜，整整一章居然斷在最後一格。你還是太習慣只看局部了。'
                    : '你又把步數浪費在沒必要的試探上了。不是答案太深，是你太晚把錯誤切掉。'
            });
        }

        lines.push({
            speaker: mentor.name,
            portrait: mentor.portraitClass,
            text: level.slotCount >= 5
                ? '長密碼不是靠一次猜中，而是先用前幾輪確認哪些數字存在，再慢慢定位。每一輪都該讓範圍縮小。'
                : '短密碼更不能亂猜。A 和 B 已經夠你砍掉大半錯路，回頭看紀錄，你就知道哪一輪浪費掉了。'
        });

        lines.push({
            speaker: broker.name,
            portrait: broker.portraitClass,
            text: '先回來把卷宗攤開吧。熱茶和新紙我都備好了，腦袋冷下來再重開，比硬撐著往前衝有用。'
        });

        return lines;
    }

    getMilestoneLine(levelOrId, stars) {
        const level = typeof levelOrId === 'object'
            ? levelOrId
            : this.levels.find((entry) => entry.id === levelOrId);
        if (!level) return '';

        if (level.storyArcOrder === level.storyArcCaseTotal) {
            return stars === 3
                ? `《${level.storyArcTitle}》完整收束了。我不只撐過最後一案，還真的把整卷暗碼的骨架看懂了。`
                : `這一卷終於結束。即使還有瑕疵，我也知道自己已經能把一整段故事背後的節奏扛起來。`;
        }
        if (level.chapterOrder === 10) {
            return stars === 3
                ? `${level.chapter} 的最後一道鎖被我用最乾淨的方式打開。這證明我已經能把整章的線索整體運作起來。`
                : `${level.chapter} 暫時結案了。真正的收穫不是分數，而是我終於能感覺出整章證物在什麼地方開始共振。`;
        }
        if (level.slotCount >= 5) return '長密碼不會因為害怕而變短，能做的只有把判斷磨得更穩。';
        if (level.slotCount >= 4) return '線索一變多，節奏就比直覺更重要，而我確實正在學會這件事。';
        return '每完成一件小案，我都更能分清楚什麼是雜訊，什麼才是真正該追的節點。';
    }

    getDefaultData() {
        return {
            coins: 100,
            maxMana: 100,
            maxStamina: 100,
            highestLevel: 1,
            levelStars: {},
            stamina: 100,
            lastEnergyTime: Date.now(),
            updatedAt: Date.now(),
            activeQuestId: 'q1',
            upgrades: { shopLevels: {} },
            stats: { wins: 0, manaSpent: 0, stars: 0, endlessPlayed: 0, coinsSpent: 0, dailyWins: 0, endlessBestScore: 0, endlessBestDefeated: 0 },
            daily: { rewardDate: '', bestDate: '', bestTurns: 0, lastPlayedDate: '', playCount: 0 },
            weekly: { cycleStart: '', stamps: [], rewardClaimed: false },
            player: { selectedCharacter: 'female', unlockedTitles: ['apprentice'], activeTitle: 'apprentice', titleLevels: {} },
            monsters: { activeMonsterId: '', captured: {}, pendingUnlocks: {} },
            settings: { bootSeen: false, guestStarted: false }
        };
    }

    normalizeData(rawData = null) {
        const defaultData = this.getDefaultData();
        const source = rawData && typeof rawData === 'object' ? rawData : {};
        const now = Date.now();
        const clampInt = (value, fallback, min = 0, max = Number.MAX_SAFE_INTEGER) => {
            const numeric = Math.floor(Number(value));
            if (!Number.isFinite(numeric)) return fallback;
            return Math.min(max, Math.max(min, numeric));
        };

        const merged = {
            ...defaultData,
            ...source,
            levelStars: { ...defaultData.levelStars, ...(source.levelStars || {}) },
            upgrades: { ...defaultData.upgrades, ...(source.upgrades || {}) },
            stats: { ...defaultData.stats, ...(source.stats || {}) },
            daily: { ...defaultData.daily, ...(source.daily || {}) },
            weekly: { ...defaultData.weekly, ...(source.weekly || {}) },
            player: { ...defaultData.player, ...(source.player || {}) },
            monsters: { ...defaultData.monsters, ...(source.monsters || {}) },
            settings: { ...defaultData.settings, ...(source.settings || {}) }
        };

        merged.coins = clampInt(merged.coins, defaultData.coins);
        merged.maxMana = clampInt(merged.maxMana, defaultData.maxMana, 20);
        merged.highestLevel = clampInt(merged.highestLevel, defaultData.highestLevel, 1);
        if (merged.maxStamina === undefined) merged.maxStamina = 100;
        merged.stamina = clampInt(merged.stamina, defaultData.stamina, 0, merged.maxStamina);
        merged.lastEnergyTime = clampInt(merged.lastEnergyTime, now, 0, now);
        merged.updatedAt = clampInt(merged.updatedAt, now, 0, now);
        merged.activeQuestId = typeof merged.activeQuestId === 'string' ? merged.activeQuestId : defaultData.activeQuestId;

        merged.upgrades = {
            shopLevels: (merged.upgrades && typeof merged.upgrades.shopLevels === 'object') ? merged.upgrades.shopLevels : {}
        };

        merged.stats = {
            wins: clampInt(merged.stats.wins, 0),
            manaSpent: clampInt(merged.stats.manaSpent, 0),
            stars: clampInt(merged.stats.stars, 0),
            endlessPlayed: clampInt(merged.stats.endlessPlayed, 0),
            coinsSpent: clampInt(merged.stats.coinsSpent, 0),
            dailyWins: clampInt(merged.stats.dailyWins, 0),
            endlessBestScore: clampInt(merged.stats.endlessBestScore, 0),
            endlessBestDefeated: clampInt(merged.stats.endlessBestDefeated, 0)
        };

        merged.daily = {
            rewardDate: typeof merged.daily.rewardDate === 'string' ? merged.daily.rewardDate : '',
            bestDate: typeof merged.daily.bestDate === 'string' ? merged.daily.bestDate : '',
            bestTurns: clampInt(merged.daily.bestTurns, 0),
            lastPlayedDate: typeof merged.daily.lastPlayedDate === 'string' ? merged.daily.lastPlayedDate : '',
            playCount: clampInt(merged.daily.playCount, 0)
        };

        merged.weekly = {
            cycleStart: typeof merged.weekly.cycleStart === 'string' ? merged.weekly.cycleStart : '',
            stamps: Array.isArray(merged.weekly.stamps)
                ? merged.weekly.stamps.filter((stamp) => typeof stamp === 'string')
                : [],
            rewardClaimed: Boolean(merged.weekly.rewardClaimed)
        };

        const playableIds = new Set(this.getPlayableCharacters().map((character) => character.id));
        const titleIds = new Set(this.getTitleCatalog().map((title) => title.id));
        const unlockedTitles = Array.isArray(merged.player.unlockedTitles)
            ? merged.player.unlockedTitles.filter((titleId) => titleIds.has(titleId))
            : [];
        if (!unlockedTitles.includes('apprentice')) unlockedTitles.unshift('apprentice');

        const titleLevels = (merged.player && typeof merged.player.titleLevels === 'object') ? merged.player.titleLevels : {};
        merged.player = {
            selectedCharacter: playableIds.has(merged.player.selectedCharacter) ? merged.player.selectedCharacter : defaultData.player.selectedCharacter,
            unlockedTitles,
            activeTitle: unlockedTitles.includes(merged.player.activeTitle) ? merged.player.activeTitle : 'apprentice',
            titleLevels
        };

        const monsterIds = new Set(this.getMonsterCatalog().map((monster) => monster.id));
        const rawCaptured = (merged.monsters && typeof merged.monsters.captured === 'object') ? merged.monsters.captured : {};
        const captured = {};
        Object.entries(rawCaptured).forEach(([monsterId, monsterState]) => {
            if (!monsterIds.has(monsterId) || !monsterState || typeof monsterState !== 'object') return;
            captured[monsterId] = {
                level: clampInt(monsterState.level, 1, 1, 5),
                capturedAt: clampInt(monsterState.capturedAt, now, 0, now)
            };
        });
        const pendingUnlocksRaw = (merged.monsters && typeof merged.monsters.pendingUnlocks === 'object') ? merged.monsters.pendingUnlocks : {};
        const pendingUnlocks = {};
        Object.entries(pendingUnlocksRaw).forEach(([monsterId, v]) => {
            if (monsterIds.has(monsterId) && !captured[monsterId] && Boolean(v)) pendingUnlocks[monsterId] = true;
        });
        merged.monsters = {
            activeMonsterId: captured[merged.monsters.activeMonsterId] ? merged.monsters.activeMonsterId : '',
            captured,
            pendingUnlocks
        };

        merged.settings = {
            bootSeen: Boolean(merged.settings.bootSeen),
            guestStarted: Boolean(merged.settings.guestStarted)
        };

        merged.levelStars = Object.fromEntries(
            Object.entries(merged.levelStars).map(([levelId, stars]) => [levelId, clampInt(stars, 0, 0, 3)])
        );

        if (merged.stamina < merged.maxStamina) {
            const elapsedMin = Math.floor((now - merged.lastEnergyTime) / 60000);
            if (elapsedMin > 0) {
                merged.stamina = Math.min(merged.maxStamina, merged.stamina + elapsedMin);
                merged.lastEnergyTime += elapsedMin * 60000;
            }
        } else {
            merged.lastEnergyTime = now;
        }

        return merged;
    }

    getSerializableData(data = this.data, { touchTimestamp = true } = {}) {
        const serialized = this.normalizeData(data);
        if (touchTimestamp) serialized.updatedAt = Date.now();
        return serialized;
    }

    getSaveProgressVector(data = null) {
        const save = data || this.getDefaultData();
        const totalStars = Object.values(save.levelStars || {}).reduce((sum, stars) => sum + (Number(stars) || 0), 0);
        const titleLevelTotal = Object.values(save.player?.titleLevels || {}).reduce((sum, level) => sum + (Number(level) || 0), 0);
        const shopLevelTotal = Object.values(save.upgrades?.shopLevels || {}).reduce((sum, level) => sum + (Number(level) || 0), 0);

        return [
            save.highestLevel || 1,
            totalStars,
            (save.player?.unlockedTitles || []).length,
            titleLevelTotal,
            save.maxMana || 0,
            save.maxStamina || 0,
            shopLevelTotal,
            Object.keys(save.monsters?.captured || {}).length,
            Object.values(save.monsters?.captured || {}).reduce((sum, state) => sum + (Number(state?.level) || 0), 0),
            save.stats?.wins || 0,
            save.stats?.dailyWins || 0,
            save.stats?.endlessBestDefeated || 0,
            save.stats?.endlessBestScore || 0,
            save.stats?.coinsSpent || 0
        ];
    }

    compareSaveProgress(firstData = null, secondData = null) {
        const firstVector = this.getSaveProgressVector(firstData);
        const secondVector = this.getSaveProgressVector(secondData);

        for (let i = 0; i < firstVector.length; i++) {
            if (firstVector[i] !== secondVector[i]) {
                return firstVector[i] > secondVector[i] ? 1 : -1;
            }
        }

        const firstTime = Number(firstData?.updatedAt) || 0;
        const secondTime = Number(secondData?.updatedAt) || 0;
        if (firstTime === secondTime) return 0;
        return firstTime > secondTime ? 1 : -1;
    }

    mergeSaveData(firstData = null, secondData = null) {
        const createEmptyState = () => {
            const empty = this.getDefaultData();
            empty.updatedAt = 0;
            return empty;
        };

        const left = firstData ? this.normalizeData(firstData) : createEmptyState();
        const right = secondData ? this.normalizeData(secondData) : createEmptyState();
        const preferred = this.compareSaveProgress(left, right) >= 0 ? left : right;
        const fallback = preferred === left ? right : left;
        const newer = left.updatedAt >= right.updatedAt ? left : right;
        const older = newer === left ? right : left;

        const merged = this.normalizeData(preferred);
        merged.maxMana = Math.max(left.maxMana, right.maxMana);
        merged.maxStamina = Math.max(left.maxStamina, right.maxStamina);
        merged.highestLevel = Math.max(left.highestLevel, right.highestLevel);
        merged.levelStars = {};

        const allStarLevels = new Set([
            ...Object.keys(left.levelStars || {}),
            ...Object.keys(right.levelStars || {})
        ]);
        allStarLevels.forEach((levelId) => {
            merged.levelStars[levelId] = Math.max(left.levelStars[levelId] || 0, right.levelStars[levelId] || 0);
        });

        const mergedShopLevels = { ...(right.upgrades?.shopLevels || {}), ...(left.upgrades?.shopLevels || {}) };
        Object.keys(mergedShopLevels).forEach(k => {
            mergedShopLevels[k] = Math.max(left.upgrades?.shopLevels?.[k] || 0, right.upgrades?.shopLevels?.[k] || 0);
        });
        merged.upgrades = {
            shopLevels: mergedShopLevels
        };

        merged.stats = {
            wins: Math.max(left.stats.wins, right.stats.wins),
            manaSpent: Math.max(left.stats.manaSpent, right.stats.manaSpent),
            stars: Math.max(left.stats.stars, right.stats.stars),
            endlessPlayed: Math.max(left.stats.endlessPlayed, right.stats.endlessPlayed),
            coinsSpent: Math.max(left.stats.coinsSpent, right.stats.coinsSpent),
            dailyWins: Math.max(left.stats.dailyWins, right.stats.dailyWins),
            endlessBestScore: Math.max(left.stats.endlessBestScore, right.stats.endlessBestScore),
            endlessBestDefeated: Math.max(left.stats.endlessBestDefeated, right.stats.endlessBestDefeated)
        };

        merged.daily = {
            rewardDate: newer.daily.rewardDate || older.daily.rewardDate || '',
            bestDate: newer.daily.bestDate || older.daily.bestDate || '',
            bestTurns: newer.daily.bestTurns && older.daily.bestTurns
                ? Math.min(newer.daily.bestTurns, older.daily.bestTurns)
                : Math.max(newer.daily.bestTurns || 0, older.daily.bestTurns || 0),
            lastPlayedDate: newer.daily.lastPlayedDate || older.daily.lastPlayedDate || '',
            playCount: Math.max(newer.daily.playCount || 0, older.daily.playCount || 0)
        };

        const weeklyCycle = newer.weekly.cycleStart || older.weekly.cycleStart || '';
        const weeklyStamps = new Set([
            ...(left.weekly.cycleStart === weeklyCycle ? left.weekly.stamps : []),
            ...(right.weekly.cycleStart === weeklyCycle ? right.weekly.stamps : [])
        ]);
        merged.weekly = {
            cycleStart: weeklyCycle,
            stamps: [...weeklyStamps].sort(),
            rewardClaimed:
                (left.weekly.cycleStart === weeklyCycle && left.weekly.rewardClaimed) ||
                (right.weekly.cycleStart === weeklyCycle && right.weekly.rewardClaimed)
        };

        const mergedTitles = new Set([
            ...(left.player.unlockedTitles || []),
            ...(right.player.unlockedTitles || [])
        ]);
        const mergedTitleLevels = { ...(right.player?.titleLevels || {}), ...(left.player?.titleLevels || {}) };
        Object.keys(mergedTitleLevels).forEach(k => {
            mergedTitleLevels[k] = Math.max(left.player?.titleLevels?.[k] || 0, right.player?.titleLevels?.[k] || 0);
        });
        merged.player = {
            selectedCharacter: preferred.player.selectedCharacter || fallback.player.selectedCharacter || 'female',
            unlockedTitles: [...mergedTitles],
            activeTitle: mergedTitles.has(preferred.player.activeTitle) ? preferred.player.activeTitle : 'apprentice',
            titleLevels: mergedTitleLevels
        };

        const monsterIds = new Set(this.getMonsterCatalog().map((monster) => monster.id));
        const mergedMonsterStates = {};
        monsterIds.forEach((monsterId) => {
            const leftMonster = left.monsters?.captured?.[monsterId];
            const rightMonster = right.monsters?.captured?.[monsterId];
            if (!leftMonster && !rightMonster) return;
            const preferredMonster = (leftMonster?.level || 0) >= (rightMonster?.level || 0) ? leftMonster : rightMonster;
            mergedMonsterStates[monsterId] = {
                level: Math.max(leftMonster?.level || 0, rightMonster?.level || 0, 1),
                capturedAt: preferredMonster?.capturedAt || leftMonster?.capturedAt || rightMonster?.capturedAt || Date.now()
            };
        });
        const activeMonsterId = mergedMonsterStates[preferred.monsters?.activeMonsterId]
            ? preferred.monsters.activeMonsterId
            : mergedMonsterStates[fallback.monsters?.activeMonsterId]
                ? fallback.monsters.activeMonsterId
                : '';
        merged.monsters = {
            activeMonsterId,
            captured: mergedMonsterStates
        };

        merged.settings = {
            bootSeen: left.settings.bootSeen || right.settings.bootSeen,
            guestStarted: left.settings.guestStarted || right.settings.guestStarted
        };

        merged.updatedAt = Math.max(newer.updatedAt, older.updatedAt);
        return this.normalizeData(merged);
    }

    getDateKey() {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Taipei',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date());
    }

    createSeededRandom(seedInput) {
        let seed = 0;
        const seedText = String(seedInput);
        for (let i = 0; i < seedText.length; i++) {
            seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
        }
        return () => {
            seed += 0x6D2B79F5;
            let t = seed;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    getRuleClue(rule, slotCount) {
        return `猜出 ${slotCount} 位不重複的數字密碼（1-9）。A 表示數字和位置都正確，B 表示數字正確但位置錯誤。`;
    }

    normalizePuzzleDefinition(puzzle) {
        if (!puzzle) return puzzle;
        const resolvedClue = puzzle.storyClue || puzzle.clue || this.getRuleClue(puzzle.rule, puzzle.slotCount);
        return {
            ...puzzle,
            storyClue: puzzle.storyClue || puzzle.clue || '',
            clue: resolvedClue,
            ruleClue: this.getRuleClue(puzzle.rule, puzzle.slotCount)
        };
    }

    auditPuzzleCatalog() {
        const dailyPool = this.getDailyChallengePool().map((entry) =>
            this.normalizePuzzleDefinition({ ...entry, slotCount: entry.slotCount || 5 })
        );
        const pools = [...this.levels, ...dailyPool];

        pools.forEach((puzzle, index) => {
            const rng = this.createSeededRandom(`${puzzle.rule}-${puzzle.slotCount}-${index}`);
            const secret = this.generateSecret(puzzle.rule, puzzle.slotCount, rng);
            if (!this.validatePattern(puzzle.rule, secret, puzzle.slotCount)) {
                console.error('Invalid puzzle rule detected', puzzle.rule, puzzle.slotCount, secret, puzzle);
            }
        });
    }

    getDailyChallengePool() {
        return [
            { title: '3位數推理', rule: '1a2b', ruleLabel: '3 位數密碼' },
            { title: '4位數推理', rule: '1a2b', ruleLabel: '4 位數密碼' },
            { title: '5位數推理', rule: '1a2b', ruleLabel: '5 位數密碼' }
        ];
    }

    generateDailyChallenge() {
        const dateKey = this.getDateKey();
        const seed = dateKey.split('-').reduce((a, b) => a + parseInt(b), 0);
        const slotCounts = [3, 4, 5];
        const slotCount = slotCounts[seed % slotCounts.length];
        const titles = ['每日3位數推理', '每日4位數推理', '每日5位數推理'];
        const title = titles[slotCounts.indexOf(slotCount)];

        return this.normalizePuzzleDefinition({
            id: `daily-${dateKey}`,
            dateKey,
            name: `每日推理｜${title}`,
            title,
            client: '每日密碼推理',
            request: '每日推理，每次消耗 5 精力，破案獲得 10 英鎊。',
            rule: '1a2b',
            ruleLabel: `${slotCount} 位數密碼`,
            slotCount,
            storyClue: `猜出 ${slotCount} 位不重複的數字密碼（1-9）。`,
            chapter: '每日推理',
            chapterIndex: 1,
            intro: '',
            perfect: '推理完成！',
            good: '推理完成。',
            rough: '勉強破案。',
            fail: '推理失敗。'
        });
    }

    getEndlessChallengePool(slotCount) {
        return [{ rule: '1a2b', ruleLabel: `${slotCount} 位數密碼` }];
    }

    generateEndlessOrder(orderCount = 1) {
        const slotCount = Math.min(3 + Math.floor((orderCount - 1) / 3), 7);
        return this.normalizePuzzleDefinition({
            id: `endless-${orderCount}`,
            title: `${slotCount} 位密碼追跡 #${orderCount}`,
            name: `迷霧追跡 #${orderCount}`,
            chapter: '怪獸追跡',
            client: '迷霧中的異常痕跡',
            request: `在倒數歸零前破解 ${slotCount} 位密碼，將迷霧裡的異常紀錄鎖定成可回收的追跡報告。`,
            rule: '1a2b',
            ruleLabel: `${slotCount} 位數密碼`,
            slotCount,
            intro: '',
            perfect: '密碼一擊命中，迷霧中的異常被完整鎖定！',
            good: '推理完成，追跡成功。',
            rough: '勉強把紀錄追回來。',
            fail: '推理中斷，迷霧中的線索散掉了。',
            clue: `猜出 ${slotCount} 位不重複的數字密碼（1-9）。`
        });
    }

    canClaimDailyReward() {
        return this.data.daily.rewardDate !== this.dailyChallenge.dateKey;
    }

    getMaxStamina() {
        return this.data.maxStamina || 100;
    }

    getMinutesUntilStaminaReady() {
        if (this.data.stamina >= 10) return 0;
        return 10 - this.data.stamina;
    }

    getWeekInfo() {
        const now = new Date();
        const weekdayFormatter = new Intl.DateTimeFormat('zh-TW', {
            timeZone: 'Asia/Taipei',
            weekday: 'short'
        });
        const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Taipei',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const anchor = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
        const day = anchor.getDay();
        const mondayOffset = day === 0 ? -6 : 1 - day;
        const monday = new Date(anchor);
        monday.setDate(anchor.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        const todayKey = dayKeyFormatter.format(anchor);
        const days = Array.from({ length: 7 }, (_, index) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);
            const key = dayKeyFormatter.format(date);
            return {
                key,
                label: weekdayFormatter.format(date),
                dayNumber: key.slice(-2),
                isToday: key === todayKey
            };
        });
        return {
            cycleStart: days[0].key,
            todayKey,
            days
        };
    }

    syncWeeklyProgress() {
        const week = this.getWeekInfo();
        if (this.data.weekly.cycleStart !== week.cycleStart) {
            this.data.weekly = {
                cycleStart: week.cycleStart,
                stamps: [],
                rewardClaimed: false
            };
        } else {
            this.data.weekly.stamps = this.data.weekly.stamps.filter((stamp) => week.days.some((day) => day.key === stamp));
        }
        return week;
    }

    markWeeklyStamp(dateKey = this.getDateKey()) {
        const week = this.syncWeeklyProgress();
        if (week.days.some((day) => day.key === dateKey) && !this.data.weekly.stamps.includes(dateKey)) {
            this.data.weekly.stamps.push(dateKey);
            this.data.weekly.stamps.sort();
        }
        return week;
    }

    maybeClaimWeeklyReward() {
        const week = this.syncWeeklyProgress();
        if (this.data.weekly.stamps.length >= 7 && !this.data.weekly.rewardClaimed) {
            this.data.weekly.rewardClaimed = true;
            this.data.coins += 500;
            this.showMessage('本週全勤達成，額外獲得 500 英鎊');
            return true;
        }
        return false;
    }

    loadData() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                return this.normalizeData(JSON.parse(raw));
            }
        } catch (e) {
            console.error("Save corrupted, using default");
        }
        return this.getDefaultData();
    }

    refreshPersistentUI({ showToast = false } = {}) {
        this.updateGlobalUI();
        this.quests.check();
        this.renderMap();
        this.renderShop();
        this.renderHubDashboard();

        if (showToast) this.showSaveToast();
        requestAnimationFrame(() => this.updateLayoutMetrics());
    }

    applyExternalData(nextData, { showToast = false, notice = '' } = {}) {
        this.data = this.normalizeData(nextData);
        this.lastHighestLevel = this.data.highestLevel;
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        this.refreshPersistentUI({ showToast });
        if (notice) this.showMessage(notice);
    }

    saveData({ skipCloud = false, showToast = true } = {}) {
        this.data = this.getSerializableData(this.data);
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        this.updateGlobalUI();
        this.quests.check();
        this.renderHubDashboard();
        if (showToast) this.showSaveToast();

        if (!skipCloud && window.cloudSave?.queueSave) {
            window.cloudSave.queueSave(this.data);
        }
    }

    showSaveToast() {
        this.els.saveToast.classList.add('show');
        setTimeout(() => this.els.saveToast.classList.remove('show'), 2000);
    }

    setModalActive(modal, active) {
        if (!modal) return;
        if (active) modal.hidden = false;
        modal.classList.toggle('active', active);
        modal.setAttribute('aria-hidden', active ? 'false' : 'true');
        modal.inert = !active;

        // Hide back button when any modal is active
        if (this.els.btnGlobalBack) {
            this.els.btnGlobalBack.classList.toggle('hidden', active);
        }
        if (active) {
            requestAnimationFrame(() => {
                modal.scrollTop = 0;
                const panel = modal.querySelector('.modal-panel');
                if (panel) panel.scrollTop = 0;
            });
        }
        if (!active) modal.hidden = true;
    }

    closeResultModal() {
        this.setModalActive(this.els.modal, false);
        this.els.leaderboardBox?.classList.add('hidden');
    }

    openConfirmModal({
        title = '確認',
        description = '您確定要執行此操作？',
        cancelText = '取消',
        okText = '確定',
        okVariant = 'danger',
        onOk = null,
        onCancel = null
    } = {}) {
        this.pendingConfirmAction = onOk;
        this.pendingConfirmCancelAction = onCancel;
        this.els.confirmTitle.textContent = title;
        this.els.confirmDesc.textContent = description;
        this.els.btnConfirmCancel.textContent = cancelText;
        this.els.btnConfirmOk.textContent = okText;
        this.els.btnConfirmOk.className = `btn ${okVariant === 'danger' ? 'btn-primary' : 'btn-primary'}`;
        this.els.btnConfirmOk.style.background = okVariant === 'danger' ? 'var(--color-error)' : 'var(--color-secondary)';
        this.els.btnConfirmOk.style.borderColor = okVariant === 'danger' ? 'var(--color-error)' : 'var(--color-secondary)';
        this.setModalActive(this.els.confirmModal, true);
    }

    closeConfirmModal({ runCancel = false } = {}) {
        this.setModalActive(this.els.confirmModal, false);
        if (runCancel && this.pendingConfirmCancelAction) this.pendingConfirmCancelAction();
        this.pendingConfirmAction = null;
        this.pendingConfirmCancelAction = null;
    }

    openRetreatConfirm() {
        this.openConfirmModal({
            title: '確認',
            description: '確定要撤退嗎？這將不會退還已消耗的精力。',
            cancelText: '取消',
            okText: '確定撤退',
            okVariant: 'danger',
            onOk: () => {
                this.closeConfirmModal();
                this.clearCombatTimer();
                this.forceReturnHub();
            }
        });
    }

    showStaminaHelp(required = 10) {
        const missing = Math.max(0, required - this.data.stamina);
        const targetText = required >= 30 ? '怪獸追跡' : '故事案件';
        const description = `開始${targetText}需要 ${required} 點精力，你目前只有 ${this.data.stamina}/${this.getMaxStamina()}。\n每分鐘會自然恢復 1 點精力，或到商店花 60 英鎊購買事務所咖啡，立即恢復 30 點。\n每日推理不消耗精力；怪獸追跡會消耗 30 精力並累積分數。\n再補 ${missing} 點就能再次出發。`;
        this.openConfirmModal({
            title: '精力不足',
            description,
            cancelText: '稍後再說',
            okText: '前往商店',
            okVariant: 'primary',
            onOk: () => {
                this.closeConfirmModal();
                this.showLocation('shop');
            }
        });
    }

    requestFS() {
        const root = document.documentElement;
        const requestFullscreen = root.requestFullscreen
            || root.webkitRequestFullscreen
            || root.msRequestFullscreen;
        const fullscreenActive = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;

        if (requestFullscreen && !fullscreenActive) {
            Promise.resolve(requestFullscreen.call(root)).catch(() => console.log('Full screen locked'));
        }
    }

    setupCheats() {
        const secret = 'asdfghjklmn';
        let buffer = '';
        document.addEventListener('keydown', (e) => {
            // Avoid triggering when typing in inputs if any exist
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            buffer += e.key.toLowerCase();
            if (buffer.length > 30) buffer = buffer.slice(-secret.length);
            
            if (buffer.endsWith(secret)) {
                // Unlock All Coins
                this.data.coins = 999999;
                
                // Unlock All Monsters
                if (!this.data.monsters) this.data.monsters = { activeMonsterId: '', captured: {}, pendingUnlocks: {} };
                if (!this.data.monsters.captured) this.data.monsters.captured = {};
                
                const catalog = this.getMonsterCatalog();
                catalog.forEach(m => {
                    if (!this.data.monsters.captured[m.id]) {
                        this.data.monsters.captured[m.id] = {
                            level: 5,
                            capturedAt: Date.now()
                        };
                    } else {
                        this.data.monsters.captured[m.id].level = 5;
                    }
                });
                
                // Save and update UI
                this.saveData();
                this.updateGlobalUI();
                if (this.activeHubPanel === 'inventory') {
                    this.renderInventoryPanel();
                }
                
                this.showMessage('秘籍已啟動：全英鎊＋全使魔（Lv.5）解鎖！', 'success');
                if (window.audio) window.audio.playSuccess();
                buffer = '';
            }
        });
    }

    getShopItemCost(baseCost, itemId) {
        const lv = this.getShopItemLevel(itemId);
        // 500, 1000, 1500...
        return 500 * (lv + 1);
    }

    init() {
        this.updateGlobalUI();
        this.renderShop();
        this.renderPalette();
        this.renderHubDashboard();
        this.bindEvents();
        this.renderMap();
        
        document.querySelectorAll('.case-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.case-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCaseTab = btn.dataset.tab;
                if (window.audio) window.audio.playClick();
                this.renderMap();
            });
        });
        
        document.querySelectorAll('.inv-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.inv-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentInvTab = btn.dataset.invTab;
                if (window.audio) window.audio.playClick();
                this.renderInventoryPanel();
            });
        });

        this.quests.check();
        window.audio?.updateMuteButton?.();
        this.updateScene('hub');
        this.updateLayoutMetrics();
        this.startBootSequence();

        const syncLayout = () => this.updateLayoutMetrics();
        window.addEventListener('resize', syncLayout);
        window.addEventListener('orientationchange', syncLayout);
        window.addEventListener('load', syncLayout);
        window.visualViewport?.addEventListener('resize', syncLayout);
        window.visualViewport?.addEventListener('scroll', syncLayout);
        document.fonts?.ready.then(syncLayout);

        // Stamina auto-regen logic
        setInterval(() => {
            if (this.data.stamina < this.getMaxStamina()) {
                const elapsedMin = Math.floor((Date.now() - this.data.lastEnergyTime) / 60000);
                if (elapsedMin > 0) {
                    this.data.stamina = Math.min(this.getMaxStamina(), this.data.stamina + elapsedMin);
                    this.data.lastEnergyTime += elapsedMin * 60000;
                    this.saveData({ showToast: false });
                }
            } else {
                this.data.lastEnergyTime = Date.now();
            }
        }, 20000);
    }

    forceReturnHub(panel = 'home') {
        this.clearCombatTimer();
        this.dialogue.abort();
        this.setModalActive(this.els.missionModal, false);
        this.activeHubPanel = panel;
        this.playTransitionOverlay(() => {
            this.showLocation('hub');
            this.renderMap();
        });
    }

    enterStoryMap() {
        if (!this.currentUser) {
            this.data.settings.guestStarted = true;
        }
        this.requestFS();
        if (this.els.bootOverlay?.classList.contains('active')) {
            this.completeBootSequence();
        }
        this.showLocation('hub');
        this.showHubPanel('missions');
        this.renderMap();
    }

    updateLayoutMetrics() {
        const readMetric = (name, fallback) => {
            const current = parseFloat(getComputedStyle(this.els.appContainer).getPropertyValue(name));
            return Number.isFinite(current) && current > 0 ? current : fallback;
        };
        const viewportHeight = Math.round(window.visualViewport?.height || window.innerHeight || 0);
        const viewportOffsetTop = Math.max(0, Math.round(window.visualViewport?.offsetTop || 0));
        const runtimeSafeBottom = Math.max(
            0,
            Math.round((window.innerHeight || viewportHeight) - viewportHeight - viewportOffsetTop)
        );
        const globalHeaderHeight = this.els.globalHeader && !this.els.globalHeader.classList.contains('hidden')
            ? this.els.globalHeader.offsetHeight
            : readMetric('--global-header-height', 112);
        const gameHeaderHeight = this.els.gameHeader?.offsetHeight || readMetric('--game-header-height', 152);
        const inputConsoleHeight = Math.ceil(this.els.inputConsole?.getBoundingClientRect().height || 0);
        if (viewportHeight > 0) {
            this.els.appContainer.style.setProperty('--app-visible-height', `${viewportHeight}px`);
        }
        this.els.appContainer.style.setProperty('--runtime-safe-bottom', `${runtimeSafeBottom}px`);
        this.els.appContainer.style.setProperty('--input-console-height', `${inputConsoleHeight}px`);
        this.els.appContainer.style.setProperty('--global-header-height', `${globalHeaderHeight}px`);
        this.els.appContainer.style.setProperty('--game-header-height', `${gameHeaderHeight}px`);
    }

    resolveSceneForView(viewId) {
        if (viewId === 'shop') return 'shop';
        if (viewId === 'hub' && this.activeHubPanel === 'missions') return 'shop';
        if (viewId === 'game') {
            if (this.gameMode === 'endless') return 'puzzle';
            return this.currentLevel >= 30 ? 'final' : 'puzzle';
        }
        return 'hub';
    }

    updateScene(viewId = this.viewState) {
        this.els.appContainer.dataset.view = viewId;
        const scene = this.resolveSceneForView(viewId);
        this.particles.setScene(viewId);
        if (window.audio?.setScene) window.audio.setScene(scene);
        else if (window.audio?.setMusicMode) window.audio.setMusicMode(scene);
    }

    resetViewportScroll(viewId = this.viewState) {
        const root = document.scrollingElement || document.documentElement;
        if (root) {
            root.scrollTop = 0;
            root.scrollLeft = 0;
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

        const activeView = document.getElementById(`view-${viewId}`);
        if (activeView) {
            activeView.scrollTop = 0;
            activeView.scrollLeft = 0;
        }
    }

    showLocation(viewId) {
        if (viewId === 'map') {
            viewId = 'hub';
            this.activeHubPanel = 'missions';
        } else if (viewId === 'shop') {
            viewId = 'hub';
            this.activeHubPanel = 'shop';
        }
        if (this.viewState === 'game' && viewId !== 'game') this.clearCombatTimer();
        if (viewId !== 'game') this.els.viewGame?.classList.remove('endless-battle');
        this.previousView = this.viewState;
        const outgoing = document.querySelector('.view-section.active-view');
        const incoming = document.getElementById(`view-${viewId}`);
        if (!incoming) return;

        // Animate transition
        if (outgoing && outgoing !== incoming) {
            outgoing.classList.add('view-exit');
            incoming.classList.add('view-enter');
            incoming.classList.add('active-view');
            setTimeout(() => {
                outgoing.classList.remove('active-view', 'view-exit');
                incoming.classList.remove('view-enter');
            }, 350);
        } else {
            this.els.views.forEach(v => v.classList.remove('active-view'));
            incoming.classList.add('active-view');
        }

        this.viewState = viewId;
        this.updateScene(viewId);

        if (this.els.btnGlobalBack) {
            this.els.btnGlobalBack.textContent = viewId === 'game' ? '◀ 撤退' : '◀ 返回事務所';
        }

        if (viewId === 'hub') {
            this.renderHubDashboard();
        } else if (viewId === 'game') {
            this.els.globalHeader.classList.remove('hidden');
            this.els.headerTitle.textContent = '調查中';
        }

        if (viewId === 'hub') {
            this.quests.check();
        } else {
            this.els.questWidget.classList.remove('show');
        }

        requestAnimationFrame(() => this.updateLayoutMetrics());
        requestAnimationFrame(() => this.resetViewportScroll(viewId));
    }

    updateGlobalUI() {
        this.els.globalCoins.textContent = this.data.coins;
        this.els.globalStamina.textContent = this.data.stamina;

        if (!this.els.hubTip || !this.els.hubTipText) return;

        if (this.data.stamina < 10) {
            const missing = 10 - this.data.stamina;
            this.els.hubTipText.textContent = `故事案件需要 10 精力。你目前 ${this.data.stamina}/${this.getMaxStamina()}，還差 ${missing} 點；約 ${this.getMinutesUntilStaminaReady()} 分鐘後可自然回到可出發狀態，也可去商店買咖啡立即回復 30 點。每日推理不耗精力，怪獸追跡需要 30 精力。`;
            this.els.hubTip.classList.remove('hidden');
        } else {
            this.els.hubTip.classList.add('hidden');
        }
    }

    getStoryRewardBase(level) {
        const arcIndex = level?.storyArcIndex || 0;
        // Chapter 1: 100, Chapter 2: 200, Chapter 3: 400...
        return 100 * Math.pow(2, arcIndex);
    }

    getRewardRangeText(level = null) {
        const base = this.getStoryRewardBase(level);
        const rewards = [1, 2, 3].map(stars => base * stars);
        return `${Math.min(...rewards)}-${Math.max(...rewards)} 英鎊`;
    }

    getStoryArchiveGroups() {
        const arcs = new Map();
        this.levels.forEach((level) => {
            if (!arcs.has(level.storyArcKey)) {
                arcs.set(level.storyArcKey, {
                    key: level.storyArcKey,
                    title: level.storyArcTitle,
                    act: level.storyArcAct,
                    summary: level.storyArcSummary,
                    intro: level.storyArcIntro,
                    finale: level.storyArcFinale,
                    index: level.storyArcIndex,
                    chapters: new Map(),
                    levels: []
                });
            }
            const arc = arcs.get(level.storyArcKey);
            arc.levels.push(level);
            if (!arc.chapters.has(level.chapterKey)) {
                arc.chapters.set(level.chapterKey, {
                    key: level.chapterKey,
                    title: level.chapter,
                    summary: level.chapterSummary,
                    intro: level.chapterIntro,
                    locale: level.chapterLocale,
                    slotCount: level.slotCount,
                    index: level.chapterIndex,
                    levels: []
                });
            }
            arc.chapters.get(level.chapterKey).levels.push(level);
        });

        return [...arcs.values()]
            .sort((left, right) => left.index - right.index)
            .map((arc) => ({
                ...arc,
                chapters: [...arc.chapters.values()].sort((left, right) => left.index - right.index)
            }));
    }

    getStoryArcProgress(arc) {
        const visibleLevels = arc.levels.filter((level) => level.id <= this.data.highestLevel);
        const clearedLevels = arc.levels.filter((level) => (this.data.levelStars[level.id] || 0) > 0);
        const perfectLevels = arc.levels.filter((level) => (this.data.levelStars[level.id] || 0) === 3);
        return {
            unlocked: visibleLevels.length,
            cleared: clearedLevels.length,
            perfect: perfectLevels.length,
            total: arc.levels.length
        };
    }

    getStoryChapterProgress(chapter) {
        const visibleLevels = chapter.levels.filter((level) => level.id <= this.data.highestLevel);
        const clearedLevels = chapter.levels.filter((level) => (this.data.levelStars[level.id] || 0) > 0);
        const perfectLevels = chapter.levels.filter((level) => (this.data.levelStars[level.id] || 0) === 3);
        const nextPlayable = visibleLevels.find((level) => level.id === this.data.highestLevel)
            || visibleLevels.find((level) => (this.data.levelStars[level.id] || 0) === 0)
            || visibleLevels[visibleLevels.length - 1]
            || null;
        return {
            unlocked: visibleLevels.length,
            cleared: clearedLevels.length,
            perfect: perfectLevels.length,
            total: chapter.levels.length,
            nextPlayable
        };
    }

    toggleStoryArc(arcKey) {
        if (!this.storyArchiveState?.openArcs) this.storyArchiveState = { openArcs: new Set() };
        if (this.storyArchiveState.openArcs.has(arcKey)) this.storyArchiveState.openArcs.delete(arcKey);
        else this.storyArchiveState.openArcs.add(arcKey);
        this.renderMap();
    }

    getLevelStatus(level, stars) {
        if (level.id === this.data.highestLevel) return { text: '最新案件', className: 'is-live' };
        if (stars >= 3) return { text: '完美封存', className: 'is-perfect' };
        if (stars > 0) return { text: '已評級', className: 'is-cleared' };
        return { text: '待補評級', className: 'is-ready' };
    }

    getLevelCardMarkup(level, stars) {
        const status = this.getLevelStatus(level, stars);
        const chapterStep = level.chapterOrder || 1;

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
            <h3>案件 #${level.id.toString().padStart(2, '0')}：${level.title}</h3>
            <p class="level-client">案件來源｜${level.client}</p>
            <p class="level-rule">${level.request}<br>${level.clue}</p>
            <p class="level-meta">${status.text}｜章節 ${chapterStep}/10｜報酬 ${this.getRewardRangeText(level)}</p>
            <div class="level-stars">
                ${[1, 2, 3].map(i => `<img src="assets/icons/star.png" class="${i <= stars ? 'earned' : ''}" alt="評級星星">`).join('')}
            </div>
        `;
    }

    getShopItemLevel(itemId) {
        return (this.data.upgrades.shopLevels?.[itemId]) || 0;
    }


    getShopInventory() {
        const staminaLevel = this.getShopItemLevel('staminaPack');
        const manaUpLevel = this.getShopItemLevel('manaUp');
        const manaUpHLevel = this.getShopItemLevel('manaUpH');
        const maxStaminaUpLevel = this.getShopItemLevel('maxStaminaUp');
        return [
            {
                id: 'maxStaminaUp',
                icon: '<img src="assets/icons/shop_training.png" alt="體能訓練">',
                name: '體能訓練',
                desc: '永久增加精力上限 +30',
                cost: this.getShopItemCost(1000, 'maxStaminaUp'),
                repeat: true,
                maxLevel: 10,
                currentLevel: maxStaminaUpLevel,
                category: '屬性',
                tier: `能力提升｜Lv.${maxStaminaUpLevel + 1}`,
                accent: 'premium',
                disabled: () => maxStaminaUpLevel >= 10,
                effectText: () => maxStaminaUpLevel >= 10 ? '已達最高等級' : `精力上限 ${this.getMaxStamina()} → ${this.getMaxStamina() + 30}`,
                statusText: () => maxStaminaUpLevel >= 10 ? '已達最高等級' : '可重複鍛鍊',
                action: () => {
                    this.data.maxStamina = this.getMaxStamina() + 30;
                    if (!this.data.upgrades.shopLevels) this.data.upgrades.shopLevels = {};
                    this.data.upgrades.shopLevels['maxStaminaUp'] = (this.data.upgrades.shopLevels['maxStaminaUp'] || 0) + 1;
                }
            },
            {
                id: 'staminaPack',
                icon: '<img src="assets/icons/shop_coffee.png" alt="事務所咖啡">',
                name: '事務所咖啡',
                desc: `立即恢復 30 點精力（目前 ${this.data.stamina}/${this.getMaxStamina()}）`,
                cost: 60,
                repeat: true,
                maxLevel: Infinity,
                currentLevel: 0,
                category: '補給品',
                tier: '即時回復｜一次性消耗品',
                accent: 'supply',
                disabled: () => this.data.stamina >= this.getMaxStamina(),
                effectText: () => `精力 ${this.data.stamina} → ${Math.min(this.getMaxStamina(), this.data.stamina + 30)}`,
                statusText: () => this.data.stamina >= this.getMaxStamina() ? '目前已滿體' : `還可補 ${this.getMaxStamina() - this.data.stamina} 點`,
                action: () => {
                    this.data.stamina = Math.min(this.getMaxStamina(), this.data.stamina + 30);
                }
            },
            {
                id: 'manaUp',
                icon: '<img src="assets/icons/shop_desk.png" alt="偵探桌擴容">',
                name: '偵探桌擴容',
                desc: '最大推理力上限 +20',
                cost: this.getShopItemCost(450, 'manaUp'),
                repeat: true,
                maxLevel: 10,
                currentLevel: manaUpLevel,
                category: '設備',
                tier: `常規升級｜Lv.${manaUpLevel + 1}`,
                accent: 'upgrade',
                disabled: () => manaUpLevel >= 10,
                effectText: () => manaUpLevel >= 10 ? '已達最高等級' : `推理力上限 ${this.data.maxMana} → ${this.data.maxMana + 20}`,
                statusText: () => manaUpLevel >= 10 ? '已達最高等級' : '可重複交涉',
                action: () => {
                    this.data.maxMana += 20;
                    if (!this.data.upgrades.shopLevels) this.data.upgrades.shopLevels = {};
                    this.data.upgrades.shopLevels['manaUp'] = (this.data.upgrades.shopLevels['manaUp'] || 0) + 1;
                }
            },
            {
                id: 'manaUpH',
                icon: '<img src="assets/icons/shop_desk_premium.png" alt="頂級偵探桌組">',
                name: '頂級偵探桌組',
                desc: '最大推理力上限 +50',
                cost: this.getShopItemCost(1050, 'manaUpH'),
                repeat: true,
                maxLevel: 10,
                currentLevel: manaUpHLevel,
                category: '設備',
                tier: `高階套組｜Lv.${manaUpHLevel + 1}`,
                accent: 'premium',
                disabled: () => manaUpHLevel >= 10,
                effectText: () => manaUpHLevel >= 10 ? '已達最高等級' : `推理力上限 ${this.data.maxMana} → ${this.data.maxMana + 50}`,
                statusText: () => manaUpHLevel >= 10 ? '已達最高等級' : '適合中後段高壓案件',
                action: () => {
                    this.data.maxMana += 50;
                    if (!this.data.upgrades.shopLevels) this.data.upgrades.shopLevels = {};
                    this.data.upgrades.shopLevels['manaUpH'] = (this.data.upgrades.shopLevels['manaUpH'] || 0) + 1;
                }
            }
        ];
    }

    getResultTitle(stars = 0) {
        if (this.gameMode === 'daily') return '每日推理完成';
        if (this.gameState.hintPenalty) return '線索保送';
        if (stars >= 3) return '完美推理';
        if (stars === 2) return '穩定結案';
        if (stars === 1) return '勉強破案';
        return '案件結算';
    }

    getResultTopline(success, levelData = null) {
        if (!success) return this.gameMode === 'endless' ? '怪獸追跡結算' : '偵查失敗報告';
        if (this.gameMode === 'daily') return '每日推理結算';
        if (this.gameMode === 'endless') return '怪獸追跡結算';
        if (levelData) return `${levelData.chapter}｜案件評級`;
        return '案件評級';
    }

    getResultStats({ success, stars = 0, levelData = null }) {
        if (this.gameMode === 'endless') {
            return [
                { label: '追蹤目標', value: `${this.gameState.defeated || 0} 隻` },
                { label: '本場得分', value: `${this.gameState.score || 0}`, accent: 'accent' },
                { label: '獲得英鎊', value: `+${this.gameState.scoreCoins || 0}` },
                { label: '最佳紀錄', value: `${this.data.stats.endlessBestScore || 0} 分` }
            ];
        }

        if (this.gameMode === 'daily') {
            if (success) {
                return [
                    { label: '挑戰回合', value: `${this.gameState.turn} 回` },
                    { label: '剩餘推理力', value: `${this.gameState.mana}` },
                    { label: '今日獎勵', value: this.gameState.weeklyRewardGranted ? '每日 500 + 週結算 500' : this.gameState.dailyRewardGranted ? '500 英鎊已入帳' : '今日已領過，不再重複發放', accent: (this.gameState.dailyRewardGranted || this.gameState.weeklyRewardGranted) ? 'accent' : '' },
                    { label: '規格重點', value: levelData ? levelData.ruleLabel : '每日校準' }
                ];
            }
            return [
                { label: '今日題目', value: levelData ? levelData.title : '每日推理' },
                { label: '停止原因', value: '推理力耗盡', accent: 'danger' },
                { label: '挑戰特性', value: '不限次數，可立即重試' },
                { label: '規格提示', value: levelData ? levelData.clue : '依規格重整排列後再試' }
            ];
        }

        if (success) {
            return [
                { label: '嘗試次數', value: `${this.gameState.turn} 回` },
                { label: '剩餘推理力', value: `${this.gameState.mana}` },
                { label: '密碼規格', value: levelData ? levelData.ruleLabel : `${this.gameState.slotCount} 格案件` },
                { label: '事務所註記', value: this.gameState.hintPenalty ? '線索介入完成' : stars >= 3 ? '近乎滿分' : stars === 2 ? '穩定結案' : '低空過線', accent: this.gameState.hintPenalty ? 'warning' : stars >= 3 ? 'accent' : '' }
            ];
        }

        return [
            { label: this.gameMode === 'endless' ? '完成筆數' : '已投入回合', value: this.gameMode === 'endless' ? `${Math.max(0, this.gameState.orderCount - 1)} 筆` : `${this.gameState.turn} 回` },
            { label: '停止原因', value: '推理力耗盡', accent: 'danger' },
            { label: '密碼規格', value: levelData ? levelData.ruleLabel : `${this.gameState.slotCount} 格案件` },
            { label: '修正提示', value: levelData ? levelData.clue : '先補精力與裝備，再重新出發' }
        ];
    }

    getResultNextText(success, levelData = null) {
        if (this.gameMode === 'daily') {
            if (!success) return '每日推理不限次數，可立刻重新整理節奏再試一次。';
            return this.gameState.weeklyRewardGranted
                ? '今日首通與本週七日結算都已完成，仍可重複挑戰練習。'
                : this.gameState.dailyRewardGranted
                    ? '今日首通獎勵已封存，仍可重複挑戰練習。'
                    : '今天的正式獎勵已領取過，仍可反覆挑戰今天的校準題。';
        }
        if (this.gameMode === 'endless') {
            if (success && (this.gameState?.orderCount || 0) >= 10) {
                return '本輪 10/10 追跡已完成，回到事務所可再次開啟新一輪追跡。';
            }
            return success ? '下一隻追蹤目標正在進入視野。' : '回到事務所後可以調整人物與稱號，再重新挑戰怪獸追跡。';
        }

        if (!success) {
            return levelData ? `建議重新對照規格：「${levelData.clue}」` : '先穩住節奏，再重新接單。';
        }

        const nextLevel = levelData ? this.levels.find(lv => lv.id === levelData.id + 1) : null;
        if (nextLevel) return `下一件案件：${nextLevel.title}｜${nextLevel.slotCount} 格｜${nextLevel.ruleLabel}`;
        if (this.data.highestLevel > this.levels.length) return '所有正式案件皆已結案，怪獸追跡權限已開啟。';
        return '本段案件已結案，請回事務所等待下一份指派。';
    }

    showResultModal({
        success = true,
        title = '案件結算',
        desc = '',
        story = '',
        stars = 0,
        reward = 0,
        actionText = '確認',
        levelData = null,
        leaderboardText = ''
    } = {}) {
        this.els.resultPanel.dataset.result = success ? 'success' : 'failure';
        this.els.modalTopline.textContent = this.getResultTopline(success, levelData);
        this.els.modalTitle.textContent = title;
        this.els.modalTitle.className = success ? '' : 'error-title';
        this.els.modalDesc.textContent = desc;
        this.els.modalStory.textContent = story;
        this.els.modalStars.innerHTML = stars > 0
            ? [1, 2, 3].map(i => `<img src="assets/icons/star.png" class="${i <= stars ? 'earned' : ''}">`).join('')
            : '';
        this.els.modalStats.innerHTML = this.getResultStats({ success, stars, levelData })
            .map(stat => `
                <div class="result-stat ${stat.accent ? `is-${stat.accent}` : ''}">
                    <span>${stat.label}</span>
                    <strong>${stat.value}</strong>
                </div>
            `).join('');
        this.els.modalCoinReward.textContent = reward > 0 ? `+${reward}` : '本次無額外英鎊';
        this.els.modalNext.textContent = this.getResultNextText(success, levelData);
        this.els.modalNext.classList.remove('hidden');
        this.els.btnModalAction.textContent = actionText;

        if (leaderboardText) {
            this.els.leaderboardBox.classList.remove('hidden');
            this.els.leaderboardBox.textContent = leaderboardText;
        } else {
            this.els.leaderboardBox.classList.add('hidden');
        }

        this.setModalActive(this.els.modal, true);
    }

    startBootSequence() {
        if (!this.els.bootOverlay) return;

        this.bootFinished = false;
        this.bootTimers.forEach(timer => clearTimeout(timer));
        this.bootTimers = [];
        const statusFrames = [
            '正在審閱案件檔案...',
            '正在比對指紋資料庫...',
            '正在啟動推理引擎...'
        ];

        this.els.bootOverlay.classList.add('active');
        if (this.els.bootLoader) this.els.bootLoader.classList.remove('hidden');
        if (this.els.bootStatus) this.els.bootStatus.textContent = statusFrames[0];

        statusFrames.slice(1).forEach((text, index) => {
            this.bootTimers.push(setTimeout(() => {
                if (this.els.bootStatus) this.els.bootStatus.textContent = text;
            }, 420 + index * 420));
        });

        this.bootTimers.push(setTimeout(() => {
            this.completeBootSequence();
        }, 1300));
    }

    completeBootSequence() {
        if (this.bootFinished || !this.els.bootOverlay) return;
        this.bootFinished = true;
        this.bootTimers.forEach(timer => clearTimeout(timer));
        this.bootTimers = [];
        this.els.bootOverlay.classList.remove('active');
        if (this.els.bootLoader) this.els.bootLoader.classList.add('hidden');
        if (this.els.authCard) this.els.authCard.classList.remove('hidden');
        this.data.settings.bootSeen = true;
        this.saveData({ showToast: false });
    }

    onAuthChanged(user) {
        this.currentUser = user || null;
        this.renderHomeSaveNote();
        this.renderSettingsPanel();
        this.refreshHubGuide({ panelId: this.activeHubPanel });
    }

    enterHub() {
        this.activeHubPanel = 'home';
        this.sessionStarted = true;
        this.data.settings.guestStarted = true;
        this.dialogue?.abort?.();
        this.els.greetingOverlay?.classList.remove('active');
        // Play transition overlay
        this.playTransitionOverlay(() => {
            this.showLocation('hub');
            this.refreshHubGuide({ rerollCharacter: true, panelId: this.activeHubPanel });
            this.saveData({ showToast: false });
        });
    }

    playTransitionOverlay(callback, type = 'default', duration = 800) {
        let overlay = document.getElementById('transition-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'transition-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.className = '';
        if (type !== 'default') overlay.classList.add(`type-${type}`);
        
        overlay.classList.remove('transition-out');
        overlay.classList.add('transition-in');
        if (type === 'paper') overlay.classList.add('paper-flip-in');
        if (type === 'fog') overlay.classList.add('fog-sweep-in');

        setTimeout(() => {
            if (callback) callback();
            overlay.classList.remove('transition-in', 'paper-flip-in', 'fog-sweep-in');
            overlay.classList.add('transition-out');
            setTimeout(() => {
                overlay.classList.remove('transition-out');
            }, duration);
        }, duration / 2);
    }

    triggerHaptic(type = 'light') {
        if (!navigator.vibrate) return;
        try {
            switch (type) {
                case 'light': navigator.vibrate(15); break;
                case 'medium': navigator.vibrate(35); break;
                case 'heavy': navigator.vibrate([50, 30, 50]); break;
                case 'success': navigator.vibrate([100, 50, 100]); break;
            }
        } catch (e) { /* Haptics might fail on some browsers */ }
    }

    showHubPanel(panelId = 'home') {
        const target = ['home', 'missions', 'daily', 'inventory', 'settings', 'shop'].includes(panelId) ? panelId : 'home';
        const previousPanel = this.activeHubPanel;
        this.activeHubPanel = target;
        const hubNavButtons = this.els.hubBottomNav ? this.els.hubBottomNav.querySelectorAll('.hub-nav-btn') : [];

        const hubEl = document.querySelector('#view-hub .hub-content');
        if (hubEl) {
            hubEl.dataset.activePanel = target;
        }

        if (target === 'home') {
            this.els.globalHeader.classList.remove('hidden');
            this.els.headerTitle.textContent = '偵探事務所';
        } else {
            this.els.globalHeader.classList.remove('hidden');
            const titles = { shop: '商店', missions: '卷宗', daily: '每日', inventory: '使魔與人物', settings: '設定' };
            this.els.headerTitle.textContent = titles[target] || '偵探事務所';
        }

        // Animate panel transition
        const outgoingPanel = previousPanel !== target ? document.querySelector(`.hub-panel[data-panel="${previousPanel}"]`) : null;
        const incomingPanel = document.querySelector(`.hub-panel[data-panel="${target}"]`);

        this.els.hubPanels.forEach(panel => {
            if (panel !== outgoingPanel && panel !== incomingPanel) {
                panel.classList.remove('active', 'panel-exit', 'panel-enter');
            }
        });

        if (outgoingPanel && incomingPanel && outgoingPanel !== incomingPanel) {
            outgoingPanel.classList.add('panel-exit');
            incomingPanel.classList.remove('active');
            incomingPanel.classList.add('panel-enter', 'active');
            setTimeout(() => {
                outgoingPanel.classList.remove('active', 'panel-exit');
                incomingPanel.classList.remove('panel-enter');
            }, 300);
        } else {
            this.els.hubPanels.forEach(panel => {
                panel.classList.toggle('active', panel.dataset.panel === target);
            });
        }

        hubNavButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.hubTarget === target);
        });

        const hubContent = document.querySelector('#view-hub .hub-content');
        if (hubContent) {
            hubContent.scrollTop = 0;
        }

        if (this.els.btnHubHome) {
            this.els.btnHubHome.classList.toggle('hidden', target === 'home');
        }

        if (target === 'shop') {
            this.renderShop();
        }

        this.updateScene('hub');
        this.refreshHubGuide({ panelId: target });
    }

    renderHubCast() {
        // Cast grid removed from story panel; no longer needed
    }

    renderStoryFeed() {
        // Story feed removed from story panel; no longer needed
    }

    renderDailyPanel() {
        if (!this.els.dailyTitle) return;
        const dc = this.dailyChallenge;
        this.els.dailyTitle.textContent = `${dc.title}｜${dc.slotCount} 格`;
        this.els.dailyDesc.textContent = `${this.dailyChallenge.clue} 每次挑戰消耗 5 精力，過關獲得 10 英鎊。`;
        this.els.dailyRuleLabel.textContent = `${this.dailyChallenge.ruleLabel}｜${this.dailyChallenge.dateKey}`;
        this.els.dailyRewardStatus.textContent = `每次過關 10 英鎊｜追跡最佳 ${this.data.stats.endlessBestScore || 0} 分`;
    }

    renderWeeklyCalendar() {
        if (!this.els.weeklyCalendar) return;

        const week = this.syncWeeklyProgress();
        const stampSet = new Set(this.data.weekly.stamps);
        const claimed = this.data.weekly.rewardClaimed;

        this.els.weeklyCalendar.innerHTML = week.days.map((day, index) => `
            <div class="weekly-day ${stampSet.has(day.key) ? 'stamped' : ''} ${day.isToday ? 'today' : ''}">
                <span class="weekly-day-label">Day ${index + 1}</span>
                <strong>${day.label}</strong>
                <small>${day.dayNumber}</small>
                <em>${stampSet.has(day.key) ? '已蓋章' : '待完成'}</em>
            </div>
        `).join('');

        if (this.els.weeklyProgressText) {
            this.els.weeklyProgressText.textContent = `${this.data.weekly.stamps.length} / 7`;
        }
        if (this.els.weeklyRewardText) {
            if (claimed) {
                this.els.weeklyRewardText.textContent = '本週 500 英鎊全勤獎勵已結算完成。';
            } else if (this.data.weekly.stamps.length >= 7) {
                this.els.weeklyRewardText.textContent = '本週七日蓋章已完成，500 英鎊將於本次結算自動發放。';
            } else {
                this.els.weeklyRewardText.textContent = `再完成 ${7 - this.data.weekly.stamps.length} 天每日推理蓋章，可額外獲得 500 英鎊。`;
            }
        }
    }


    renderInventoryPanel() {
        if (!this.els.inventoryGrid) return;
        const selectedCharacter = this.getPlayableCharacter();
        const selectedStage = this.getPlayerStage(selectedCharacter);
        const activeTitle = this.getActiveTitle();
        const activeTitleLevel = this.getActiveTitleLevel();
        const currentMonsterTab = ['familiar', 'monsters'].includes(this.inventorySubtab) ? this.inventorySubtab : 'familiar';
        const monsters = this.getMonsterCatalog();
        const capturedMonsters = monsters.filter((monster) => this.isMonsterCaptured(monster.id));
        const activeMonster = this.getActiveMonster();
        const unlockedTitles = new Set(this.data.player.unlockedTitles);
        const unlockedTitleCount = [...unlockedTitles].length;

        const statItems = [
            {
                label: '偵探階段',
                title: selectedStage.label,
                text: `${selectedCharacter.name}｜${selectedCharacter.role}`
            },
            {
                label: '精力儲量',
                title: `${this.data.stamina}/${this.getMaxStamina()}`,
                text: this.data.stamina >= 30 ? '故事與追跡都能立刻出發。' : `追跡需要 30 精力，目前還差 ${Math.max(0, 30 - this.data.stamina)} 點。`
            },
            {
                label: '推理力上限',
                title: `${this.data.maxMana}`,
                text: '推理力越高，容錯與可嘗試次數就越多。'
            },
            {
                label: '當前稱號',
                title: `${activeTitle.name} Lv.${activeTitleLevel}`,
                text: activeTitle.levelDesc ? activeTitle.levelDesc(activeTitleLevel) : activeTitle.desc
            }
        ];

        const statCards = statItems.map((item) => `
            <article class="inventory-card">
                <span class="inventory-label">${item.label}</span>
                <div class="inventory-meta">
                    <h3 class="inventory-value">${item.title}</h3>
                    <p>${item.text}</p>
                </div>
            </article>
        `).join('');

        const titlePanel = `
            <article class="inventory-card title-stat-card" data-open-title-page="true" data-title-target-tab="equip">
                <span class="inventory-label">目前裝備</span>
                <div class="inventory-meta">
                    <h3 class="inventory-value">${activeTitle.name} Lv.${activeTitleLevel}</h3>
                    <p>${activeTitle.levelDesc ? activeTitle.levelDesc(activeTitleLevel) : activeTitle.desc}</p>
                </div>
                <span class="title-tap-hint">查看全部稱號與切換 ▶</span>
            </article>
            <article class="inventory-card title-stat-card" data-open-title-page="true" data-title-target-tab="upgrade">
                <span class="inventory-label">稱號升級</span>
                <div class="inventory-meta">
                    <h3 class="inventory-value">${activeTitle.name}｜${this.getTitleUpgradeCost(activeTitle.id) === Infinity ? '已滿級' : `下階 ${this.getTitleUpgradeCost(activeTitle.id)} 英鎊`}</h3>
                    <p>已獲得 ${unlockedTitleCount} 個稱號。點擊後可一次查看所有稱號並升級。</p>
                </div>
                <span class="title-tap-hint">前往升級頁 ▶</span>
            </article>
        `;

        const monsterThumbs = monsters.map((monster) => {
            const captured = this.isMonsterCaptured(monster.id);
            const level = this.getMonsterLevel(monster.id);
            const isActive = activeMonster?.id === monster.id;
            return `
                <button
                    class="monster-thumb ${captured ? 'captured' : 'locked'} ${isActive ? 'active' : ''} ${captured && level >= 5 ? 'is-awakened' : ''}"
                    ${captured ? `data-open-monster="${monster.id}"` : 'data-locked-monster="true"'}
                >
                    <div class="monster-thumb-art">
                        <img src="${monster.image}" alt="${captured ? monster.name : '未解鎖怪獸'}">
                    </div>
                    <div class="monster-thumb-meta">
                        <strong>${captured ? monster.name : '未解鎖'}</strong>
                        <span>${captured ? `Lv.${level}/${monster.maxLevel || 5}` : '抽到線索後可花英鎊解鎖'}</span>
                    </div>
                </button>
            `;
        }).join('');

        const activeMonsterSummary = activeMonster
            ? `
                <article class="inventory-card monster-summary-card active ${activeMonster.level >= 5 ? 'is-awakened' : ''}">
                    <span class="inventory-label">同行使魔</span>
                    <div class="monster-summary-shell">
                        <img src="${activeMonster.image}" alt="${activeMonster.name}">
                        <div class="inventory-meta">
                            <h3>${activeMonster.name}｜${activeMonster.passive}</h3>
                            <p>${activeMonster.effectSummary}</p>
                        </div>
                    </div>
                    <div class="monster-summary-actions">
                        <button class="menu-btn secondary-btn" data-open-monster="${activeMonster.id}">查看詳情</button>
                    </div>
                </article>
            `
            : `
                <article class="inventory-card monster-summary-card">
                    <span class="inventory-label">同行使魔</span>
                    <div class="inventory-meta">
                        <h3>尚未配置使魔</h3>
                        <p>在怪獸追跡中擊敗目標後可立即收服。已收服的怪獸可花費英鎊強化，並為故事、每日或追跡提供不同效果。</p>
                    </div>
                </article>
            `;

        const familiarRoster = capturedMonsters.length
            ? `
                <div class="familiar-chip-grid">
                    ${capturedMonsters.map((monster) => {
                        const level = this.getMonsterLevel(monster.id);
                        const isActive = activeMonster?.id === monster.id;
                        return `
                            <button class="familiar-chip ${isActive ? 'active' : ''} ${level >= 5 ? 'is-awakened' : ''}" data-open-monster="${monster.id}">
                                <img src="${monster.image}" alt="${monster.name}">
                                <div>
                                    <strong>${monster.name}</strong>
                                    <span>Lv.${level}</span>
                                </div>
                            </button>
                        `;
                    }).join('')}
                </div>
            `
            : '<div class="inventory-note-card">還沒有收服怪獸。先去怪獸追跡，成功鎖定目標後就能帶回事務所。</div>';

        const showCharacterThumb = this.currentInvTab === 'character';
        this.els.inventoryGrid.innerHTML = `
            <div class="${showCharacterThumb ? 'inv-split-layout' : 'inv-single-layout'}">
                ${showCharacterThumb ? `
                    <div class="inv-left" data-open-character-select="true">
                        <img src="${selectedStage.image}" alt="${selectedCharacter.name}" class="inv-character-img">
                        <span class="inv-char-tap-hint">點擊切換角色</span>
                    </div>
                ` : ''}
                <div class="inv-right">
                    ${this.currentInvTab === 'character' ? statCards : this.currentInvTab === 'titles' ? titlePanel : `
                        <article class="inventory-card">
                            <span class="inventory-label">怪獸紀錄</span>
                            <div class="inventory-meta">
                                <h3 class="inventory-value">${capturedMonsters.length}/${monsters.length}</h3>
                                <p>每輪追跡共有 10 關，每關有機率抽到怪獸線索；重複線索會自動轉為 3000 英鎊。</p>
                            </div>
                        </article>
                    `}
                </div>
            </div>
            <section class="inventory-tab-panel ${this.currentInvTab === 'character' ? 'active' : 'hidden'}" data-tab-panel="character">
                <div class="inventory-note-card">角色、稱號與基礎能力都集中在這裡。稱號可進一步提高故事推理、每日推理與追跡表現。</div>
            </section>
            <section class="inventory-tab-panel ${this.currentInvTab === 'titles' ? 'active' : 'hidden'}" data-tab-panel="titles">
                <div class="inventory-note-card">稱號管理統一在同一頁：查看全部稱號、目前裝備、已獲得進度，並可直接升級。</div>
            </section>
            <section class="inventory-tab-panel ${this.currentInvTab === 'monsters' ? 'active' : 'hidden'}" data-tab-panel="monsters">
                <div class="inventory-subtabs">
                    <button class="inventory-subtab ${currentMonsterTab === 'familiar' ? 'active' : ''}" data-switch-inventory-tab="familiar">使魔</button>
                    <button class="inventory-subtab ${currentMonsterTab === 'monsters' ? 'active' : ''}" data-switch-inventory-tab="monsters">怪獸圖鑑</button>
                </div>
                <div class="${currentMonsterTab === 'familiar' ? '' : 'hidden'}" data-tab-panel="familiar">
                    ${activeMonsterSummary}
                    <div class="inventory-section-head compact">
                        <span class="inventory-label icon-pill"><img src="assets/icons/ui_monster_codex.png" alt="同行使魔"> 已收服使魔</span>
                        <strong>點縮圖查看能力、強化與同行設定</strong>
                    </div>
                    ${familiarRoster}
                </div>
                <div class="${currentMonsterTab === 'monsters' ? '' : 'hidden'}" data-tab-panel="monsterCodex">
                    <div class="inventory-section-head compact">
                        <span class="inventory-label icon-pill"><img src="assets/icons/ui_monster_codex.png" alt="怪獸卷宗"> 怪獸圖鑑</span>
                        <strong>未解鎖前會維持模糊，收服後才可查看詳情。</strong>
                    </div>
                    <div class="monster-thumb-grid">${monsterThumbs}</div>
                </div>
            </section>
        `;
    }

    openCharacterSelectModal() {
        const characters = this.getPlayableCharacters();
        const cards = characters.map((character) => {
            const stage = this.getPlayerStage(character);
            const isSelected = character.id === this.data.player.selectedCharacter;
            return `
                <div class="char-select-option ${isSelected ? 'selected' : ''}" data-pick-character="${character.id}">
                    <img src="${stage.image}" alt="${character.name}">
                    <strong>${character.name}</strong>
                    <span>${character.gender}｜${stage.label}</span>
                    ${isSelected ? '<em>使用中</em>' : ''}
                </div>
            `;
        }).join('');

        this.els.characterModalDesc.innerHTML = `<div class="char-select-grid">${cards}</div>`;
        this.setModalActive(this.els.characterModal, true);

        // Bind character selection
        this.els.characterModalDesc.querySelectorAll('[data-pick-character]').forEach(el => {
            el.addEventListener('click', () => {
                if (window.audio) window.audio.playClick();
                this.selectPlayableCharacter(el.dataset.pickCharacter);
                this.setModalActive(this.els.characterModal, false);
            });
        });
    }

    openTitleUpgradePage(initialTab = 'equip') {
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
                const currentLevel = this.getStoryProgressLevel() || (this.levels && this.levels.length > 0 ? this.levels[this.levels.length - 1] : null);
                if (!currentLevel) return;

                const currentArc = arcs.find((arc) => arc.key === currentLevel.storyArcKey) || arcs[0];
                if (!currentArc) return;

                const arcProgress = this.getStoryArcProgress(currentArc);
            });
        });
        this.els.titleModalDesc.querySelectorAll('[data-title-upgrade]').forEach(el => {
            el.addEventListener('click', () => {
                if (window.audio) window.audio.playClick();
                this.upgradeTitleLevel(el.dataset.titleUpgrade);
            });
        });
    }

    upgradeTitleLevel(titleId) {
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
    }

    selectPlayableCharacter(characterId) {
        if (!this.getPlayableCharacters().some((character) => character.id === characterId)) return;
        this.data.player.selectedCharacter = characterId;
        this.saveData({ showToast: false });
        this.renderInventoryPanel();
        this.refreshHubGuide({ panelId: this.activeHubPanel });
        this.showMessage('人物已切換');
    }

    unlockOrEquipTitle(titleId) {
        const title = this.getTitleCatalog().find((item) => item.id === titleId);
        if (!title) return;

        const flashTitleCard = () => {
            const targetCard = document.querySelector(`[data-title-action="${titleId}"]`)?.closest('.title-card');
            if (!targetCard) return;
            targetCard.classList.add('upgrade-success-anim');
            setTimeout(() => targetCard.classList.remove('upgrade-success-anim'), 900);
        };

        if (this.data.player.unlockedTitles.includes(titleId)) {
            this.data.player.activeTitle = titleId;
            this.saveData({ showToast: false });
            this.renderInventoryPanel();
            flashTitleCard();
            this.showMessage(`已裝備稱號：${title.name}`);
            return;
        }

        if (this.data.coins < title.cost) {
            this.showMessage('英鎊不足，無法解鎖稱號。', 'error');
            return;
        }

        this.data.coins -= title.cost;
        this.data.stats.coinsSpent += title.cost;
        this.data.player.unlockedTitles.push(titleId);
        this.data.player.activeTitle = titleId;
        this.saveData();
        this.renderInventoryPanel();
        flashTitleCard();
        this.showMessage(`稱號解鎖：${title.name}`);
    }

    renderHomeSaveNote() {
        if (!this.els.homeSaveNote) return;
        this.els.homeSaveNote.textContent = this.currentUser
            ? `目前已登入 ${this.currentUser.displayName || '玩家'}，進度會先保存在本機，再自動同步到雲端。`
            : '未登入時將記錄保存在這台裝置；登入 Google 後會自動同步到雲端。';
    }

    renderSettingsPanel() {
        if (this.els.settingsCloudTitle) {
            this.els.settingsCloudTitle.textContent = this.currentUser
                ? `${this.currentUser.displayName || '玩家'} 的雲端存檔`
                : '本機存檔模式';
        }
        if (this.els.settingsCloudCopy) {
            this.els.settingsCloudCopy.textContent = this.currentUser
                ? '英鎊、精力與案件進度會在操作後自動同步；如果你剛切換裝置，也可以手動把目前進度立即上傳。'
                : '未登入時只會保存在這台裝置。登入 Google 後，遊戲會自動讀取並同步你的雲端存檔。';
        }
        if (this.els.btnCloudSync) {
            this.els.btnCloudSync.classList.toggle('hidden', !this.currentUser);
        }
        if (this.els.settingsAuthCard) {
            this.els.settingsAuthCard.classList.toggle('hidden', !!this.currentUser);
        }
    }

    renderHubDashboard() {
        this.renderHomeSaveNote();
        this.renderSettingsPanel();

        // Toggle between start screen and game hub
        const hubEl = document.querySelector('#view-hub .hub-content');
        const bottomNav = document.getElementById('hub-bottom-nav');
        if (!this.sessionStarted) {
            if (hubEl) {
                hubEl.classList.add('home-screen');
                hubEl.classList.remove('hub-hero-layout', 'home-screen-exit');
            }
            if (this.els.globalHeader) this.els.globalHeader.classList.add('hidden');
            if (bottomNav) bottomNav.classList.add('hidden');
        } else {
            if (hubEl) {
                hubEl.classList.remove('home-screen', 'home-screen-exit');
                hubEl.classList.add('hub-hero-layout');
            }
            if (bottomNav) bottomNav.classList.remove('hidden');
            // globalHeader is managed by showHubPanel
        }
        this.dailyChallenge = this.generateDailyChallenge();
        this.syncWeeklyProgress();
        const currentLevel = this.getStoryProgressLevel();
        const hasStoryLeft = currentLevel && currentLevel.id <= this.levels.length;

        if (this.els.storyProgressBadge) {
            this.els.storyProgressBadge.textContent = hasStoryLeft
                ? `${currentLevel.storyArcTitle}｜第 ${currentLevel.id} 關`
                : '主線已結案';
        }

        if (this.els.storyNextTitle) {
            this.els.storyNextTitle.textContent = hasStoryLeft ? `${currentLevel.storyArcTitle}` : '所有正式案件已完成';
        }

        if (this.els.storyNextDesc) {
            this.els.storyNextDesc.textContent = hasStoryLeft
                ? `${currentLevel.chapter}｜第 ${currentLevel.chapterOrder} 件「${currentLevel.title}」`
                : '可以重玩主線關卡，或專心衝刺每日推理與每週全勤獎勵。';
        }

        if (this.els.storyProgressText) {
            this.els.storyProgressText.textContent = hasStoryLeft
                ? `${currentLevel.storyArcTitle}｜${currentLevel.chapter}｜第 ${currentLevel.chapterOrder} 件`
                : '所有正式案件已封存';
        }

        if (this.els.homeStoryCopy) {
            this.els.homeStoryCopy.textContent = hasStoryLeft
                ? `${currentLevel.storyArcSummary} 目前卷宗焦點是「${currentLevel.title}」，地點在 ${currentLevel.chapterLocale}。`
                : '主線故事已完成。可以從案件檔案重查已封存的案件，或挑戰每日與怪獸追跡。';
        }

        if (this.els.hubTaskText) {
            this.els.hubTaskText.textContent = hasStoryLeft
                ? `卷宗已翻到「${currentLevel.title}」。`
                : '今天暫時沒有新的倫敦急件。';
        }

        if (this.els.dailyStatusText) {
            const rewardClaimed = this.data.daily.rewardDate === this.dailyChallenge.dateKey;
            this.els.dailyStatusText.textContent = rewardClaimed ? '今日獎勵已領取' : '今日首通可得 500 英鎊';
        }

        this.renderHubCast();
        this.renderStoryFeed();
        this.renderDailyPanel();
        this.renderWeeklyCalendar();
        this.renderInventoryPanel();
        this.updateNewsTicker();
        this.showHubPanel(this.activeHubPanel);
        this.refreshHubGuide({ panelId: this.activeHubPanel });
    }

    updateNewsTicker() {
        const ticker = document.getElementById('hub-news-ticker');
        const tickerText = document.getElementById('hub-news-text');
        if (!tickerText || !ticker) return;

        const currentLevel = this.getStoryProgressLevel();
        const levelId = currentLevel?.id || 1;
        
        const mainHeadlines = [
            /* 1-5 */ "貝克街發生神祕人口失蹤案，蘇格蘭場對此諱莫如深...",
            /* 6-10 */ "深夜的烘焙坊傳出神祕香氣與怪聲，鄰居宣稱看到浮動的火光...",
            /* 11-20 */ "大偵探夏洛特正式接手連環懸案，倫敦市民期待迷霧散去的一天...",
            /* 21-40 */ "倫敦東區發現不明生物足跡，生物學家表示這超出了已知的物種範疇...",
            /* 41-60 */ "事務所接獲大量神祕委託，神祕偵探的影響力正在全市擴散...",
            /* 61-80 */ "怪獸追跡成果斐然，部分市民聲稱在迷霧中看到了被馴服的使魔...",
            /* 81-100 */ "傳說中的主腦漸露真容，倫敦的終極祕密即將在事務所揭曉..."
        ];

        const sideStories = [
            "倫敦碼頭驚現巨型章魚足跡？水手們人心惶惶。",
            "海德公園的煤氣燈深夜自動熄滅，市議會懸賞捉拿搗蛋者。",
            "著名歌劇院演員離奇失聲，診斷結果令醫生們困惑不已。",
            "哈洛德百貨公司的新進貨品在運送途中不翼而飛。",
            "泰晤士河畔發現鑲金煙斗，疑似某位失蹤貴族的隨身物。"
        ];

        let headIdx = 0;
        let isBreaking = false;
        if (levelId > 80) { headIdx = 6; isBreaking = true; }
        else if (levelId > 60) { headIdx = 5; isBreaking = true; }
        else if (levelId > 40) headIdx = 4;
        else if (levelId > 20) headIdx = 3;
        else if (levelId > 10) headIdx = 2;
        else if (levelId > 5) headIdx = 1;
        
        // 30% chance to show a side story for flavor
        if (Math.random() < 0.3) {
            tickerText.textContent = sideStories[Math.floor(Math.random() * sideStories.length)];
            ticker.classList.remove('breaking');
        } else {
            tickerText.textContent = mainHeadlines[headIdx];
            ticker.classList.toggle('breaking', isBreaking);
        }
    }

    bindEvents() {
        // Backdrop click to close modals — click on the empty space around the panel
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    if (window.audio) window.audio.playClick();
                    
                    // Specialized cleanup for specific modals
                    if (modal.id === 'monster-modal') this.activeMonsterModalId = '';
                    if (modal.id === 'monster-drop-modal') {
                        const cb = this.pendingEndlessContinue;
                        this.pendingEndlessContinue = null;
                        if (typeof cb === 'function') cb();
                    }
                    if (modal.id === 'mission-modal') this.pendingGameStart = null;
                    if (modal.id === 'title-modal') this.activeTitleModalId = '';

                    this.setModalActive(modal, false);
                }
            });
        });
        document.querySelectorAll('#view-hub .menu-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.triggerHaptic('light');
                if (window.audio) window.audio.playClick();
                const rect = btn.getBoundingClientRect();
                this.particles.createExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, 10, {
                    variant: 'spark',
                    colors: ['#ffd166', '#ffcad4', '#a9def9'],
                    distance: [18, 56],
                    duration: 850
                });
            });
        });

        this.els.btnHeroInteract?.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            // Just refresh/cycle NPC dialogue instead of starting the game
            this.refreshHubGuide({ rerollCharacter: true, panelId: this.activeHubPanel });
        });

        // Start main mission by clicking the home story panel
        document.querySelector('.hub-home-panel')?.addEventListener('click', () => {
            if (this.activeHubPanel !== 'home') return;
            if (window.audio) window.audio.playClick();
            const currentLevel = this.getStoryProgressLevel();
            if (!currentLevel) return;
            this.startGame('story', currentLevel.id);
        });

        this.els.btnHubTipShop?.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            this.showLocation('shop');
        });

        this.els.btnHubHome?.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            this.forceReturnHub();
        });

        this.els.btnGuestStart?.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            
            // Prioritize entering the hub first for better responsiveness on mobile
            this.sessionStarted = true;
            this.enterHub();
            this.saveData({ showToast: false });

            // Try fullscreen as a progressive enhancement, catching any browser-specific errors
            if (typeof document.documentElement.requestFullscreen === 'function') {
                document.documentElement.requestFullscreen().catch(() => {
                    // Fail silently as many mobile browsers block this or have restricted support
                });
            }
        });

        this.els.btnDailyStart?.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            this.startDailyChallenge();
        });

        this.els.btnEndlessStart?.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            this.startEndless();
        });

        this.els.btnCharacterClose?.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            this.setModalActive(this.els.characterModal, false);
        });

        this.els.btnMonsterClose?.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            this.activeMonsterModalId = '';
            this.setModalActive(this.els.monsterModal, false);
        });

        this.els.btnMonsterDropClose?.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            this.setModalActive(this.els.monsterDropModal, false);
            const cb = this.pendingEndlessContinue;
            this.pendingEndlessContinue = null;
            if (typeof cb === 'function') cb();
        });

        this.els.btnMonsterDropAction?.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            const monsterId = this.els.btnMonsterDropAction?.dataset?.monsterDropId;
            const duplicate = this.els.btnMonsterDropAction?.dataset?.monsterDropDuplicate === '1';
            if (!monsterId) return;
            if (!duplicate) {
                const ok = this.unlockDroppedMonster(monsterId);
                if (!ok) return;
            }
            this.setModalActive(this.els.monsterDropModal, false);
            const cb = this.pendingEndlessContinue;
            this.pendingEndlessContinue = null;
            if (typeof cb === 'function') cb();
        });

        this.els.btnMissionBack?.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            const pendingMode = this.pendingGameStart?.mode;
            this.setModalActive(this.els.missionModal, false);
            this.pendingGameStart = null;
            this.showLocation('hub');
            if (pendingMode === 'story') {
                this.showHubPanel('missions');
                this.renderMap();
            } else {
                this.showHubPanel('home');
            }
        });

        this.els.btnMissionStart?.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            this.startPreparedGame();
        });

        this.els.btnTitleClose?.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            this.setModalActive(this.els.titleModal, false);
        });

        this.els.hubBottomNav?.addEventListener('click', (e) => {
            const btn = e.target.closest('.hub-nav-btn');
            if (!btn) return;

            if (window.audio) window.audio.playClick();
            const target = btn.dataset.hubTarget;
            if (target === 'shop') {
                this.showHubPanel('shop');
                return;
            }
            if (target === 'missions') {
                this.enterStoryMap();
                return;
            }
            this.showLocation('hub');
            this.showHubPanel(target);
        });

        this.els.inventoryGrid?.addEventListener('click', (e) => {
            const subtab = e.target.closest('[data-switch-inventory-tab]');
            if (subtab) {
                if (window.audio) window.audio.playClick();
                this.setInventorySubtab(subtab.dataset.switchInventoryTab);
                return;
            }

            const charSelect = e.target.closest('[data-open-character-select]');
            if (charSelect) {
                if (window.audio) window.audio.playClick();
                this.openCharacterSelectModal();
                return;
            }

            const titlePage = e.target.closest('[data-open-title-page]');
            if (titlePage) {
                if (window.audio) window.audio.playClick();
                this.openTitleUpgradePage(titlePage.dataset.titleTargetTab || 'equip');
                return;
            }

            const monsterOpen = e.target.closest('[data-open-monster]');
            if (monsterOpen) {
                if (window.audio) window.audio.playClick();
                this.openMonsterDetailModal(monsterOpen.dataset.openMonster);
                return;
            }

            const lockedMonster = e.target.closest('[data-locked-monster]');
            if (lockedMonster) {
                if (window.audio) window.audio.playClick();
                this.showMessage('尚未解鎖這隻怪獸。', 'error');
            }
        });

        this.els.monsterModalDesc?.addEventListener('click', (e) => {
            const equip = e.target.closest('[data-monster-modal-equip]');
            if (equip) {
                if (window.audio) window.audio.playClick();
                this.equipMonster(equip.dataset.monsterModalEquip);
                this.openMonsterDetailModal(equip.dataset.monsterModalEquip);
                return;
            }

            const upgrade = e.target.closest('[data-monster-modal-upgrade]');
            if (upgrade) {
                if (window.audio) window.audio.playClick();
                this.upgradeMonster(upgrade.dataset.monsterModalUpgrade);
            }
        });

        this.els.levelGrid?.addEventListener('click', (e) => {
            const historyBackBtn = e.target.closest('[data-history-back]');
            if (historyBackBtn) {
                if (window.audio) window.audio.playClick();
                this.storyArchiveState.selectedHistoryArc = null;
                this.renderMap();
                return;
            }

            const historyArcBtn = e.target.closest('[data-open-history-arc]');
            if (historyArcBtn) {
                if (window.audio) window.audio.playClick();
                this.storyArchiveState.selectedHistoryArc = historyArcBtn.dataset.openHistoryArc;
                this.renderMap();
                return;
            }

            const latestLevelBtn = e.target.closest('[data-open-latest-level]');
            if (latestLevelBtn) {
                const levelId = Number(latestLevelBtn.dataset.openLatestLevel);
                if (!Number.isFinite(levelId)) return;
                if (window.audio) window.audio.playClick();
                this.startGame('story', levelId);
                return;
            }

            const levelCard = e.target.closest('[data-level-id]');
            if (!levelCard) return;
            const levelId = Number(levelCard.dataset.levelId);
            if (!Number.isFinite(levelId)) return;
            if (window.audio) window.audio.playClick();
            const rect = levelCard.getBoundingClientRect();
            this.particles.createExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, 14, {
                variant: 'spark',
                colors: ['#ffe08c', '#d8f3ff', '#cdb4db'],
                distance: [20, 72],
                duration: 900
            });
            this.startGame('story', levelId);
        });

        this.els.btnToggleAudio?.addEventListener('click', () => {
            if (window.audio) {
                const muted = window.audio.toggleMute();
                this.showMessage(muted ? '背景音效已關閉' : '背景音效已開啟');
            }
        });

        this.els.btnDeleteData?.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            this.openConfirmModal({
                title: '重置資料',
                description: '確定要刪除所有本機資料並重新開始嗎？此操作無法撤銷。如果已登入 Google，下次登入時會恢復雲端資料。',
                cancelText: '取消',
                okText: '確定刪除',
                okVariant: 'danger',
                onOk: () => {
                    localStorage.removeItem(this.storageKey);
                    this.showMessage('資料已清除，正在重新啟動...', 'info');
                    setTimeout(() => location.reload(), 1500);
                }
            });
        });

        this.els.btnCloudSync?.addEventListener('click', async () => {
            if (window.audio) window.audio.playClick();
            if (!this.currentUser) {
                this.showMessage('請先登入 Google 帳號後再上傳。', 'error');
                return;
            }
            try {
                const synced = await window.cloudSave?.forceSync?.();
                this.showMessage(synced ? '目前進度已手動上傳到雲端。' : '手動上傳未完成，請稍後再試。', synced ? 'info' : 'error');
            } catch (error) {
                console.error(error);
                this.showMessage('手動上傳失敗，請稍後再試。', 'error');
            }
        });

        this.els.btnGlobalBack.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            
            if (this.viewState === 'game') {
                this.openRetreatConfirm();
                return;
            }
            if (this.viewState === 'hub' && this.activeHubPanel !== 'home') {
                this.showHubPanel('home');
            } else {
                this.forceReturnHub();
            }
        });


        this.els.btnQuit?.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            this.openRetreatConfirm();
        });

        this.els.btnConfirmCancel.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            this.closeConfirmModal({ runCancel: true });
        });
        this.els.btnConfirmOk.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            if (this.pendingConfirmAction) {
                this.pendingConfirmAction();
            } else {
                this.closeConfirmModal();
            }
        });

        this.els.palette.addEventListener('click', e => {
            const btn = e.target.closest('.palette-btn');
            if (btn && !this.gameState.solved && !this.dialogue.isPlaying) this.handleIngredientTap(btn.dataset.id);
        });

        this.els.slotsContainer.addEventListener('click', (e) => {
            const slot = e.target.closest('.slot');
            if (slot && !this.gameState.solved && !this.dialogue.isPlaying) {
                const idx = parseInt(slot.dataset.index);
                if (this.gameState.hints.includes(idx)) return;
                if (this.gameState.selectedSlot === idx && this.gameState.input[idx]) {
                    this.clearSlot(idx);
                } else {
                    if (window.audio) window.audio.playClick();
                    this.setSelectedSlot(idx);
                }
            }
        });

        this.els.btnSubmit.addEventListener('click', () => {
            if (!this.dialogue.isPlaying) this.submitPotion();
        });

        this.els.btnHint.addEventListener('click', () => {
            if (!this.dialogue.isPlaying) this.useHint();
        });

        this.els.btnModalAction.addEventListener('click', () => {
            if (window.audio) window.audio.playClick();
            this.closeResultModal();
            const targetPanel = this.nextHubPanel || 'home';
            this.nextHubPanel = null; // Reset
            this.forceReturnHub(targetPanel);
        });
    }


    renderMap() {
        if (this.els.btnMapDaily) {
            this.dailyChallenge = this.generateDailyChallenge();
            this.els.btnMapDaily.textContent = this.canClaimDailyReward() ? '每日挑戰 +500' : '每日 / 無盡';
        }
        this.els.levelGrid.innerHTML = '';

        const isHistoryTab = this.currentCaseTab === 'history';
        const arcs = this.getStoryArchiveGroups().slice(0, 5);
        const currentLevel = this.getStoryProgressLevel() || this.levels[this.levels.length - 1];
        const currentArc = arcs.find((arc) => arc.key === currentLevel?.storyArcKey) || arcs[0];

        if (!isHistoryTab) {
            const playableLevels = currentArc.levels.filter((level) => level.id <= this.data.highestLevel);
            const latestLevel = playableLevels.find((level) => level.id === this.data.highestLevel) || playableLevels[playableLevels.length - 1];
            const narrativeHtml = latestLevel && latestLevel.storyNarrativeParagraphs
                ? latestLevel.storyNarrativeParagraphs.slice(0, 6).map(p => `<p style="margin-bottom:8px; line-height:1.85;">${String(p).replaceAll('主角', '你').replaceAll('我', '你')}</p>`).join('')
                : `<p>${currentArc.summary}</p>`;

            this.els.levelGrid.innerHTML = `
                <article class="casebook-hero-card">
                    <div class="casebook-hero-top">
                        <span class="inventory-label icon-pill"><img src="assets/icons/ui_casefile.png" alt="案件卷宗"> 當前進度</span>
                        <strong>${currentArc.title}</strong>
                    </div>
                    <div class="casebook-hero-narrative" style="margin: 16px 0;">
                        <h3>${latestLevel ? `${String(latestLevel.id).padStart(2, '0')} ${latestLevel.title}` : currentArc.title}</h3>
                        <div class="narrative-content" style="color: var(--color-text-main); font-size: 13.5px; opacity: 0.9;">
                            ${narrativeHtml}
                        </div>
                    </div>
                    <div style="margin-top: 16px;">
                        ${latestLevel ? `<button class="menu-btn primary-btn" style="width: 100%;" data-level-id="${latestLevel.id}">開始案件 ${String(latestLevel.id).padStart(2, '0')}：${latestLevel.title}</button>` : ''}
                    </div>
                    <p style="font-size: 11px; text-align: center; color: rgba(63,45,32,0.68); margin-bottom: 12px;">※ 其餘關卡與得分已封存到「歷史紀錄」。</p>
                </article>
            `;
            return;
        }

        const selectedArc = arcs.find((arc) => arc.key === this.storyArchiveState.selectedHistoryArc);
        if (selectedArc) {
            const clearedLevels = selectedArc.levels.filter((level) => (this.data.levelStars[level.id] || 0) > 0);
            this.els.levelGrid.innerHTML = `
                <div class="casebook-archive-head">
                    <button class="menu-btn secondary-btn archive-back-btn" data-history-back="true">返回歷史章節</button>
                    <article class="casebook-hero-card archive">
                        <div class="casebook-hero-top">
                            <span class="inventory-label icon-pill"><img src="assets/icons/ui_casefile.png" alt="歷史卷宗"> 歷史案件</span>
                            <strong>${selectedArc.title}</strong>
                        </div>
                        <h3>${selectedArc.intro}</h3>
                        <p>${selectedArc.summary}</p>
                    </article>
                </div>
                <div class="casebook-level-list">
                    ${clearedLevels.map((level) => `
                        <button class="level-card compact archived readable" data-level-id="${level.id}">
                            ${this.getLevelCardMarkup(level, this.data.levelStars[level.id] || 0)}
                        </button>
                    `).join('')}
                </div>
            `;
            return;
        }

        const archiveCards = arcs
            .map((arc) => {
                const progress = this.getStoryArcProgress(arc);
                if (progress.cleared <= 0) return '';
                return `
                    <button class="casebook-archive-card" data-open-history-arc="${arc.key}">
                        <div class="casebook-hero-top">
                            <span class="inventory-label icon-pill"><img src="assets/icons/ui_casefile.png" alt="案件卷宗"> ${arc.act} 卷</span>
                            <strong>${progress.cleared}/${progress.total}</strong>
                        </div>
                        <h3>${arc.title}</h3>
                        <p>${arc.summary}</p>
                        <span class="title-tap-hint">查看已破案件 ▶</span>
                    </button>
                `;
            })
            .filter(Boolean)
            .join('');

        this.els.levelGrid.innerHTML = archiveCards || '<div style="text-align:center; padding: 20px; color: var(--color-text-dim);">目前尚無歷史案件紀錄。至少通關一件主線案件後，這裡才會開始封存。</div>';
    }

    renderShop() {
        const items = this.getShopInventory();
        this.els.shopItems.innerHTML = '';
        items.forEach(item => {
            if (item.repeat === false && item.cond && !item.cond()) return; // already bought unique

            const div = document.createElement('div');
            div.className = 'shop-item';
            div.style.setProperty('--stagger-delay', `${this.els.shopItems.children.length * 80}ms`);
            const disabled = item.disabled ? item.disabled() : false;
            const icon = item.icon || '<img src="assets/icons/nav_shop.png" alt="商品">';
            const buttonLabel = disabled
                ? '暫無需求'
                : `售價 ${item.cost}`;
            div.innerHTML = `
                <div class="shop-item-icon">${icon}</div>
                <div class="shop-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.desc}</p>
                    <p class="shop-item-meta">${item.category}｜${item.tier}</p>
                    <p class="shop-item-meta">${item.effectText ? item.effectText() : item.desc}</p>
                    <p class="shop-item-meta">${item.statusText ? item.statusText() : '可立即購買'}</p>
                </div>
                <button class="buy-btn" data-id="${item.id}" ${(this.data.coins < item.cost || disabled) ? 'disabled' : ''}>
                    <img src="assets/icons/coin.png" alt="英鎊">${buttonLabel}
                </button>
            `;
            const btn = div.querySelector('button');
            btn.addEventListener('click', () => {
                if (this.data.coins >= item.cost && !disabled) {
                    if (window.audio) window.audio.playLoot ? window.audio.playLoot() : window.audio.playSuccess();
                    const rect = btn.getBoundingClientRect();
                    this.particles.createCelebration(rect.left + rect.width / 2, rect.top + rect.height / 2);
                    this.data.coins -= item.cost;
                    this.data.stats.coinsSpent += item.cost;
                    item.action();
                    this.saveData();
                    this.renderShop();
                    this.showMessage(item.id === 'staminaPack' ? '補給成功，精力已回復' : '購買成功，裝備已升級');
                }
            });
            this.els.shopItems.appendChild(div);
        });
    }

    updateEnemyUI() {
        const isEndless = this.gameMode === 'endless';
        if (!isEndless) {
            if (this.els.combatEnemyCount) this.els.combatEnemyCount.textContent = '';
            if (this.els.combatEnemyName) this.els.combatEnemyName.textContent = '';
            if (this.els.combatEnemyImage) {
                this.els.combatEnemyImage.style.opacity = '1';
                this.els.combatEnemyImage.style.filter = 'none';
                this.els.combatEnemyImage.style.transform = 'none';
            }
            return;
        }

        const enemy = this.gameState.currentEnemy;
        if (this.els.combatEnemyImage) {
            this.els.combatEnemyImage.src = enemy?.image || 'assets/enemies/starry_slime.png';
            this.els.combatEnemyImage.alt = '追跡目標';
            // Always blur until round 8 — don't use monster-silhouette class (reveals identity)
            this.els.combatEnemyImage.classList.remove('monster-silhouette');
        }
        const progress = this.gameState.orderCount || 1;
        const maxProgress = 8;

        // Name is always hidden until completion — show clue-based hints only
        const clueHints = [
            '對象未知——只捕捉到迷霧中的蹤跡',
            '對象未知——隱約有模糊的身影出現',
            '對象未知——身影漸漸清晰，但面目仍被迷霧遮蓋',
            '對象未知——設法封鎖其行動規律',
            '對象未知——圖鑑資料積累中，輪廓漸清晰',
            '對象未知——真面目將近，棲息規律握在手',
            '對象未知——身影已清晰，最後一層面紗即將揭開',
            '對象未知——追跡就將完成，輪廓已完全清晰'
        ];
        const displayName = clueHints[Math.min(progress - 1, 7)];

        if (this.els.combatEnemyName) this.els.combatEnemyName.textContent = displayName;
        if (this.els.combatEnemyCount) {
            this.els.combatEnemyCount.textContent = `追跡 ${progress}/${maxProgress}｜${this.gameState.slotCount || 3}格密碼`;
        }

        // Progressive Monster Clarity (Discovery) — 8-stage gradual reveal
        if (this.els.combatEnemyImage) {
            const clarityStages = [
                /* 0 */ { opacity: 0.15, blur: 40, brightness: 0.2,  scale: 0.6  },
                /* 1 */ { opacity: 0.2,  blur: 35, brightness: 0.25, scale: 0.62 },
                /* 2 */ { opacity: 0.3,  blur: 28, brightness: 0.3,  scale: 0.65 },
                /* 3 */ { opacity: 0.45, blur: 20, brightness: 0.4,  scale: 0.68 },
                /* 4 */ { opacity: 0.55, blur: 14, brightness: 0.5,  scale: 0.7  },
                /* 5 */ { opacity: 0.7,  blur: 9,  brightness: 0.65, scale: 0.73 },
                /* 6 */ { opacity: 0.8,  blur: 5,  brightness: 0.8,  scale: 0.76 },
                /* 7 */ { opacity: 0.92, blur: 2,  brightness: 0.92, scale: 0.78 },
                /* 8 */ { opacity: 1.0,  blur: 0,  brightness: 1.0,  scale: 0.8 }
            ];
            const stageIdx = Math.min(progress, 8);
            const stage = clarityStages[stageIdx] || clarityStages[0];

            this.els.combatEnemyImage.style.opacity = String(stage.opacity);
            this.els.combatEnemyImage.style.filter = `blur(${stage.blur}px) brightness(${stage.brightness}) drop-shadow(0 0 28px rgba(212, 168, 83, ${0.1 + stageIdx * 0.06}))`;
            this.els.combatEnemyImage.style.transform = `scale(${stage.scale})`;
            this.els.combatEnemyImage.style.transition = 'opacity 1.5s ease, filter 1.5s ease, transform 1.5s ease';
        }
    }

    startDailyChallenge() {
        this.closeResultModal();
        this.closeConfirmModal();
        this.activeHubPanel = 'daily';

        if (this.data.stamina < 5) {
            this.showMessage('精力不足，每日任務需要 5 點精力。', 'error');
            this.showStaminaHelp(5);
            return;
        }

        const charlotteQuotes = [
            "今天的訓練主題是觀察力，準備好了嗎？",
            "偵探需要敏銳的直覺，來試試這次的謎題吧。",
            "別放過任何一個細節，這次的培訓可不容易。",
            "訓練是為了實戰，加油吧，我的實習偵探。",
            "邏輯推理是偵探的靈魂，開始今天的練習吧。"
        ];
        const dayIndex = new Date().getDate() % charlotteQuotes.length;
        const dailyQuote = charlotteQuotes[dayIndex];

        this.openConfirmModal({
            title: '夏洛特的偵探培訓',
            description: `${dailyQuote}\n\n(進入訓練將消耗 5 點體力)`,
            cancelText: '取消',
            okText: '開始培訓',
            okVariant: 'primary',
            onOk: () => {
                this.closeConfirmModal();
                this.executeDailyChallenge();
            }
        });
    }

    executeDailyChallenge() {
        this.data.stamina -= 5;

        // Track play count for today
        const dateKey = this.getDateKey();
        if (this.data.daily.lastPlayedDate !== dateKey) {
            this.data.daily.playCount = 0;
        }
        this.data.daily.playCount = (this.data.daily.playCount || 0) + 1;
        this.data.daily.lastPlayedDate = dateKey;
        const playCount = this.data.daily.playCount;

        // First play uses today's fixed challenge, 2nd+ are random
        let challenge;
        if (playCount <= 1) {
            challenge = this.generateDailyChallenge();
        } else {
            // Random challenge
            const pool = this.getDailyChallengePool();
            const chosen = pool[Math.floor(Math.random() * pool.length)];
            const slotCount = 5;
            challenge = this.normalizePuzzleDefinition({
                id: `daily-${dateKey}-${playCount}`,
                dateKey,
                name: `每日任務｜${chosen.title}`,
                title: chosen.title,
                client: '夏洛特的偵探培訓',
                request: '完成每日培訓，每次消耗 5 精力，過關獲得 10 英鎊。',
                rule: chosen.rule,
                ruleLabel: chosen.ruleLabel,
                slotCount,
                storyClue: this.getRuleClue(chosen.rule, slotCount),
                chapter: '每日任務',
                chapterIndex: 1,
                intro: '',
                perfect: '挑戰完成！',
                good: '挑戰完成。',
                rough: '勉強過關。',
                fail: '挑戰失敗。'
            });
        }
        this.dailyChallenge = challenge;
        this.saveData({ showToast: false });

        this.gameMode = 'daily';
        this.currentLevel = 0;
        this.els.viewGame?.classList.remove('endless-battle');
        this.requestFS();
        this.showLocation('game');
        const maxMana = this.getModeMaxMana('daily');
        this.gameState = { mana: maxMana, maxMana, orderCount: 1, scoreCoins: 0, gameOver: false, hintPenalty: false, dailyRewardGranted: false, weeklyRewardGranted: false };
        this.els.leaderboardBox.classList.add('hidden');

        // Build guide lines – first play gets a welcome, repeat plays get a quick re-prompt
        const clueText = this.dailyChallenge.clue || this.dailyChallenge.storyClue || this.dailyChallenge.gameplayDetail || '';
        const guideLines = playCount <= 1
            ? [
                {
                    speaker: this.getCharacterProfile('scout').name,
                    portrait: this.getCharacterProfile('scout').portraitClass,
                    text: '每日推理已解封。每次消耗 5 精力，過關獲得 10 英鎊，一週連勤還有額外獎勵。'
                },
                {
                    speaker: this.getCharacterProfile('iris').name,
                    portrait: this.getCharacterProfile('iris').portraitClass,
                    text: `今天的題目是「${this.dailyChallenge.title}」，規格：${this.dailyChallenge.ruleLabel}。${clueText ? '\n\n' + clueText : ''}`
                }
            ]
            : [
                {
                    speaker: this.getCharacterProfile('iris').name,
                    portrait: this.getCharacterProfile('iris').portraitClass,
                    text: `再挑戰一次。規格還是「${this.dailyChallenge.ruleLabel}」，${clueText ? clueText : '把不可能的答案一個個排掉。'}`
                }
            ];

        this.dialogue.play(guideLines, () => {
            this.setupBoard(
                this.dailyChallenge.name,
                `每日推理｜${this.dailyChallenge.ruleLabel}`,
                this.dailyChallenge.rule,
                this.dailyChallenge.slotCount,
                this.dailyChallenge
            );
        });
    }

    startEndless() {
        this.startGame('endless');
    }

    startGame(mode, levelId = 1) {
        if (mode === 'story' || mode === 'endless') {
            this.openMissionBrief(mode, levelId);
            return;
        }
        this.launchGame(mode, levelId);
    }

    openMissionBrief(mode, levelId = 1) {
        this.closeResultModal();
        this.closeConfirmModal();
        const staminaCost = mode === 'endless' ? 30 : mode === 'story' ? 10 : 0;
        if (staminaCost > 0 && this.data.stamina < staminaCost) {
            this.showMessage('精力不足，請先補充後再出發。', 'error');
            this.showStaminaHelp(staminaCost);
            return;
        }

        this.pendingGameStart = { mode, levelId };
        if (mode === 'story') {
            const level = this.levels.find((entry) => entry.id === levelId);
            if (!level) return;
            if (this.els.missionModalTopline) this.els.missionModalTopline.textContent = `${level.storyArcTitle}｜案件前置`;
            if (this.els.missionModalTitle) this.els.missionModalTitle.textContent = `#${String(level.id).padStart(2, '0')} ${level.title}`;
            if (this.els.missionModalImage) {
                this.els.missionModalImage.src = this.getCharacterImageForPortrait(this.getPortraitForLevel(level));
                this.els.missionModalImage.alt = this.getClientSpeakerName(level);
                this.els.missionModalImage.classList.remove('mist-preview');
            }
            if (this.els.missionModalDesc) {
                this.els.missionModalDesc.textContent = `${level.client} 送來的委託是「${level.request}」`;
            }
            if (this.els.missionModalMeta) {
                this.els.missionModalMeta.innerHTML = `
                    <span>${level.chapter}｜第 ${level.chapterOrder}/10 件</span>
                    <span>${level.ruleLabel}</span>
                    <span>消耗 ${staminaCost} 精力</span>
                `;
            }
            if (this.els.missionModalExtra) {
                this.els.missionModalExtra.innerHTML = `
                    <p>${level.chapterIntro}</p>
                    <p>${level.chapterSummary}</p>
                    <p>進場後先看卷宗提示，再開始推理。若想換關，按上方「重新選擇章節」即可返回委託桌。</p>
                `;
            }
            if (this.els.btnMissionStart) this.els.btnMissionStart.textContent = '繼續案件';
            if (this.els.btnMissionBack) this.els.btnMissionBack.textContent = '重新選擇章節';
        } else {
            const firstEnemy = this.getEnemyForOrder(1);
            if (this.els.missionModalTopline) this.els.missionModalTopline.textContent = '迷霧追跡｜出發前';
            if (this.els.missionModalTitle) this.els.missionModalTitle.textContent = '怪獸追跡委託';
            if (this.els.missionModalImage) {
                this.els.missionModalImage.src = firstEnemy?.image || 'assets/enemies/starry_slime.png';
                this.els.missionModalImage.alt = firstEnemy?.name || '怪獸追跡';
                this.els.missionModalImage.classList.add('mist-preview');
            }
            if (this.els.missionModalDesc) {
                this.els.missionModalDesc.textContent = `附近傳來 ${firstEnemy?.name || '未知怪獸'} 目擊通報，目前無法判定真實種類，委託你立即追查。`;
            }
            if (this.els.missionModalMeta) {
                this.els.missionModalMeta.innerHTML = `
                    <span>消耗 ${staminaCost} 精力</span>
                    <span>本輪固定 10 關追跡</span>
                    <span>每關有機率抽到怪獸線索</span>
                `;
            }
            if (this.els.missionModalExtra) {
                this.els.missionModalExtra.innerHTML = `
                    <p>${this.getEndlessMonsterLead(firstEnemy)}</p>
                    <p>重複抽到同一怪獸線索時，會自動轉換為 3000 英鎊。</p>
                `;
            }
            if (this.els.btnMissionStart) this.els.btnMissionStart.textContent = '開始追跡';
            if (this.els.btnMissionBack) this.els.btnMissionBack.textContent = '回到事務所';
        }
        this.setModalActive(this.els.missionModal, true);
    }

    startPreparedGame() {
        if (!this.pendingGameStart) return;
        const { mode, levelId } = this.pendingGameStart;
        this.pendingGameStart = null;
        this.setModalActive(this.els.missionModal, false);
        this.launchGame(mode, levelId);
    }

    launchGame(mode, levelId = 1) {
        this.closeResultModal();
        this.closeConfirmModal();
        const staminaCost = mode === 'endless' ? 30 : mode === 'story' ? 10 : 0;
        if (staminaCost > 0 && this.data.stamina < staminaCost) {
            this.showMessage('精力不足，請先補充後再出發。', 'error');
            this.showStaminaHelp(staminaCost);
            return;
        }

        if (staminaCost > 0) {
            this.data.stamina -= staminaCost;
            if (mode === 'endless') this.data.stats.endlessPlayed++;
            this.saveData({ showToast: false });
        }


        this.gameMode = mode;
        this.currentLevel = levelId;
        
        // Remove old backgrounds
        this.els.appContainer.classList.remove('bg-chapter-1', 'bg-chapter-2', 'bg-chapter-3', 'bg-chapter-4', 'bg-chapter-5');
        if (mode === 'story') {
            const lv = this.levels.find(l => l.id === levelId);
            if (lv && lv.chapterIndex !== undefined) {
                this.els.appContainer.classList.add(`bg-chapter-${lv.chapterIndex + 1}`);
            }
        } else {
            this.els.appContainer.classList.add('bg-chapter-1'); // Default for endless
        }

        this.els.viewGame?.classList.toggle('endless-battle', mode === 'endless');
        this.requestFS();
        this.playTransitionOverlay(() => {
            this.showLocation('game');
        }, 'paper');

        const maxMana = this.getModeMaxMana(mode);
        this.gameState = {
            mana: maxMana,
            maxMana,
            orderCount: 0,
            defeated: 0,
            score: 0,
            scoreCoins: 0,
            hp: this.getEndlessMaxHp(),
            maxHp: this.getEndlessMaxHp(),
            gameOver: false,
            hintPenalty: false,
            dailyRewardGranted: false,
            weeklyRewardGranted: false
        };
        this.els.leaderboardBox.classList.add('hidden');

        // Play story explicitly every time
        if (mode === 'endless') {
            this.nextEndlessOrder();
        } else {
            const lv = this.levels.find(l => l.id === levelId);
            
            // 初始化多階段關卡邏輯
            this.gameState.stages = lv.stages || [lv];
            this.gameState.currentStageIndex = 0;
            
            this.openStoryParchment(lv, () => {
                const firstStage = this.gameState.stages[0];
                const introLines = firstStage.openingDialogue || this.buildLevelIntro(lv);
                this.dialogue.play(introLines, () => this.startPattern(levelId));
            });
        }

    }

    nextEndlessOrder() {
        if (this.gameState.gameOver) return;
        this.gameState.orderCount++;
        this.gameState.hintPenalty = false;

        // Always track the SAME monster for all 8 rounds of this run
        if (!this.gameState.sessionEnemy) {
            const roster = this.getEnemyRoster();
            this.gameState.sessionEnemy = roster[Math.floor(Math.random() * roster.length)];
        }
        this.gameState.currentEnemy = this.gameState.sessionEnemy;

        const endlessOrder = this.generateEndlessOrder(this.gameState.orderCount);
        this.els.combatEnemy?.classList.remove('defeated', 'attacking');
        this.dialogue.play(
            this.buildEndlessMonsterIntro(this.gameState.currentEnemy, this.gameState.orderCount),
            () => {
                this.setupBoard(
                    endlessOrder.name,
                    `迷霧追跡｜${endlessOrder.ruleLabel}`,
                    endlessOrder.rule,
                    endlessOrder.slotCount,
                    endlessOrder
                );
                this.playEndlessEncounterIntro();
            }
        );
    }

    startPattern(levelId) {
        const lv = this.levels.find(l => l.id === levelId);
        const stage = this.gameState.stages[this.gameState.currentStageIndex];
        
        // 如果是後續階段，標題與描述可能不同
        const title = stage.title || lv.name;
        const desc = stage.chapter || `故事模式｜${lv.chapter}`;
        const rule = stage.rule || lv.rule || '1a2b';
        const slotCount = stage.slotCount || lv.slotCount || 3;
        
        this.setupBoard(title, desc, rule, slotCount, lv);
    }


    applyGameLayoutMetrics(slotCount = 3, rule = '1a2b') {
        if (!this.els.viewGame) return;
        const baseSlot = slotCount >= 5 ? 52 : slotCount === 4 ? 58 : 66;
        const slotSize = Math.round(baseSlot * 0.9);
        this.els.viewGame.style.setProperty('--slot-count', String(slotCount));
        this.els.viewGame.style.setProperty('--slot-size', `${slotSize}px`);
        this.els.viewGame.dataset.rule = rule;
        this.els.viewGame.dataset.slotCount = String(slotCount);
    }

    clearCombatTimer() {
        if (this.combatTimerId) {
            clearInterval(this.combatTimerId);
            this.combatTimerId = null;
        }
    }

    updatePlayerCombatPortrait() {
        const character = this.getPlayableCharacter();
        const stage = this.getPlayerStage(character);

        if (this.els.gamePlayerImage) {
            this.els.gamePlayerImage.src = stage.image;
            this.els.gamePlayerImage.alt = character.name;
        }
        if (this.els.topPlayerThumb) {
            this.els.topPlayerThumb.src = stage.image;
            this.els.topPlayerThumb.alt = character.name;
        }
        if (this.els.gamePlayerName) this.els.gamePlayerName.textContent = character.name;
        if (this.els.gamePlayerTitle) this.els.gamePlayerTitle.textContent = '';
    }

    updateCombatStage() {
        if (!this.els.combatStage) return;

        this.updatePlayerCombatPortrait();
        const isEndless = this.gameMode === 'endless';
        const isDaily  = this.gameMode === 'daily';
        const hasStoryTimer = this.gameMode === 'story' && Number.isFinite(this.gameState.timeLimit) && this.gameState.timeLimit > 0;

        // endless-battle class only for endless
        this.els.viewGame?.classList.toggle('endless-battle', isEndless);
        // is-story only for actual story mode (not daily) to avoid layout mismatch
        this.els.combatStage.classList.toggle('is-endless', isEndless);
        this.els.combatStage.classList.toggle('is-story', this.gameMode === 'story');
        this.els.combatStage.classList.toggle('is-daily', isDaily);

        if (this.els.combatModeTag) {
            this.els.combatModeTag.textContent = isEndless
                ? `迷霧追跡 — 得分 ${this.gameState.score || 0}`
                : isDaily ? '每日推理' : '';
            this.els.combatModeTag.classList.toggle('hidden', !isEndless && !isDaily);
        }

        // Update header title per mode
        const headerTitle = document.getElementById('header-title');
        if (headerTitle) {
            if (isEndless) {
                headerTitle.textContent = '怪獸追跡';
            } else if (isDaily) {
                headerTitle.textContent = '每日推理';
            } else {
                const lv = this.levels.find(l => l.id === this.currentLevel);
                headerTitle.textContent = lv ? `案件 #${String(lv.id).padStart(2, '0')}` : '故事模式';
            }
        }

        if (this.els.combatTimerLabelText) {
            this.els.combatTimerLabelText.textContent = isEndless ? '追跡倒數' : '限時推理';
        }
        this.els.combatTimer?.classList.toggle('hidden', !(isEndless || hasStoryTimer));
        this.els.combatHp?.classList.toggle('hidden', !isEndless);
        this.els.combatEnemy?.classList.toggle('hidden', !isEndless);

        const statusBox = document.getElementById('combat-status-box');
        const legendWrap = document.querySelector('.combat-legend-wrap');

        if (statusBox) {
            // ONLY show status box in endless mode (Chase progress / Monster HP)
            // Story mode timer is handled separately or moved if needed
            statusBox.classList.toggle('hidden', !isEndless);
        }
        
        if (legendWrap) {
            // Legend Wrap contains A/B help and Mana bar. 
            // Always show for Story and Daily.
            legendWrap.classList.toggle('hidden', isEndless);
        }

        const storyInfo = document.querySelector('.combat-story-info');
        if (storyInfo) {
            storyInfo.classList.toggle('hidden', isEndless);
        }

        // Always update Mana and other HUD values
        this.updateEndlessHud();
        if (isEndless) {
            this.updateEnemyUI();
        }

    }



    playEndlessEncounterIntro() {
        if (!this.els.combatStage) return;
        this.els.combatStage.classList.remove('encounter-emerge');
        void this.els.combatStage.offsetWidth;
        this.els.combatStage.classList.add('encounter-emerge');
        setTimeout(() => {
            this.els.combatStage?.classList.remove('encounter-emerge');
        }, 900);
    }

    updateEndlessHud() {
        if (this.gameState.maxHp) {
            const hpPct = Math.max(0, Math.min(100, (this.gameState.hp / this.gameState.maxHp) * 100));
            if (this.els.combatHpValue) this.els.combatHpValue.textContent = `${this.gameState.hp} / ${this.gameState.maxHp}`;
            if (this.els.combatHpFill) this.els.combatHpFill.style.width = `${hpPct}%`;
        }

        if (this.gameState.timeLimit && this.els.combatTimerFill) {
            const timePct = Math.max(0, Math.min(100, (this.gameState.timeLeft / this.gameState.timeLimit) * 100));
            this.els.combatTimerFill.style.width = `${timePct}%`;
        }
        if (this.els.combatTimerValue && Number.isFinite(this.gameState.timeLeft)) {
            this.els.combatTimerValue.textContent = `${this.gameState.timeLeft}`;
        }

        // Update Mana (Reasoning Power)
        if (this.gameState.maxMana) {
            const manaPct = Math.max(0, Math.min(100, (this.gameState.mana / this.gameState.maxMana) * 100));
            if (this.els.combatManaFill) this.els.combatManaFill.style.width = `${manaPct}%`;
            if (this.els.combatManaValue) this.els.combatManaValue.textContent = `${Math.floor(this.gameState.mana)} / ${this.gameState.maxMana}`;
        }
    }

    startEndlessTimer() {
        this.clearCombatTimer();
        if (this.gameMode !== 'endless' || this.gameState.gameOver) return;

        this.gameState.timeLimit = this.getEndlessTimeLimit(this.gameState.slotCount);
        this.gameState.timeLeft = this.gameState.timeLimit;
        this.updateEndlessHud();

        this.combatTimerId = setInterval(() => {
            if (this.gameMode !== 'endless' || this.gameState.solved || this.els.modal.classList.contains('active')) return;
            this.gameState.timeLeft -= 1;
            this.updateEndlessHud();
            if (this.gameState.timeLeft <= 0) {
                this.handleEndlessTimeout();
            }
        }, 1000);
    }

    startStoryTimer() {
        this.clearCombatTimer();
        if (this.gameMode !== 'story' || this.gameState.gameOver || !this.gameState.timeLimit) return;

        this.gameState.timeLeft = this.gameState.timeLimit;
        this.updateEndlessHud();

        this.combatTimerId = setInterval(() => {
            if (this.gameMode !== 'story' || this.gameState.solved || this.els.modal.classList.contains('active')) return;
            this.gameState.timeLeft -= 1;
            this.updateEndlessHud();
            if (this.gameState.timeLeft <= 0) {
                this.handleStoryTimeout();
            }
        }, 1000);
    }

    handleStoryTimeout() {
        this.clearCombatTimer();
        if (this.gameMode !== 'story' || this.gameState.gameOver || !this.gameState.timeLimit) return;

        this.gameState.input = this.gameState.input.map((value, index) => this.gameState.hints.includes(index) ? value : null);
        this.gameState.selectedSlot = this.getNextSelectableSlot(0);
        if (window.audio) window.audio.playWarning ? window.audio.playWarning() : window.audio.playError();
        this.showMessage('限時已到，這次調配被迫重置。', 'error');
        this.updateGameUI();

        setTimeout(() => {
            if (!this.gameState.solved && !this.gameState.gameOver) this.startStoryTimer();
        }, 250);
    }

    handleEndlessTimeout() {
        this.clearCombatTimer();
        if (this.gameMode !== 'endless' || this.gameState.gameOver) return;

        this.gameState.hp = Math.max(0, this.gameState.hp - 1);
        this.gameState.input = this.gameState.input.map((value, index) => this.gameState.hints.includes(index) ? value : null);
        this.els.combatEnemy?.classList.add('attacking');
        this.els.combatStage?.querySelector('.combat-player')?.classList.add('taking-damage');

        // Cute attack sparkle particles around enemy
        const enemyEl = this.els.combatEnemy;
        if (enemyEl) {
            const rect = enemyEl.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height * 0.4;
            this.particles.createExplosion(cx, cy, 15, {
                variant: 'spark',
                colors: ['#ff6b9d', '#ffd166', '#ff8fab', '#ffadca'],
                distance: [20, 60],
                minSize: 6,
                maxSize: 14,
                duration: 800
            });
            // Impact particles on player
            setTimeout(() => {
                const playerEl = this.els.combatStage?.querySelector('.combat-player');
                if (playerEl) {
                    const pr = playerEl.getBoundingClientRect();
                    this.particles.createExplosion(pr.left + pr.width / 2, pr.top + pr.height / 2, 8, {
                        variant: 'mist',
                        colors: ['#ef476f', '#ffd6e0', '#ff8fab'],
                        distance: [10, 30],
                        minSize: 5,
                        maxSize: 10,
                        duration: 600
                    });
                }
            }, 250);
        }

        setTimeout(() => {
            this.els.combatStage?.querySelector('.combat-player')?.classList.remove('taking-damage');
        }, 400);
        if (window.audio) window.audio.playWarning ? window.audio.playWarning() : window.audio.playError();
        this.showMessage('密碼推理逾時，目標脫逃反撲！', 'error');
        this.updateGameUI();

        if (this.gameState.hp <= 0) {
            this.handleGameOver('hp');
            return;
        }

        setTimeout(() => {
            this.els.combatEnemy?.classList.remove('attacking');
            this.startEndlessTimer();
        }, 700);
    }


    setupBubbleBoard(title, desc, slotCount = 5, levelData = null) {
        this.clearCombatTimer();
        this.els.gameTitle.textContent = title;
        this.els.gameDesc.textContent = desc;
        this.els.headerTitle.textContent = '故事模式';
        this.applyGameLayoutMetrics(slotCount, 'bubble');
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
        
        // 增加難度：限制交換次數
        // 嚴格模式：格數 * 1.2 (無條件進位)。例如 5 格 = 6 次交換
        this.gameState.maxSwaps = Math.ceil(slotCount * 1.2) + (levelData?.difficulty || 0);
        this.gameState.swapsLeft = this.gameState.maxSwaps;



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
            <div class="bubble-status">
                <span>步數：${this.gameState.turn}</span>
                <span class="swap-limit ${this.gameState.swapsLeft <= 2 ? 'danger' : ''}">剩餘交換次數：${this.gameState.swapsLeft}</span>
            </div>
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
                    this.gameState.swapsLeft--;
                    this.gameState.selectedBubbleIndex = null;
                    this.gameState.isSwapping = false;
                    this.renderBubbleUI();
                    
                    if (this.gameState.swapsLeft <= 0 && !this.checkBubbleWin(true)) {
                        this.handleBubbleFailure();
                    } else {
                        this.checkBubbleWin();
                    }
                }, 400);

            } else {
                // Not adjacent, just select the new one
                this.gameState.selectedBubbleIndex = idx;
                if (window.audio && window.audio.playClick) window.audio.playClick();
                this.renderBubbleUI();
            }
        }
    }

    checkBubbleWin(silent = false) {
        if (this.gameState.input.join(',') === this.gameState.secret.join(',')) {
            if (silent) return true;
            this.gameState.solved = true;
            this.clearCombatTimer();
            if (window.audio && window.audio.playSuccess) window.audio.playSuccess();
            const bContainer = document.getElementById('bubble-container');
            const nodes = bContainer.querySelectorAll('.bubble-node');
            nodes.forEach(n => n.classList.add('sorted'));
            
            setTimeout(() => {
                this.handleSolve();
            }, 1000);
            return true;
        }
        return false;
    }

    handleBubbleFailure() {
        this.gameState.solved = true;
        this.clearCombatTimer();
        if (window.audio && window.audio.playError) window.audio.playError();
        
        showMessage("交換次數用盡，推理失敗！", "error");
        setTimeout(() => {
            this.showStoryResult(this.gameState.input, { exact: 0, totalSlots: this.gameState.slotCount, turns: this.gameState.turn, hintUsed: false }, 0);
        }, 1500);
    }


    setupBoard(title, desc, rule, slotCount = 5, levelData = null) {
        this.clearCombatTimer();
        if (rule === 'bubble') return this.setupBubbleBoard(title, desc, slotCount, levelData);
        this.els.gameTitle.textContent = title;
        this.els.gameDesc.textContent = desc;
        // Set correct header title per mode
        if (this.els.headerTitle) {
            if (this.gameMode === 'daily') this.els.headerTitle.textContent = '每日推理';
            else if (this.gameMode === 'endless') this.els.headerTitle.textContent = '怪獸追跡';
            else this.els.headerTitle.textContent = '故事模式';
        }
        this.applyGameLayoutMetrics(slotCount, rule);
        this.gameState.slotCount = slotCount;
        this.gameState.maxMana = this.gameState.maxMana || this.getModeMaxMana(this.gameMode);
        this.gameState.secret = this.generateSecret(rule, slotCount, Math.random);
        this.gameState.input = Array(slotCount).fill(null);
        this.gameState.turn = 0;
        this.gameState.hints = [];
        this.gameState.solved = false;
        this.gameState.levelData = levelData;
        this.gameState.timeLimit = this.gameMode === 'story' && levelData?.timeLimit ? levelData.timeLimit + this.getStoryTimerBonus() : 0;
        this.gameState.timeLeft = this.gameState.timeLimit || 0;
        this.gameState.selectedSlot = 0;

        // Setup visual slots dynamically
        this.els.slotsContainer.innerHTML = '';
        for (let i = 0; i < slotCount; i++) {
            const d = document.createElement('div');
            d.className = 'slot';
            d.dataset.index = i;
            this.els.slotsContainer.appendChild(d);
        }
        // Save current DOM slots references
        this.els.slots = Array.from(this.els.slotsContainer.querySelectorAll('.slot'));

        const hintText = this.gameMode === 'endless'
            ? `追跡說明：<br>1. 先確認迷霧規格「${levelData.ruleLabel}」<br>2. 點格位後輸入數字，完成 ${slotCount} 格推理<br>3. 每輪都會留下 A / B 紀錄，倒數歸零前要鎖定答案。`
            : levelData
                ? `案件說明：<br>1. 先讀規格「${levelData.ruleLabel}」<br>2. 點選下方空格，再輸入 ${slotCount} 位數字<br>3. 提交後會留下每一輪的 A / B 紀錄，幫你縮小答案範圍。`
                : '等待輸入序列...<br>先點選格位，再點數字，精確的推理將是節省推理力的唯一出路。';
        this.els.history.innerHTML = `<div class="empty-hint">${hintText}</div>`;
        this.updateCombatStage();
        this.updateGameUI();
        requestAnimationFrame(() => this.updateLayoutMetrics());
        if (this.gameMode === 'endless') this.startEndlessTimer();
        else if (this.gameMode === 'story' && this.gameState.timeLimit) this.startStoryTimer();
    }

    getNextSelectableSlot(startIndex = 0) {
        const total = this.gameState.slotCount || 0;
        if (!total) return -1;

        for (let offset = 0; offset < total; offset++) {
            const idx = (startIndex + offset) % total;
            if (!this.gameState.hints.includes(idx) && this.gameState.input[idx] === null) {
                return idx;
            }
        }

        for (let offset = 0; offset < total; offset++) {
            const idx = (startIndex + offset) % total;
            if (!this.gameState.hints.includes(idx)) return idx;
        }

        return -1;
    }

    setSelectedSlot(index) {
        if (index < 0 || index >= this.gameState.slotCount) return;
        if (this.gameState.hints.includes(index)) return;
        this.gameState.selectedSlot = index;
        this.updateGameUI();
    }

    shuffleSequence(sequence, rng = Math.random) {
        const clone = [...sequence];
        for (let i = clone.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [clone[i], clone[j]] = [clone[j], clone[i]];
        }
        return clone;
    }

    getCountMap(sequence) {
        return sequence.reduce((map, id) => {
            map[id] = (map[id] || 0) + 1;
            return map;
        }, {});
    }

    validatePattern(rule, sequence, slotCount = sequence.length) {
        // 1A2B: just check length and uniqueness
        if (!Array.isArray(sequence) || sequence.length !== slotCount) return false;
        return new Set(sequence).size === sequence.length;
    }

    findValidSequence(rule, slotCount, rng = Math.random) {
        // 1A2B: just pick slotCount unique digits
        return this.generateSecret(rule, slotCount, rng);
    }

    generateSecret(rule, slotCount, rng = Math.random) {
        // 1A2B: Generate slotCount unique digits from 1-9
        const digits = [1,2,3,4,5,6,7,8,9].map(d => String(d));
        // Shuffle using rng
        for (let i = digits.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [digits[i], digits[j]] = [digits[j], digits[i]];
        }
        return digits.slice(0, slotCount);
    }

    handleIngredientTap(id) {
        const selected = typeof this.gameState.selectedSlot === 'number'
            ? this.gameState.selectedSlot
            : this.getNextSelectableSlot(0);
        if (selected === -1) {
            this.showMessage('所有格位都已填滿，可點擊格位重新調整。', 'error');
            return;
        }

        if (!this.gameState.hints.includes(selected)) {
            this.gameState.input[selected] = id;
            if (window.audio) window.audio.playScan();
            const slotRect = this.els.slots[selected]?.getBoundingClientRect();
            if (slotRect) this.particles.createCauldronPulse(slotRect.left + slotRect.width / 2, slotRect.top + slotRect.height / 2);
            this.gameState.selectedSlot = this.getNextSelectableSlot(selected + 1);
            this.updateGameUI();
        }
    }

    clearSlot(idx) {
        if (this.gameState.hints.includes(idx)) return;
        this.gameState.input[idx] = null;
        this.gameState.selectedSlot = idx;
        if (window.audio) window.audio.playClick();
        this.updateGameUI();
    }

    getHintCost() {
        let base = 30;
        return base + Math.floor(this.currentLevel / 2);
    }

    getSubmitCost() {
        if (this.gameMode === 'endless') return 6 + Math.max(0, (this.gameState.slotCount || 3) - 3) * 2;
        if (this.gameMode === 'story' || this.gameMode === 'daily') return 5 + Math.floor((this.currentLevel || 1) / 5);
        return 5;
    }

    useHint() {
        // Disabled logic for high levels > 25
        if (this.currentLevel >= 81 && this.gameMode === 'story') {
            this.showMessage('高難度限制：查閱線索已被事務所封鎖！', 'error');
            return;
        }

        const cost = this.getHintCost();
        if (!this.consumeMana(cost)) return;
        if (this.gameMode === 'endless' && this.gameState.mana <= 0) {
            this.handleGameOver();
            return;
        }

        const cands = Array.from({ length: this.gameState.slotCount }, (_, idx) => idx).filter(i => !this.gameState.hints.includes(i));
        if (!cands.length) return;

        this.gameState.hintPenalty = true;
        this.showMessage('動用線索：評分鎖定為 1 星', 'error');

        const h = cands[Math.floor(Math.random() * cands.length)];
        this.gameState.hints.push(h);
        this.gameState.input[h] = this.gameState.secret[h];
        if (this.gameState.selectedSlot === h) {
            this.gameState.selectedSlot = this.getNextSelectableSlot(h + 1);
        }
        if (window.audio) window.audio.playScaffold();
        const slotRect = this.els.slots[h]?.getBoundingClientRect();
        if (slotRect) this.particles.createExplosion(slotRect.left + slotRect.width / 2, slotRect.top + slotRect.height / 2, 10, { variant: 'spark', colors: ['#fff4bf', '#d8f3ff', '#f4d6ff'], distance: [18, 52], duration: 900 });
        this.updateGameUI();
    }

    submitPotion() {
        if (this.gameState.input.some(s => s === null)) return;

        const cost = this.getSubmitCost();

        if (!this.consumeMana(cost)) return;

        this.gameState.turn++;
        this.particles.createCauldronPulse(window.innerWidth / 2, window.innerHeight * 0.72);

        this.els.combatStage?.querySelector('.combat-player')?.classList.add('attacking');
        setTimeout(() => {
            this.els.combatStage?.querySelector('.combat-player')?.classList.remove('attacking');
        }, 320);

        const res = this.scoreGuess(this.gameState.input, this.gameState.secret);
        this.addHistoryRow([...this.gameState.input], res);

        if (res.exact > 0) {
            this.triggerHaptic(res.exact === this.gameState.slotCount ? 'success' : 'medium');
            this.els.combatStage?.querySelector('.combat-player')?.classList.add('success');
            setTimeout(() => {
                this.els.combatStage?.querySelector('.combat-player')?.classList.remove('success');
            }, 600);
        }

        if (res.exact > 0 && res.exact < this.gameState.slotCount) {
            this.els.combatEnemy?.classList.add('taking-damage');
            setTimeout(() => {
                this.els.combatEnemy?.classList.remove('taking-damage');
            }, 400);
        }

        if (res.exact === this.gameState.slotCount) this.handleSolve();
        else {
            if (window.audio) window.audio.playSkill();
            this.particles.createExplosion(window.innerWidth / 2, window.innerHeight * 0.45, 12, { variant: 'mist', colors: ['#a9def9', '#d0f4de', '#e4c1f9'], distance: [10, 55], minSize: 8, maxSize: 16, duration: 1400 });
            this.gameState.input = this.gameState.input.map((v, i) => this.gameState.hints.includes(i) ? v : null);
            this.updateGameUI();
            if (this.gameState.mana <= 0) this.handleGameOver();
            else if (this.gameMode === 'endless') this.startEndlessTimer();
            else if (this.gameMode === 'story' && this.gameState.timeLimit) this.startStoryTimer();
        }
    }

    scoreGuess(guess, secret) {
        let exact = 0, partial = 0, gR = {}, sR = {};
        for (let i = 0; i < this.gameState.slotCount; i++) {
            if (guess[i] === secret[i]) exact++;
            else {
                gR[guess[i]] = (gR[guess[i]] || 0) + 1;
                sR[secret[i]] = (sR[secret[i]] || 0) + 1;
            }
        }
        for (let k in gR) partial += Math.min(gR[k], sR[k] || 0);
        return { exact, partial };
    }

    consumeMana(cost) {
        if (this.gameState.mana <= 0) { 
            this.triggerScreenShake();
            this.handleGameOver(); 
            return false; 
        }
        this.gameState.mana -= cost;
        this.data.stats.manaSpent += cost;
        if (this.gameState.mana < 0) this.gameState.mana = 0;
        this.updateGameUI();
        if (this.gameState.mana === 0 && this.gameState.turn > 0) return true;
        return true;
    }

    handleEndlessVictory() {
        this.clearCombatTimer();
        this.gameState.solved = true;
        this.gameState.defeated++;
        const timeBonus = Math.max(0, this.gameState.timeLeft || 0) * 6;
        const baseScore = 80 + this.gameState.slotCount * 35 + timeBonus;
        const scoreGain = Math.floor(baseScore * this.getEndlessScoreMultiplier());
        const coinReward = Math.max(80, Math.floor((scoreGain / 3.5) * this.getCoinRewardMultiplier('endless')));
        const manaRecovery = 10 + this.gameState.slotCount * 4 + Math.floor((this.gameState.timeLeft || 0) / 2);

        this.gameState.score += scoreGain;
        this.gameState.scoreCoins += coinReward;
        this.gameState.mana = Math.min(this.gameState.maxMana, this.gameState.mana + manaRecovery);
        this.data.coins += coinReward;
        this.data.stats.endlessBestScore = Math.max(this.data.stats.endlessBestScore, this.gameState.score);
        this.data.stats.endlessBestDefeated = Math.max(this.data.stats.endlessBestDefeated, this.gameState.defeated);
        this.saveData({ showToast: false });

        if (window.audio) window.audio.playSuccess();
        this.els.combatEnemy?.classList.add('defeated');
        this.particles.createCelebration(window.innerWidth * 0.72, window.innerHeight * 0.34);

        this.showVictoryOverlay(scoreGain, coinReward);
        this.showMessage(`追跡紀錄鎖定成功，+${scoreGain} 分，回復 ${manaRecovery} 推理力`);
        this.updateGameUI();
        this.renderInventoryPanel();

        // Always use setTimeout(proceed) — never call openMonsterDropModal here.
        // Doing so would reveal the monster name/image before round 8.
        setTimeout(() => {
            if (this.gameState.gameOver) return;
            const orderCount = this.gameState.orderCount || 0;

            if (orderCount >= 8) {
                // ── Round 8: reveal identity, show unlock modal, navigate to bestiary ──
                const enemy = this.gameState.currentEnemy;
                const scout = this.getCharacterProfile('scout');
                const iris = this.getCharacterProfile('iris');
                const discoveryLines = [
                    {
                        speaker: scout.name,
                        portrait: scout.portraitClass,
                        text: `追跡完成！目標怪獸的真面目終於浮現了——是「${enemy?.name || '未知怪獸'}」！`
                    },
                    {
                        speaker: iris.name,
                        portrait: iris.portraitClass,
                        text: `圖鑑資料已鎖定。請解鎖「${enemy?.name || '這隻怪獸'}」的圖鑑條目，生物資料才會完整封存。`
                    }
                ];
                this.dialogue.play(discoveryLines, () => {
                    const monsterId = enemy?.id;
                    if (monsterId && !this.isMonsterCaptured(monsterId)) {
                        if (!this.data.monsters) this.data.monsters = { activeMonsterId: '', captured: {}, pendingUnlocks: {} };
                        if (!this.data.monsters.pendingUnlocks) this.data.monsters.pendingUnlocks = {};
                        this.data.monsters.pendingUnlocks[monsterId] = true;
                        this.saveData({ showToast: false });
                        const monsterEntry = this.getMonsterEntry(monsterId);
                        
                        // Particle explosion for the discovery!
                        this.particles.createCelebration(window.innerWidth / 2, window.innerHeight / 2);
                        
                        // Open the real unlock modal with extra effects
                        this.openMonsterDropModal({ hit: true, duplicate: false, monster: monsterEntry, unlockCost: this.getMonsterUnlockCost(monsterId) });
                        
                        // Apply special 'Unlock' styling and animations
                        this.els.monsterDropModal?.classList.add('is-unlocking');
                        this.els.monsterDropImage?.classList.add('monster-unlock-celebration');
                        if (this.els.monsterDropTitle) {
                            this.els.monsterDropTitle.textContent = `成就達成：圖鑑解鎖成功！`;
                            this.els.monsterDropTitle.classList.add('unlock-title-anim');
                        }
                        
                        if (this.els.btnMonsterDropAction) {
                            this.els.btnMonsterDropAction.textContent = '正式解鎖圖鑑';
                            this.els.btnMonsterDropAction.onclick = () => {
                                // Clear special classes on close
                                this.els.monsterDropModal?.classList.remove('is-unlocking');
                                this.els.monsterDropImage?.classList.remove('monster-unlock-celebration');
                                this.els.monsterDropTitle?.classList.remove('unlock-title-anim');
                                
                                this.unlockDroppedMonster(monsterId);
                                this.setModalActive(this.els.monsterDropModal, false);
                                this.finishEndlessRun();
                                setTimeout(() => {
                                    this.playTransitionOverlay(() => {
                                        this.showLocation('hub');
                                        this.switchHubPanel('inventory');
                                        document.querySelectorAll('.inv-tab-btn').forEach(b => b.classList.remove('active'));
                                        const monstersTab = document.querySelector('.inv-tab-btn[data-inv-tab="monsters"]');
                                        if (monstersTab) monstersTab.classList.add('active');
                                        this.renderInventoryPanel();
                                    });
                                }, 2500);
                            };
                        }
                    } else {
                        this.finishEndlessRun();
                    }
                });
                return;
            }

            // ── Rounds 1-7: auto dialogue with clue hint, then continue hunting ──
            const enemy = this.gameState.currentEnemy;
            const scout = this.getCharacterProfile('scout');
            const iris  = this.getCharacterProfile('iris');

            // Progressive clue lines — identity stays hidden, atmosphere builds
            const clueProgressLines = [
                // round 1
                `迷霧中有不尋常的動靜……目標的蹤跡被初步鎖定了。`,
                // round 2
                `牠的移動留下了新的線索，形體還是模糊，但活動範圍縮小了。`,
                // round 3
                `又捕捉到一頁資料。輪廓開始有了些形狀，繼續跟。`,
                // round 4
                `線索第四頁。牠似乎察覺到被追了，但還沒逃遠。`,
                // round 5
                `資料已過半。隱約能看出一些特徵——不過現在不是停下來的時候。`,
                // round 6
                `快了。這一頁資料讓身形更清晰了，再撐兩關就能看清全貌。`,
                // round 7
                `最後一步之前——目標就在前方，圖鑑條目幾乎完整，繼續！`
            ];
            const lineIdx = Math.min(orderCount - 1, clueProgressLines.length - 1);
            const progressText = clueProgressLines[lineIdx];

            // Alternate speaker each round for variety
            const speakerA = orderCount % 2 === 1 ? scout : iris;
            const speakerB = orderCount % 2 === 1 ? iris  : scout;

            const trackingLines = [
                {
                    speaker: speakerA.name,
                    portrait: speakerA.portraitClass,
                    text: `【追跡 ${orderCount}/8】${progressText}`
                },
                {
                    speaker: speakerB.name,
                    portrait: speakerB.portraitClass,
                    text: `繼續推理，別讓牠跑掉。`
                }
            ];

            // Play dialogue and auto-proceed — no modal, no button needed
            this.dialogue.play(trackingLines, () => {
                this.nextEndlessOrder();
            });
        }, 900);
    }


    finishEndlessRun() {
        this.clearCombatTimer();
        this.gameState.gameOver = true;
        this.gameState.solved = true;
        this.showResultModal({
            success: true,
            title: '怪獸追跡成功',
            desc: `你已完成 8/8 全程追跡，累積 ${this.gameState.score || 0} 分。`,
            story: '目標怪獸已成功鎖定並記錄在案。追跡報告已封存，是否回到事務所領取報酬？',
            stars: 3,
            reward: this.gameState.scoreCoins || 0,
            actionText: '回到事務所'
        });
    }

    showVictoryOverlay(score, coins) {
        const overlay = document.getElementById('victory-overlay');
        const statsRow = document.getElementById('victory-stats-row');
        if (!overlay || !statsRow) return;
        
        statsRow.innerHTML = `
            <div class="victory-stat-box"><span class="victory-stat-label">得分</span><span class="victory-stat-value">+${score}</span></div>
            <div class="victory-stat-box"><span class="victory-stat-label">英鎊</span><span class="victory-stat-value">+${coins}</span></div>
        `;
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('hidden'), 2000);
    }

    handleSolve() {
        if (this.gameMode === 'endless') {
            this.handleEndlessVictory();
            return;
        }

        this.gameState.solved = true;
        if (window.audio) window.audio.playSuccess();
        this.particles.createCelebration(window.innerWidth / 2, window.innerHeight * 0.38);
        this.particles.createCelebration(window.innerWidth * 0.25, window.innerHeight * 0.3);
        this.particles.createCelebration(window.innerWidth * 0.75, window.innerHeight * 0.3);
        this.updateGameUI();

        let stars = 1;
        if (!this.gameState.hintPenalty) {
            if (this.gameState.turn <= 3) stars = 3;
            else if (this.gameState.turn <= 6) stars = 2;
        }

        const currentLevelData = this.gameMode === 'story'
            ? this.levels.find(l => l.id === this.currentLevel)
            : this.gameState.levelData;
        
        let reward = 0;
        if (this.gameMode === 'endless') {
            reward = 10 + Math.min(50, ((this.gameState.orderCount || 1) - 1) * 2);
        } else if (this.gameMode === 'story') {
            // 1星: base, 2星: 1.5*base, 3星: 2*base
            const starMult = 1 + (stars - 1) * 0.5;
            reward = Math.floor(this.getStoryRewardBase(currentLevelData) * starMult);
        } else if (this.gameMode === 'daily') {
            reward = this.canClaimDailyReward() ? 500 : 10;
        } else {
            reward = 20 * stars;
        }

        if (this.gameMode !== 'daily') {
            reward = Math.max(1, Math.floor(reward * this.getCoinRewardMultiplier(this.gameMode)));
        }
        this.gameState.dailyRewardGranted = this.gameMode === 'daily' && reward > 0;
        this.gameState.weeklyRewardGranted = false;

        this.gameState.scoreCoins += reward;
        this.data.coins += reward;
        this.data.stats.wins++;
        this.data.stats.stars += stars;

        if (this.gameMode === 'story') {
            if (this.data.highestLevel === this.currentLevel) this.data.highestLevel++;
            const prev = this.data.levelStars[this.currentLevel] || 0;
            if (stars > prev) this.data.levelStars[this.currentLevel] = stars;
        } else if (this.gameMode === 'daily') {
            this.data.stats.dailyWins++;
            if (reward > 0) {
                this.data.daily.rewardDate = this.dailyChallenge.dateKey;
            }
            if (this.data.daily.bestDate !== this.dailyChallenge.dateKey || this.data.daily.bestTurns === 0 || this.gameState.turn < this.data.daily.bestTurns) {
                this.data.daily.bestDate = this.dailyChallenge.dateKey;
                this.data.daily.bestTurns = this.gameState.turn;
            }
            this.markWeeklyStamp(this.dailyChallenge.dateKey);
            if (this.maybeClaimWeeklyReward()) {
                this.gameState.weeklyRewardGranted = true;
                reward += 500;
                this.gameState.scoreCoins += 500;
            }
        }

        this.saveData();

        const levelData = currentLevelData;

        // 檢查是否有下一階段
        if (this.gameMode === 'story' && this.gameState.stages && this.gameState.currentStageIndex < this.gameState.stages.length - 1) {
            const currentStage = this.gameState.stages[this.gameState.currentStageIndex];
            const nextStage = this.gameState.stages[this.gameState.currentStageIndex + 1];
            this.gameState.currentStageIndex++;

            setTimeout(() => {
                // 播放階段過度對話
                const midDialogue = currentStage.closingDialogue || [
                    { speaker: '夏洛特', text: '這只是開胃菜...真正的難題還在後頭。', portrait: 'portrait-iris' }
                ];
                this.dialogue.play(midDialogue, () => {
                    const nextOpening = nextStage.openingDialogue || [
                        { speaker: '你', text: '接下來的編碼更複雜了，我們必須加快速度。', portrait: 'portrait-client' }
                    ];
                    this.dialogue.play(nextOpening, () => this.startPattern(this.currentLevel));
                });
            }, 800);
            return;
        }

        let postStory = [];

        if (this.gameMode === 'daily') {
            postStory = [
                {
                    speaker: this.getCharacterProfile('scout').name,
                    portrait: this.getCharacterProfile('scout').portraitClass,
                    text: '每日推理完成，10 英鎊已入帳。你可以隨時再挑戰。'
                },
                {
                    speaker: this.getCharacterProfile('iris').name,
                    portrait: this.getCharacterProfile('iris').portraitClass,
                    text: `這題我花了 ${this.gameState.turn} 回合。繼續挑戰可以繼續積累經驗。`
                }
            ];
        } else if (this.gameState.hintPenalty) {
            postStory = [
                {
                    speaker: this.getCharacterProfile('mentor').name,
                    portrait: this.getCharacterProfile('mentor').portraitClass,
                    text: '你靠線索把它硬拉過線了，這次只能拿到最低限度的及格分。'
                },
                {
                    speaker: this.getCharacterProfile('iris').name,
                    portrait: this.getCharacterProfile('iris').portraitClass,
                    text: '下次得靠真正的推理把它做漂亮。'
                }
            ];
        } else {
            postStory = levelData ? this.buildVictoryDialogue(levelData, stars) : [
                {
                    speaker: this.getCharacterProfile('iris').name,
                    portrait: this.getCharacterProfile('iris').portraitClass,
                    text: '推理完成了。至少這次，我把局面收住了。'
                }
            ];
        }

        setTimeout(() => {
            const isLevel100 = this.gameMode === 'story' && this.currentLevel === 100;
            if (isLevel100) {
                this.nextHubPanel = 'daily';
            } else {
                this.nextHubPanel = 'home';
            }

            const openResult = () => this.showResultModal({
                    success: true,
                    title: this.getResultTitle(stars),
                    desc: isLevel100 
                        ? '所有委託已暫時完成。感謝您的出色推理！點擊回到事務所即可進入每日任務區塊。'
                        : (this.gameMode === 'story'
                            ? `${levelData ? levelData.client : '委託人'} 的案件已完成，事務所完成本次評級。`
                            : this.gameMode === 'daily'
                                ? this.gameState.weeklyRewardGranted
                                    ? '每日推理完成，10 英鎊與本週七日結算獎勵都已入帳。'
                                    : '每日推理完成，10 英鎊已入帳。'
                                : '怪獸追跡本輪完成，得分與英鎊已入帳。'),
                    story: levelData
                        ? `${this.gameMode === 'daily' ? '每日題目回顧' : '案件回顧'}｜${levelData.request}${this.gameState.weeklyRewardGranted ? '｜本週七日蓋章完成 +500' : ''}`
                        : '本輪密碼已記錄進追蹤檔案。',
                    stars,
                    reward,
                    actionText: this.gameMode === 'story' ? '回到事務所' : this.gameMode === 'daily' ? '回到事務所' : '撤退',
                    levelData
                });

            if (this.gameMode === 'story') {
                this.openEndingParchment(levelData, () => {
                    this.dialogue.play(postStory, openResult);
                });
            } else {
                this.dialogue.play(postStory, openResult);
            }
        }, 800);
    }

    triggerScreenShake() {
        if (!this.els.combatStage) return;
        this.els.combatStage.classList.add('shake-effect');
        setTimeout(() => {
            this.els.combatStage.classList.remove('shake-effect');
        }, 400);
    }

    handleGameOver(reason = 'mana') {
        this.clearCombatTimer();
        this.gameState.gameOver = true;
        this.gameState.solved = true;
        if (this.gameMode === 'endless') {
            this.data.stats.endlessBestScore = Math.max(this.data.stats.endlessBestScore, this.gameState.score || 0);
            this.data.stats.endlessBestDefeated = Math.max(this.data.stats.endlessBestDefeated, this.gameState.defeated || 0);
            this.saveData({ showToast: false });
        }
        if (window.audio) window.audio.playError();
        this.particles.createExplosion(window.innerWidth / 2, window.innerHeight * 0.5, 20, { variant: 'mist', colors: ['#ffd6e0', '#d9d9d9', '#bde0fe'], distance: [20, 70], minSize: 10, maxSize: 18, duration: 1500 });
        this.updateGameUI();

        setTimeout(() => {
            const levelData = this.gameMode === 'story'
                ? this.levels.find(l => l.id === this.currentLevel)
                : this.gameState.levelData || null;
            const lines = this.gameMode === 'daily'
                ? [
                    {
                        speaker: this.getCharacterProfile('scout').name,
                        portrait: this.getCharacterProfile('scout').portraitClass,
                        text: '今天的演算題還沒穩住，但每日推理不限次數，你可以立刻再試。'
                    },
                    {
                        speaker: this.getCharacterProfile('iris').name,
                        portrait: this.getCharacterProfile('iris').portraitClass,
                        text: '這回合消耗太快了。我先把剛才的錯位記下來，再重新整理節奏。'
                    }
                ]
                : this.gameMode === 'endless'
                    ? [
                        {
                            speaker: this.getCharacterProfile('scout').name,
                            portrait: this.getCharacterProfile('scout').portraitClass,
                            text: reason === 'hp' ? 'HP 已經見底，追跡紀錄到此封存。' : '推理力耗盡，密碼推理盤無法再維持。'
                        },
                        {
                            speaker: this.getCharacterProfile('iris').name,
                            portrait: this.getCharacterProfile('iris').portraitClass,
                            text: `本場追蹤 ${this.gameState.defeated || 0} 隻目標，累積 ${this.gameState.score || 0} 分。下次可以靠稱號把節奏撐得更久。`
                        }
                    ]
                    : levelData ? this.buildFailureDialogue(levelData) : [
                        {
                            speaker: this.getCharacterProfile('iris').name,
                            portrait: this.getCharacterProfile('iris').portraitClass,
                            text: '不行了...推理力已經見底了。'
                        },
                        {
                            speaker: this.getCharacterProfile('mentor').name,
                            portrait: this.getCharacterProfile('mentor').portraitClass,
                            text: '今天的見習先到這裡，先回事務所把節奏整理乾淨。'
                        }
                    ];
            const openFailedResult = () => this.showResultModal({
                    success: false,
                    title: this.gameMode === 'endless' && reason === 'hp' ? 'HP 歸零' : '推理力透支',
                    desc: this.gameMode === 'story'
                        ? '本次案件未能完成，事務所已記錄失敗報告。'
                        : this.gameMode === 'daily'
                            ? '今日挑戰未能完成，但可以立刻再次嘗試。'
                            : `怪獸追跡結算：追蹤 ${this.gameState.defeated || 0} 隻目標，累積 ${this.gameState.score || 0} 分。`,
                    story: levelData
                        ? `${this.gameMode === 'daily' ? '每日題目回顧' : '失敗回顧'}｜${levelData.request}`
                        : this.gameMode === 'endless'
                            ? `最佳紀錄：${this.data.stats.endlessBestScore} 分｜${this.data.stats.endlessBestDefeated} 隻目標`
                            : '本輪演算紀錄已封存，建議回事務所整理節奏。',
                    stars: 0,
                    reward: 0,
                    actionText: this.gameMode === 'daily' ? '回到事務所' : this.gameMode === 'endless' ? '撤退' : '回事務所休息',
                    levelData,
                    leaderboardText: ''
                });
            if (this.gameMode === 'story') openFailedResult();
            else this.dialogue.play(lines, openFailedResult);
        }, 1000);
    }

    updateGameUI() {
        if (this.gameState && this.gameState.rule === 'bubble') return; // Handled by renderBubbleUI
        const bContainer = document.getElementById('bubble-container');
        if (bContainer) bContainer.remove();
        this.els.inputConsole.classList.remove('hidden');
        this.els.paletteContainer.classList.remove('hidden');
        const maxMana = this.gameState.maxMana || this.getModeMaxMana(this.gameMode);
        const pct = (this.gameState.mana / maxMana) * 100;
        if (this.els.manaVal) this.els.manaVal.textContent = `${this.gameState.mana} / ${maxMana}`;
        if (this.els.manaFill) {
            this.els.manaFill.style.width = `${pct}%`;
            if (pct <= 20) this.els.manaFill.classList.add('danger-fill');
            else this.els.manaFill.classList.remove('danger-fill');
        }

        let filledCount = 0;
        if ((typeof this.gameState.selectedSlot !== 'number' || this.gameState.selectedSlot < 0 || this.gameState.hints.includes(this.gameState.selectedSlot))
            && !this.gameState.solved && !this.gameState.gameOver) {
            this.gameState.selectedSlot = this.getNextSelectableSlot(0);
        }

        this.els.slots.forEach((slot, i) => {
            const symId = this.gameState.input[i];
            slot.innerHTML = '';
            if (symId) {
                filledCount++;
                slot.className = 'slot filled';
                if (this.gameState.hints.includes(i)) slot.classList.add('hinted');
                const sym = this.symbols.find(s => s.id === symId);
                const tk = document.createElement('div');
                tk.className = 'token digit-token';
                tk.textContent = sym ? (sym.label || sym.id) : symId;
                slot.appendChild(tk);
            } else {
                slot.className = 'slot';
            }

            if (this.gameState.selectedSlot === i && !this.gameState.hints.includes(i) && !this.gameState.solved && !this.gameState.gameOver) {
                slot.classList.add('selected');
            }
        });

        const ok = filledCount === this.gameState.slotCount && !this.gameState.solved && !this.gameState.gameOver;
        this.els.btnSubmit.disabled = !ok;

        const isLocked = this.currentLevel >= 81 && this.gameMode === 'story';
        let hintCost = this.getHintCost();
        this.els.btnHint.textContent = isLocked ? '已封鎖' : `查閱線索 (-${hintCost})`;
        this.els.btnHint.className = isLocked ? 'btn btn-secondary locked-hint' : 'btn btn-secondary';
        this.els.btnHint.disabled = this.gameState.solved || this.gameState.gameOver || this.gameState.mana < hintCost || this.gameState.hints.length === this.gameState.slotCount || isLocked;
        const submitCost = this.getSubmitCost();
        this.els.btnSubmit.textContent = this.gameMode === 'endless' ? `提交密碼 (-${submitCost})` : `提交推理 (-${submitCost})`;
        this.updateCombatStage();
        requestAnimationFrame(() => this.updateLayoutMetrics());
    }

    addHistoryRow(guess, res) {
        if (this.gameState.turn === 1) this.els.history.innerHTML = '';

        const row = document.createElement('div');
        row.className = 'history-row';
        row.innerHTML = `
            <div class="turn-number">#${this.gameState.turn}</div>
            <div class="history-symbols">
                ${guess.map(id => {
            return `<div class="mini-symbol digit-display">${id}</div>`;
        }).join('')}
            </div>
            <div class="history-feedback">
                <div class="feedback-item">
                    <span class="ab-result">${res.exact}A ${res.partial}B</span>
                </div>
            </div>
        `;
        this.els.history.prepend(row);
    }

    renderPalette() {
        this.els.palette.innerHTML = '';
        const row1 = document.createElement('div');
        row1.className = 'palette-row';
        const row2 = document.createElement('div');
        row2.className = 'palette-row';
        this.symbols.forEach(sym => {
            const btn = document.createElement('button');
            btn.className = 'palette-btn digit-btn';
            btn.dataset.id = sym.id;
            btn.textContent = sym.label;
            (parseInt(sym.id) <= 5 ? row1 : row2).appendChild(btn);
        });
        this.els.palette.appendChild(row1);
        this.els.palette.appendChild(row2);
    }

    showMessage(text, type = 'info') {
        this.els.msg.textContent = text;
        this.els.msg.className = `show ${type}`;
        if (this.msgTimer) clearTimeout(this.msgTimer);
        this.msgTimer = setTimeout(() => this.els.msg.classList.remove('show'), 2000);
    }
}

// Boot up robustly
window.app = new DetectiveMysteryGame();
