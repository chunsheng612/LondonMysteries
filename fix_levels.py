import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if 'generateLevels() {' in line:
        start_idx = i
    if 'generateExtendedStoryLevels(baseCount = 30) {' in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    new_func = """    generateLevels() {
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
                    { title: '成對耳環', client: '索菲亞', request: '耳環丟了一隻。', rule: 'twin-pairs', ruleLabel: '對位搜尋', clue: '四格線索兩兩成對。', intro: '莊園裡的盜竊。', perfect: '感激不盡！', good: '耳環有裂痕。', rough: '只找到底座。', fail: '神祕消失。' },
                    { title: '全員追蹤', client: '維克', request: '跨國盜竊案。', rule: 'spectrum', ruleLabel: '全員追蹤', clue: '五格代表五名嫌犯。', intro: '警督盯著我級別。', perfect: '全員落網！', good: '首腦被抓。', rough: '案子破了但受傷。', fail: '被騙得團團轉。' }
                ]
            },
            {
                key: 'clocktower',
                title: '血色鐘塔',
                mentor: '「每一聲鐘響，都可能是一個訊號。」',
                orders: [
                    { title: '碼頭黑影', client: '傑克', request: '霧中的黑影重複盤旋。', rule: 'repeat-one', ruleLabel: '暗影重現', clue: '五格中有一項重複。', intro: '港口的鹹腥味。', perfect: '識破詭計！', good: '黑影消失了。', rough: '虛驚一場。', fail: '差點命喪碼頭。' },
                    { title: '酒館流言', client: '露西', request: '三個醉漢看見了殺手。', rule: 'three-types', ruleLabel: '三方對質', clue: '五格中只涉及三種特徵級別。', intro: '廉價麥芽酒味。', perfect: '堵住殺手！', good: '拿到名片。', rough: '胡言亂語。', fail: '被醉漢圍毆。' },
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
                    { title: '封印箱子', client: '赫伯', request: '箱子順序不能出錯。', rule: 'no-adjacent', ruleLabel: '封印避位', clue: '相鄰類型不能重複。', intro: '海水腐蝕嚴重。', perfect: '發現地圖！', good: '箱子救回。', rough: '封印漏水。', fail: '箱子全碎。' }
                ]
            }
        ];

        const baseLevels = chapters.flatMap((chapter, chapterIndex) =>
            chapter.orders.map((order, orderIndex) => {
                const id = chapterIndex * 6 + orderIndex + 1;
                const slotCount = id >= 12 ? 6 : id >= 6 ? 5 : 4;
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
    lines[start_idx:end_idx] = [new_func + "\\n"]
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Successfully replaced generateLevels")
else:
    print("Start or End index not found")
