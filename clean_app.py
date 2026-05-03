import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the start and end patterns for the section we want to replace
start_marker = 'generateLevels() {'
end_marker = 'generateExtendedStoryLevels(baseCount = 30) {'

start_pos = content.find(start_marker)
end_pos = content.find(end_marker)

if start_pos != -1 and end_pos != -1:
    # We want to keep the start_marker itself if it's part of the new content
    # or just replace everything between the start of the function and the start of the next one.
    
    new_generate_levels = """generateLevels() {
        const chapters = [
            {
                key: 'alleys',
                title: '霧都暗巷',
                mentor: '西拉斯警督：「倫敦的霧，比你想的還要深。」',
                orders: [
                    { title: '消失的懷錶', client: '亞伯', request: '純金懷錶在密室消失了。', rule: 'unique', ruleLabel: '線索分離', clue: '四格線索皆不可重複。', intro: '第一份來自貝克街的委託。', perfect: '完美找回！', good: '找回來了，但有劃傷。', rough: '錶是找回來了，但嫌疑人跑了。', fail: '線索斷了。' },
                    { title: '深夜足跡', client: '老湯姆', request: '花園裡出現了奇怪的足跡。', rule: 'repeat-one', ruleLabel: '足跡重合', clue: '四組中會有一組重複。', intro: '泥土還很濕潤。', perfect: '識破小賊！', good: '抓到了，但花壇損壞。', rough: '證據不夠充分。', fail: '雨水沖刷了足跡。' },
                    { title: '加密便條', client: '小皮', request: '報紙夾縫留了便條。', rule: 'bookend', ruleLabel: '暗碼對應', clue: '首尾文字必須相同。', intro: '字跡工整的便條。', perfect: '解開暗碼！', good: '解開大半。', rough: '地點還是謎。', fail: '只是張廢紙。' },
                    { title: '三種證言', client: '瑪麗', request: '房客證詞矛盾。', rule: 'three-types', ruleLabel: '三方證詞', clue: '線索只涉及三個人。', intro: '旅館充滿了流言。', perfect: '真相大白！', good: '鎖定範圍。', rough: '證詞太混亂。', fail: '被帶進死胡同。' },
                    { title: '成對耳環', client: '索菲亞', request: '耳環丟了一隻。', rule: 'twin-pairs', ruleLabel: '對位搜尋', clue: '四格線索兩兩成對。', intro: '莊園裡的盜竊。', perfect: '感激盡！', good: '耳環有裂痕。', rough: '只找到底座。', fail: '神祕消失。' },
                    { title: '全員追蹤', client: '維克', request: '跨國盜竊案。', rule: 'spectrum', ruleLabel: '全員追蹤', clue: '五格代表五名嫌犯。', intro: '警督盯著我級別。', perfect: '全員落網！', good: '首腦被抓。', rough: '案子破了但受傷。', fail: '被騙得團團轉。' }
                ]
            },
            {
                key: 'clocktower',
                title: '血色鐘塔',
                mentor: '「每一聲鐘響，都可能是一個訊號。」',
                orders: [
                    { title: '碼頭黑影', client: '傑克', request: '霧中的黑影重複盤旋。', rule: 'repeat-one', ruleLabel: '暗影重現', clue: '五格中有一項重複。', intro: '港口的鹹腥味。', perfect: '識破詭計！', good: '黑影消失了。', rough: '虛驚一場。', fail: '差點命喪碼頭。' },
                    { title: '酒館流言', client: '露西', request: '三個醉漢看見了殺手。', rule: 'three-types', ruleLabel: '三方對質', clue: '五格中只涉及三種特徵。', intro: '廉價麥芽酒味。', perfect: '堵住殺手！', good: '拿到名片。', rough: '胡言亂語。', fail: '被醉漢圍毆。' },
                    { title: '沉重貨箱', client: '漢克', request: '貨箱沉得不正常。', rule: 'weighted', ruleLabel: '重物核對', clue: '主料佔據絕對主體。', intro: '刺耳的摩擦聲。', perfect: '查獲軍火！', good: '主謀逃走了。', rough: '記錯重量。', fail: '貨箱爆炸。' },
                    { title: '斷裂鎖鏈', client: '莫里', request: '鐘塔鎖鏈被腐蝕。', rule: 'bookend', ruleLabel: '鏽跡鎖定', clue: '首尾特徵對應。', intro: '鐘塔內冷如冰。', perfect: '阻止崩塌！', good: '鐘聲沙啞。', rough: '金屬疲勞。', fail: '鐘墜落了。' },
                    { title: '混亂貨清', client: '斐恩', request: '清單類別不能相鄰。', rule: 'no-adjacent', ruleLabel: '分類避雷', clue: '相鄰類別必須不同。', intro: '枯燥的數字。', perfect: '查出假帳！', good: '危機解除。', rough: '發生小洩漏。', fail: '港口大火。' },
                    { title: '最終呈堂', client: '諾曼', request: '最終審核：六個關鍵點。', rule: 'crown', ruleLabel: '最終呈堂', clue: '首尾相同，中段集中。', intro: '警督眼神犀利。', perfect: '巔峰之作！', good: '兇手自殺。', rough: '幕後在逃。', fail: '法庭駁回。' }
                ]
            },
            {
                key: 'harbor',
                title: '舊日港區',
                mentor: '「海水沖不走罪惡感。」',
                orders: [
                    { title: '幽靈符號', client: '莫里', request: '船帆上的對稱符號。', rule: 'palindrome', ruleLabel: '符號鏡像', clue: '六格特徵對稱。', intro: '霧港深處的故事。', perfect: '救回村民！', good: '財寶不見了。', rough: '惡作劇一場。', fail: '迷失在海霧。' },
                    { title: '封印箱子', client: '赫伯', request: '箱子順序不能出錯。', rule: 'no-adjacent', ruleLabel: '封印避位', clue: '相鄰類型不能重複。', intro: '海水腐蝕嚴重。', perfect: '發現地圖！', good: '箱子救回。', rough: '封印漏水。', fail: '箱子全碎。' },
                    { title: '三組線索', client: '瑪歐', request: '三組對位特徵。', rule: 'twin-pairs', ruleLabel: '三對列陣', clue: '六格形成三對。', intro: '前線真工單。', perfect: '立刻裝車！', good: '還能更快。', rough: '離要求差半步。', fail: '標記不穩。' },
                    { title: '抑霧藥劑', client: '芮娜', request: '只允許三種主味。', rule: 'three-types', ruleLabel: '三材抑霧', clue: '六格只用三種素材。', intro: '這瓶能救人。', perfect: '完美抑霧！', good: '乾淨度一般。', rough: '餘味太重。', fail: '路徑攪亂。' },
                    { title: '壓艙重心', client: '賈德', request: '單一主核撐住。', rule: 'weighted', ruleLabel: '主核壓艙', clue: '一種素材主導。', intro: '機械與人手。', perfect: '直接出港！', good: '效率一般。', rough: '不夠扎實。', fail: '重心崩塌。' },
                    { title: '港區總驗', client: '伊瑟爾', request: '六格、冠式、重心。', rule: 'crown', ruleLabel: '港區總驗', clue: '首尾相同，四材結構。', intro: '最後的委託。', perfect: '列名錄取！', good: '勉強通過。', rough: '手心冒汗。', fail: '放大猶豫。' }
                ]
            },
            {
                key: 'manor',
                title: '莊園祕聞',
                mentor: '「豪門深處藏著過去。」',
                orders: [
                    { title: '消失家主', client: '亞瑟', request: '書房門窗反鎖。', rule: 'unique', ruleLabel: '嫌疑過濾', clue: '六格皆不重複。', intro: '心懷鬼胎的人。', perfect: '救出家主！', good: '識破謊言。', rough: '家族內鬥。', fail: '被趕出莊園。' },
                    { title: '遺產暗語', client: '老僕', request: '遺囑首尾呼應。', rule: 'bookend', ruleLabel: '遺產對位', clue: '首尾文字相同。', intro: '泛黃的紙張。', perfect: '繼承成功！', good: '部分解讀。', rough: '真假難辨。', fail: '遺囑焚毀。' },
                    { title: '三方證詞', client: '律師', request: '三位繼承人。', rule: 'three-types', ruleLabel: '遺產紛爭', clue: '只涉及三種特徵。', intro: '法庭上的博弈。', perfect: '官司獲勝！', good: '證據不足。', rough: '陷入僵持。', fail: '輸掉訴訟。' },
                    { title: '雙生印章', client: '管家', request: '印章成對出現。', rule: 'split-pairs', ruleLabel: '印章辨析', clue: '五格形成兩對。', intro: '祕密的書信。', perfect: '拆穿陰謀！', good: '跑了一個。', rough: '認錯人。', fail: '被保安趕走。' },
                    { title: '規律毒性', client: '醫官', request: '毒性規律交錯。', rule: 'alternating', ruleLabel: '毒性脈衝', clue: '交替排列。', intro: '生命的賽跑。', perfect: '成功解毒！', good: '弄得滿身傷。', rough: '毒素殘留。', fail: '搶救失敗。' },
                    { title: '莊園終局', client: '爵士', request: '最後的審判。', rule: 'crown', ruleLabel: '莊園終局', clue: '六格冠式。', intro: '最後的告別。', perfect: '真相大白！', good: '留有遺憾。', rough: '慘勝一局。', fail: '真相湮滅。' }
                ]
            },
            {
                key: 'underground',
                title: '地底都市',
                mentor: '「地底由拳頭決定。」',
                orders: [
                    { title: '黑市暗號', client: '老鼠', request: '首尾接頭暗號。', rule: 'bookend', ruleLabel: '接頭對應', clue: '首尾素材相同。', intro: '地底生存法則。', perfect: '人贓俱獲！', good: '身分暴露。', rough: '交易取消。', fail: '沉入泰晤士河。' },
                    { title: '毒氣隔離', client: '工頭', request: '毒氣不能相鄰。', rule: 'no-adjacent', ruleLabel: '避鄰隔離', clue: '相鄰位置不同。', intro: '地底的轟鳴。', perfect: '完美通風！', good: '觀測回穩。', rough: '餘味太重。', fail: '礦井坍塌。' },
                    { title: '主謀氣息', client: '偵探', request: '主嫌氣味過半。', rule: 'weighted', ruleLabel: '主嫌鎖定', clue: '一材佔據過半。', intro: '貓鼠遊戲。', perfect: '當場逮捕！', good: '效率一般。', rough: '追丟了。', fail: '被反殺。' },
                    { title: '鏡像逃生', client: '路人', request: '地道前後對稱。', rule: 'palindrome', ruleLabel: '逃生路徑', clue: '六格鏡像。', intro: '無盡的黑暗。', perfect: '成功逃離！', good: '差點回不來。', rough: '白忙活一場。', fail: '永遠消失。' },
                    { title: '五方勢力', client: '教父', request: '五種勢力平衡。', rule: 'spectrum', ruleLabel: '勢力均衡', clue: '五種皆要出現。', intro: '危險的平衡。', perfect: '地底稱王！', good: '地位不穩。', rough: '勉強存活。', fail: '被吞併。' },
                    { title: '地底之王', client: '死對頭', request: '最後的決鬥。', rule: 'crown', ruleLabel: '最終決戰', clue: '六格冠式。', intro: '成敗在此一舉。', perfect: '傳奇誕生！', good: '兩敗俱傷。', rough: '慘勝。', fail: '一敗塗地。' }
                ]
            }
        ];

        const baseLevels = chapters.flatMap((chapter, chapterIndex) =>
            chapter.orders.map((order, orderIndex) => {
                const id = chapterIndex * 6 + orderIndex + 1;
                const slotCount = id >= 18 ? 6 : id >= 6 ? 5 : 4;
                return this.normalizePuzzleDefinition({
                    ...order,
                    storyClue: order.clue,
                    id,
                    chapter: chapter.title,
                    chapterKey: chapter.key,
                    chapterIndex,
                    mentor: chapter.mentor,
                    slotCount,
                    name: `案件 #${id.toString().padStart(2, '0')}：${order.title}`
                });
            })
        );

        return baseLevels.concat(this.generateExtendedStoryLevels(baseLevels.length));
    }
    """
    
    new_content = content[:start_pos] + new_generate_levels + "\\n    " + content[end_pos:]
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully cleaned and fixed app.js")
else:
    print(f"Markers not found: start={start_pos}, end={end_pos}")
