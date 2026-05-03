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
                        caseTitles: ['幽靈列車', '失蹤工人', '地下實驗室', '隧道暗號', '封印車站', '地下河秘密', '列車劫案', '地圖謎題', '時間囊之謎', '地下鐵總結案'],
                        modes: ['1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', 'klotski']
                    }
                ]
            },
            {
                key: 'last_equation',
                actLabel: '終',
                title: '第五卷｜終局瀑聲',
                summary: '與莫里亞蒂的最終對局。',
                antagonist: '莫里亞蒂',
                chapters: [
                    {
                        key: 'royal_treasure',
                        title: '王室寶藏失蹤案',
                        slotCount: 5,
                        locale: '王室金庫',
                        clientPortrait: 'portrait-client',
                        clients: ['伊凡', '瑪莉安', '奧托', '賽門', '芙蘿拉'],
                        caseTitles: ['皇冠失竊', '密室藏寶圖', '守衛背叛', '古堡機關', '王室密道', '鑽石詛咒', '贗品替換', '保險庫之謎', '皇家追捕', '王室總結案'],
                        modes: ['1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', 'sort']
                    },
                    {
                        key: 'moriarty',
                        title: '莫里亞蒂最後挑戰',
                        slotCount: 5,
                        locale: '倫敦高塔',
                        clientPortrait: 'portrait-rival',
                        clients: ['莫里亞蒂', '代理人', '傳令', '信差', '見證人'],
                        caseTitles: ['犯罪網路', '連環爆炸預告', '雙面人', '最終密碼', '瀑布之約', '反轉真相', '幕後黑手', '致命棋局', '最後對決', '名偵探的榮耀'],
                        modes: ['1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', '1a2b', 'sort']
                    }
                ]
            }
        ];
    }

    generateCasebookLevels() {
        const arcs = this.getStoryArcCatalog();
        const levels = [];
        let id = 1;

        arcs.forEach((arc, arcIndex) => {
            arc.chapters.forEach((chapter, chapterIndexInArc) => {
                chapter.caseTitles.forEach((caseTitle, caseIndex) => {
                    const client = chapter.clients[caseIndex % chapter.clients.length];
                    const chapterIndex = arcIndex * 2 + chapterIndexInArc;
                    const mode = chapter.modes ? chapter.modes[caseIndex] : '1a2b';

                    levels.push(this.normalizePuzzleDefinition({
                        id,
                        title: caseTitle,
                        name: `案件 #${id.toString().padStart(2, '0')}：${caseTitle}`,
                        chapter: chapter.title,
                        chapterKey: chapter.key,
                        chapterIndex,
                        chapterOrder: caseIndex + 1,
                        storyArcKey: arc.key,
                        storyArcTitle: arc.title,
                        storyArcIndex: arcIndex,
                        client,
                        request: `破解 ${chapter.slotCount} 位數密碼鎖，從 ${chapter.locale} 的案件中鎖定核心證據。`,
                        intro: `這裡是 ${chapter.locale}。案件「${caseTitle}」正在等待調查。`,
                        perfect: `案件「${caseTitle}」已結案！真相水落石出。`,
                        slotCount: chapter.slotCount,
                        rule: mode,
                        ruleLabel: mode === '1a2b' ? `${chapter.slotCount} 位數密碼` : '特殊解謎',
                        mentor: '',
                        timeLimit: 0
                    }));
                    id += 1;
                });
            });
        });

        return levels;
    }
