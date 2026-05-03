const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const narrativeDir = path.join(root, 'docs', 'narrative');
const chapterDialoguePath = path.join(root, 'docs', 'CHAPTER_02_TO_10_FULL_DIALOGUE.md');
const outPath = path.join(root, 'js', 'story-volume-data.js');

const modeMap = [
  { pattern: /1A2B/i, rule: '1a2b' },
  { pattern: /數獨|Sudoku/i, rule: 'sudoku' },
  { pattern: /接水管|Pipe/i, rule: 'pipe' },
  { pattern: /華容道|Klotski/i, rule: 'klotski' },
  { pattern: /冒泡排序|泡沫排序|Bubble Sort/i, rule: 'bubble' }
];

function clean(text) {
  return (text || '').replace(/\r/g, '').trim();
}

function mapRule(rawMode) {
  const matched = modeMap.find((entry) => entry.pattern.test(rawMode || ''));
  return matched ? matched.rule : '1a2b';
}

function inferPortrait(speaker) {
  const name = speaker || '';
  if (/夏洛特/.test(name)) return 'portrait-iris';
  if (/華生教授|教授|院長|探長/.test(name)) return 'portrait-mentor';
  if (/貝蒂|警衛|主任|站務|調查官|海關官員/.test(name)) return 'portrait-scout';
  if (/莫里亞蒂|鏡像你/.test(name)) return 'portrait-rival';
  if (/哈德森|管家|書記|藥劑師|導覽員|鑑定師|護衛長|拍賣官|黑幫老大|律師|工頭|圖書館員|工坊學徒/.test(name)) return 'portrait-broker';
  return 'portrait-client';
}

function getSlotCount(levelId) {
  if (levelId <= 10) return 3;
  if (levelId <= 50) return 4;
  return 5;
}

function getRuleLabel(rawMode, slotCount) {
  const rule = mapRule(rawMode);
  if (rule === '1a2b') return `${slotCount} 位數密碼`;
  return clean(rawMode);
}

function getGameplayDetail(rawMode, slotCount) {
  const rule = mapRule(rawMode);
  if (rule === '1a2b') {
    return `玩法：輸入 ${slotCount} 位不重複數字。A 代表數字與位置都正確，B 代表數字正確但位置錯誤。每次提交後都要根據紀錄排除錯誤組合，慢慢縮小範圍。`;
  }
  if (rule === 'sudoku') {
    return '玩法：依照 9x9 數獨規則完成矩陣。每一列、每一行與每個 3x3 區塊都只能出現一次 1-9，透過交叉排除找出唯一正解。';
  }
  if (rule === 'pipe') {
    return '玩法：旋轉或接通管道，讓能量、液體或訊號從起點順利流向終點。先確認入口與出口，再補齊中段斷點。';
  }
  if (rule === 'klotski') {
    return '玩法：滑動障礙模塊，替核心目標讓出通路。每一步都會影響後續空間，必須先安排退路與出口。';
  }
  if (rule === 'bubble') {
    return '玩法：透過相鄰交換把資料逐步排序。每次只交換相鄰兩項，讓錯位的資料一格一格回到正確位置。';
  }
  return rawMode;
}

function splitParagraphs(block) {
  return clean(block)
    .split(/\n{2,}/)
    .map((part) => clean(part.replace(/\n/g, ' ')))
    .filter(Boolean);
}

function parseVolumeFiles() {
  const files = fs.readdirSync(narrativeDir)
    .filter((name) => /^VOLUME_0[1-5]_.*\.md$/.test(name))
    .sort();

  const output = { volumes: [], levels: {} };

  for (const fileName of files) {
    const filePath = path.join(narrativeDir, fileName);
    const source = fs.readFileSync(filePath, 'utf8').replace(/\r/g, '');
    const lines = source.split('\n');

    const titleLine = lines.find((line) => line.startsWith('# ')) || '';
    const volumeMatch = titleLine.match(/^#\s+倫敦謎案簿：(.+?)\s*\(Levels\s*(\d+)-(\d+)\)/);
    if (!volumeMatch) continue;

    const volumeTitle = clean(volumeMatch[1]);
    const rangeStart = Number(volumeMatch[2]);
    const rangeEnd = Number(volumeMatch[3]);
    const corePlotLine = lines.find((line) => line.includes('**核心劇情**')) || '';
    const primaryModeLine = lines.find((line) => line.includes('**主要遊戲模式**')) || '';
    const corePlot = clean(corePlotLine.replace(/^>\s*\*\*核心劇情\*\*：/, ''));
    const primaryModes = clean(primaryModeLine.replace(/^>\s*\*\*主要遊戲模式\*\*：/, ''));

    const chapterMatches = [...source.matchAll(/^##\s+【(.+?)】\(Levels\s*(\d+)-(\d+)\)/gm)];
    const volume = {
      fileName,
      title: volumeTitle,
      rangeStart,
      rangeEnd,
      corePlot,
      primaryModes,
      chapters: []
    };

    for (let chapterIndex = 0; chapterIndex < chapterMatches.length; chapterIndex++) {
      const chapter = chapterMatches[chapterIndex];
      const chapterStart = chapter.index;
      const chapterEnd = chapterMatches[chapterIndex + 1] ? chapterMatches[chapterIndex + 1].index : source.length;
      const chapterBody = source.slice(chapterStart, chapterEnd);
      const chapterTitle = clean(chapter[1]);
      const chapterRangeStart = Number(chapter[2]);
      const chapterRangeEnd = Number(chapter[3]);
      const chapterLevelMatches = [...chapterBody.matchAll(/^###\s+第\s*(\d+)\s*關：(.+)$/gm)];

      const chapterData = {
        title: chapterTitle,
        rangeStart: chapterRangeStart,
        rangeEnd: chapterRangeEnd,
        levels: []
      };

      for (let levelIndex = 0; levelIndex < chapterLevelMatches.length; levelIndex++) {
        const levelMatch = chapterLevelMatches[levelIndex];
        const levelId = Number(levelMatch[1]);
        const levelTitle = clean(levelMatch[2]);
        const absoluteStart = chapterStart + levelMatch.index;
        const absoluteEnd = levelIndex + 1 < chapterLevelMatches.length
          ? chapterStart + chapterLevelMatches[levelIndex + 1].index
          : chapterEnd;
        const levelBody = source.slice(absoluteStart, absoluteEnd);

        const mode = clean((levelBody.match(/\*\*【遊戲模式】\*\*：(.+)/) || [,''])[1]);
        const narrative = clean((levelBody.match(/\*\*【小說敘事】\*\*\n([\s\S]*?)\n\*\*【開場對話】\*\*/) || [,''])[1]);
        const narrativeParagraphs = splitParagraphs(narrative);
        const dialogueBlock = clean((levelBody.match(/\*\*【開場對話】\*\*\n([\s\S]*?)\n\*\*【章節結尾：銜接下關】\*\*/) || [,''])[1]);
        const openingDialogue = dialogueBlock
          ? dialogueBlock.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
              const m = line.match(/^\*\s+\*\*(.+?)\*\*：(.+)$/);
              if (!m) return null;
              return {
                speaker: clean(m[1]),
                text: clean(m[2]),
                portrait: inferPortrait(clean(m[1]))
              };
            }).filter(Boolean)
          : [];
        const endingHook = clean((levelBody.match(/\*\*【章節結尾：銜接下關】\*\*\n([\s\S]*?)$/) || [,''])[1]);
        const client = openingDialogue[0]?.speaker || '';
        const slotCount = getSlotCount(levelId);

        const levelData = {
          id: levelId,
          title: levelTitle,
          volumeTitle,
          volumeCorePlot: corePlot,
          volumePrimaryModes: primaryModes,
          chapterTitle,
          rawMode: mode,
          rule: mapRule(mode),
          ruleLabel: getRuleLabel(mode, slotCount),
          gameplayDetail: getGameplayDetail(mode, slotCount),
          narrative,
          narrativeParagraphs,
          openingDialogue,
          endingHook,
          client,
          clientPortrait: inferPortrait(client),
          quickSummary: ''
        };

        chapterData.levels.push(levelData);
        output.levels[String(levelId)] = levelData;
      }

      volume.chapters.push(chapterData);
    }

    output.volumes.push(volume);
  }

  return output;
}

function supplementThamesChapter(output) {
  if (!fs.existsSync(chapterDialoguePath)) return;
  const source = fs.readFileSync(chapterDialoguePath, 'utf8').replace(/\r/g, '');
  const chapterMatch = source.match(/##\s+第二章｜泰晤士回聲（關卡 11-20）\n([\s\S]*?)\n---\n\n##\s+第三章｜白教堂暗影/);
  if (!chapterMatch) return;
  const chapterBody = chapterMatch[1];
  const chapterTitle = '第二章：泰晤士回聲';
  const chapterSummaryLines = [...chapterBody.matchAll(/-\s+(章節主題|章節功能|章末結論)：(.+)/g)].map((m) => clean(m[2]));
  const quickSummaryMap = new Map();
  const detailMatches = [...chapterBody.matchAll(/##\s+關卡\s+(\d+)｜(.+?)\n\n<details>\n<summary>快速知道這關做了什麼<\/summary>\n\n([\s\S]*?)\n<\/details>\n\n### 劇情小說\n\n([\s\S]*?)\n\n### 對話\n\n([\s\S]*?)(?=\n---\n\n##\s+關卡\s+\d+｜|\n---\n\n##\s+第三章｜|$)/g)];

  const levels = [];
  for (let i = 0; i < detailMatches.length; i++) {
    const match = detailMatches[i];
    const id = Number(match[1]);
    const title = clean(match[2]);
    const quickSummary = clean(match[3]).replace(/\n+/g, ' ');
    const narrative = clean(match[4]);
    const narrativeParagraphs = splitParagraphs(narrative);
    const dialogueBlock = clean(match[5]);
    const openingDialogue = dialogueBlock.split(/\n\n/).map((block) => {
      const parts = block.trim().split('\n');
      if (parts.length < 2) return null;
      const speaker = clean(parts[0].replace(/^\*\*|\*\*$/g, ''));
      const text = clean(parts.slice(1).join(' ').replace(/^「|」$/g, ''));
      return { speaker, text, portrait: inferPortrait(speaker) };
    }).filter(Boolean);
    const endingHook = i < detailMatches.length - 1
      ? clean(detailMatches[i + 1][3]).replace(/\n+/g, ' ')
      : '你正式確認灰印會已經能用同一套暗碼同步調度碼頭、船班、貨物與人手，第一卷完整收束。';
    const client = openingDialogue[0]?.speaker || '';
    levels.push({
      id,
      title,
      volumeTitle: '第一卷｜灰燼之函',
      volumeCorePlot: '貝克街的一系列離奇失蹤案，拉開了灰印會大規模實驗的序幕。',
      volumePrimaryModes: '1A2B (數字密碼破譯)',
      chapterTitle,
      rawMode: '1A2B (數字密碼破譯)',
      rule: '1a2b',
      ruleLabel: '4 位數密碼',
      gameplayDetail: getGameplayDetail('1A2B (數字密碼破譯)', 4),
      narrative,
      narrativeParagraphs,
      openingDialogue,
      endingHook,
      client,
      clientPortrait: inferPortrait(client),
      quickSummary
    });
  }

  const volume = output.volumes.find((entry) => entry.title === '第一卷｜灰燼之函');
  if (!volume) return;
  volume.chapters.push({ title: chapterTitle, rangeStart: 11, rangeEnd: 20, levels });
  volume.rangeEnd = 20;
  volume.primaryModes = '1A2B (數字密碼破譯)';
  for (const level of levels) {
    output.levels[String(level.id)] = level;
  }
}

function writeOutput(data) {
  fs.writeFileSync(outPath, `window.STORY_VOLUME_DATA = ${JSON.stringify(data, null, 2)};\n`);
}

const data = parseVolumeFiles();
supplementThamesChapter(data);
writeOutput(data);
console.log(`Generated ${outPath} with ${Object.keys(data.levels).length} levels.`);
