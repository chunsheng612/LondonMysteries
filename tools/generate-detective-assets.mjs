import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const SVG_DIR = '/private/tmp/detective_asset_svg';
const PNG_DIR = '/private/tmp/detective_asset_png';

const commonDefs = `
  <defs>
    <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#061117" flood-opacity="0.35"/>
    </filter>
    <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#061117" flood-opacity="0.28"/>
    </filter>
    <filter id="warmGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0.95  0 1 0 0 0.55  0 0 1 0 0.18  0 0 0 0.5 0"/>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff0a8"/>
      <stop offset="0.25" stop-color="#d6a13a"/>
      <stop offset="0.65" stop-color="#8a5a18"/>
      <stop offset="1" stop-color="#f4c667"/>
    </linearGradient>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff2cf"/>
      <stop offset="0.6" stop-color="#cfae72"/>
      <stop offset="1" stop-color="#8f6838"/>
    </linearGradient>
    <linearGradient id="ink" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#28424b"/>
      <stop offset="1" stop-color="#07151c"/>
    </linearGradient>
    <radialGradient id="gas" cx="50%" cy="40%" r="55%">
      <stop offset="0" stop-color="#ffd78a"/>
      <stop offset="0.55" stop-color="#b46b28"/>
      <stop offset="1" stop-color="#15262d"/>
    </radialGradient>
  </defs>`;

function svg(content, { bg = '', defs = '' } = {}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
${commonDefs}
${defs}
${bg}
${content}
</svg>
`;
}

function officeBackground() {
  const defs = `
  <defs>
    <radialGradient id="officeGlow" cx="70%" cy="28%" r="60%">
      <stop offset="0" stop-color="#e7a84c" stop-opacity="0.75"/>
      <stop offset="0.45" stop-color="#344850" stop-opacity="0.8"/>
      <stop offset="1" stop-color="#071015"/>
    </radialGradient>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#172a31"/>
      <stop offset="0.62" stop-color="#2a241f"/>
      <stop offset="1" stop-color="#110e0c"/>
    </linearGradient>
    <pattern id="wallPattern" width="78" height="78" patternUnits="userSpaceOnUse">
      <path d="M0 0H78V78H0Z" fill="none"/>
      <path d="M12 0V78M51 0V78M0 18H78M0 57H78" stroke="#d5a762" stroke-opacity="0.055" stroke-width="2"/>
    </pattern>
  </defs>`;
  return svg(`
    <rect width="1024" height="1024" fill="url(#wall)"/>
    <rect width="1024" height="1024" fill="url(#wallPattern)"/>
    <rect width="1024" height="1024" fill="url(#officeGlow)" opacity="0.65"/>
    <rect x="96" y="86" width="348" height="440" rx="22" fill="#07141b" stroke="#b98645" stroke-width="14" filter="url(#shadow)"/>
    <path d="M270 92V520M103 306H438" stroke="#b98645" stroke-width="10"/>
    <path d="M116 494 C188 428 222 445 270 392 C340 314 382 328 430 276 L430 520 L116 520Z" fill="#152a34"/>
    <circle cx="168" cy="146" r="30" fill="#f6ce78" opacity="0.78"/>
    <path d="M112 186 C190 150 262 176 334 142 C374 124 416 132 444 112" stroke="#d8e8ea" stroke-opacity="0.15" stroke-width="18" fill="none"/>
    <rect x="550" y="108" width="330" height="270" rx="16" fill="#241812" stroke="#93682f" stroke-width="12" filter="url(#softShadow)"/>
    <rect x="578" y="134" width="274" height="218" rx="8" fill="#3d2719"/>
    <path d="M614 180 C710 214 760 154 826 204M624 270 C724 230 754 318 832 282M662 150 L812 330M814 154 L628 326" stroke="#b12929" stroke-width="7" stroke-linecap="round"/>
    ${[638, 728, 824, 684, 790].map((x, i) => `<circle cx="${x}" cy="${[182, 198, 224, 292, 284][i]}" r="12" fill="#d6a13a" stroke="#ffedb0" stroke-width="4"/>`).join('')}
    <g filter="url(#warmGlow)">
      <path d="M792 118 C828 212 840 318 802 390 C766 318 760 214 792 118Z" fill="#ffd37a" opacity="0.45"/>
      <path d="M796 108 L834 262 L798 412 L760 262Z" fill="#f6b64e" opacity="0.35"/>
    </g>
    <rect x="126" y="610" width="772" height="84" rx="20" fill="#5b351f" stroke="#aa7442" stroke-width="8" filter="url(#shadow)"/>
    <path d="M94 674 H930 L878 960 H146 Z" fill="#3a2116"/>
    <path d="M148 714 H876 L840 938 H184 Z" fill="#5c3824"/>
    <rect x="210" y="688" width="248" height="154" rx="14" fill="#b89456" stroke="#3a2116" stroke-width="7" transform="rotate(-7 334 765)"/>
    <rect x="242" y="720" width="190" height="14" rx="7" fill="#55351f" opacity="0.45" transform="rotate(-7 334 727)"/>
    <rect x="250" y="758" width="154" height="13" rx="6" fill="#55351f" opacity="0.35" transform="rotate(-7 327 764)"/>
    <circle cx="622" cy="764" r="86" fill="none" stroke="url(#brass)" stroke-width="24" filter="url(#softShadow)"/>
    <line x1="684" y1="826" x2="792" y2="934" stroke="#8f5d25" stroke-width="32" stroke-linecap="round"/>
    <line x1="684" y1="826" x2="792" y2="934" stroke="#e3bb61" stroke-width="12" stroke-linecap="round"/>
    <rect x="690" y="596" width="102" height="70" rx="16" fill="#d8b166" stroke="#49311d" stroke-width="8"/>
    <path d="M726 596 C732 552 764 552 772 596" fill="none" stroke="#49311d" stroke-width="9"/>
    <path d="M0 0H1024V1024H0Z" fill="#071015" opacity="0.1"/>
  `, { defs });
}

function iconBase(inner, { ring = true, fill = '#142a30', glow = '#d89a42' } = {}) {
  return svg(`
    <circle cx="512" cy="512" r="420" fill="${fill}" filter="url(#shadow)"/>
    <circle cx="512" cy="512" r="390" fill="#20343a" opacity="0.92"/>
    <circle cx="512" cy="512" r="360" fill="#101f25"/>
    ${ring ? '<circle cx="512" cy="512" r="404" fill="none" stroke="url(#brass)" stroke-width="34"/>' : ''}
    <circle cx="390" cy="300" r="210" fill="${glow}" opacity="0.12"/>
    ${inner}
  `);
}

function poundCoin() {
  return iconBase(`
    <circle cx="512" cy="512" r="252" fill="url(#brass)" stroke="#fff0a8" stroke-width="18"/>
    <circle cx="512" cy="512" r="204" fill="#b97722" opacity="0.45"/>
    <text x="512" y="604" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="260" font-weight="700" fill="#331d0d" opacity="0.92">£</text>
    <path d="M366 354 C446 284 590 282 664 354" stroke="#fff0a8" stroke-width="24" stroke-linecap="round" opacity="0.55"/>
  `, { fill: '#1d2426', glow: '#f1bd61' });
}

function coffeeIcon() {
  return iconBase(`
    <path d="M356 470 H650 C644 654 590 738 466 738 C390 738 346 654 356 470Z" fill="#fff0d2" stroke="#4f2c18" stroke-width="22"/>
    <path d="M392 504 H616 C602 638 566 684 474 684 C424 684 394 628 392 504Z" fill="#4a2415"/>
    <path d="M650 516 C748 504 748 656 646 640" fill="none" stroke="#fff0d2" stroke-width="34" stroke-linecap="round"/>
    <path d="M420 414 C380 360 456 328 414 274M514 414 C474 350 566 322 524 260M604 414 C570 354 648 328 618 276" stroke="#f4c667" stroke-width="22" stroke-linecap="round" opacity="0.9"/>
    <ellipse cx="512" cy="760" rx="210" ry="34" fill="#0a151a" opacity="0.35"/>
  `, { fill: '#221916', glow: '#f6b64e' });
}

function avatarIcon() {
  return iconBase(`
    <circle cx="512" cy="392" r="112" fill="#d7a06d"/>
    <path d="M386 382 C398 264 604 238 646 388 C590 330 472 330 386 382Z" fill="#40281b"/>
    <path d="M354 722 C374 590 432 530 512 530 C594 530 650 590 670 722Z" fill="#1b3843" stroke="url(#brass)" stroke-width="18"/>
    <path d="M450 578 L512 682 L574 578" fill="#f1ddbd"/>
    <circle cx="470" cy="404" r="10" fill="#071015"/><circle cx="554" cy="404" r="10" fill="#071015"/>
    <path d="M458 456 C496 480 540 480 574 456" stroke="#8a4f35" stroke-width="12" stroke-linecap="round" fill="none"/>
  `, { fill: '#17242a', glow: '#d6a13a' });
}

function clueTagIcon() {
  return iconBase(`
    <path d="M354 294 H642 L742 410 V720 C742 760 710 792 670 792 H354 C314 792 282 760 282 720 V366 C282 326 314 294 354 294Z" fill="url(#paper)" stroke="#4a2a15" stroke-width="20"/>
    <circle cx="626" cy="378" r="34" fill="#15262d" stroke="#f2c869" stroke-width="12"/>
    <path d="M362 476 H650M362 548 H610M362 620 H680" stroke="#57361f" stroke-width="20" stroke-linecap="round" opacity="0.56"/>
    <path d="M620 384 C704 328 774 308 836 304" stroke="#b12929" stroke-width="18" stroke-linecap="round" fill="none"/>
  `, { fill: '#1e2e30', glow: '#b12929' });
}

function notebookIcon() {
  return iconBase(`
    <rect x="318" y="254" width="390" height="520" rx="36" fill="#9d6a32" stroke="#3e2617" stroke-width="22"/>
    <rect x="364" y="302" width="292" height="424" rx="20" fill="#e8cf94"/>
    <path d="M316 340 H236M316 430 H236M316 520 H236M316 610 H236M316 700 H236" stroke="url(#brass)" stroke-width="28" stroke-linecap="round"/>
    <path d="M416 428 H604M416 512 H574M416 596 H622" stroke="#4b331f" stroke-width="18" stroke-linecap="round" opacity="0.55"/>
    <circle cx="610" cy="658" r="36" fill="#9e1f26" opacity="0.85"/>
  `, { fill: '#202928', glow: '#d6a13a' });
}

function dossierIcon() {
  return iconBase(`
    <path d="M246 346 H438 L486 400 H790 C824 400 848 424 848 458 V724 C848 758 824 782 790 782 H246 C212 782 188 758 188 724 V404 C188 370 212 346 246 346Z" fill="#a27a3f" stroke="#3a2414" stroke-width="24"/>
    <path d="M216 452 H810 V724 C810 740 798 750 780 750 H244 C226 750 216 738 216 720Z" fill="#d6b46f"/>
    <path d="M338 534 H690M338 612 H630" stroke="#51331e" stroke-width="24" stroke-linecap="round" opacity="0.45"/>
    <path d="M520 458 C600 508 660 560 714 642M714 458 C630 510 578 564 520 642" stroke="#a22124" stroke-width="14" stroke-linecap="round"/>
    <circle cx="617" cy="550" r="34" fill="#a22124" stroke="#f5d48a" stroke-width="8"/>
  `, { fill: '#211d18', glow: '#b12929' });
}

function navHome() {
  return iconBase(`
    <path d="M286 502 L512 292 L738 502" fill="none" stroke="url(#brass)" stroke-width="58" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M348 488 H676 V742 H348Z" fill="#263e44" stroke="#e0b866" stroke-width="28" stroke-linejoin="round"/>
    <rect x="468" y="584" width="88" height="158" rx="16" fill="#11191d" stroke="#9d6a32" stroke-width="10"/>
    <path d="M710 396 C756 470 758 552 704 616" stroke="#f0bf61" stroke-width="18" stroke-linecap="round" opacity="0.55"/>
  `, { fill: '#122229', glow: '#e8a94d' });
}

function navShop() {
  return iconBase(`
    <rect x="282" y="338" width="460" height="380" rx="36" fill="#6c3f23" stroke="url(#brass)" stroke-width="28"/>
    <path d="M282 456 H742M420 338 V718M604 338 V718" stroke="#2c1a11" stroke-width="18" opacity="0.55"/>
    <circle cx="352" cy="540" r="42" fill="#f4d498"/>
    <path d="M334 532 H370 C370 590 334 590 334 532Z" fill="#4a2415"/>
    <rect x="478" y="512" width="82" height="112" rx="14" fill="#d6b46f"/>
    <circle cx="656" cy="568" r="54" fill="url(#brass)"/>
  `, { fill: '#211916', glow: '#f4c667' });
}

function navStory() {
  return dossierIcon();
}

function navDaily() {
  return iconBase(`
    <rect x="280" y="288" width="376" height="482" rx="26" fill="#e3c486" stroke="#3e2617" stroke-width="24" transform="rotate(-5 468 529)"/>
    <path d="M334 404 H590M340 482 H604M350 560 H560" stroke="#4a2a15" stroke-width="20" stroke-linecap="round" opacity="0.56" transform="rotate(-5 468 529)"/>
    <circle cx="650" cy="612" r="126" fill="#15262d" stroke="url(#brass)" stroke-width="24"/>
    <path d="M650 536 V620 L708 662" stroke="#f3cc79" stroke-width="20" stroke-linecap="round"/>
    <circle cx="650" cy="612" r="12" fill="#f3cc79"/>
  `, { fill: '#172329', glow: '#e0a24a' });
}

function navInventory() {
  return iconBase(`
    <path d="M414 260 C428 218 482 200 512 238 C542 200 596 218 610 260" fill="none" stroke="url(#brass)" stroke-width="22" stroke-linecap="round"/>
    <path d="M346 318 C430 268 594 268 680 318 L720 734 H304Z" fill="#1f3b45" stroke="#d2a04b" stroke-width="24" stroke-linejoin="round"/>
    <path d="M512 324 L444 478 L512 724 L580 478Z" fill="#e6d2a8"/>
    <path d="M444 478 L360 354M580 478 L664 354" stroke="#102028" stroke-width="18"/>
    <circle cx="648" cy="684" r="50" fill="none" stroke="url(#brass)" stroke-width="18"/>
    <line x1="684" y1="720" x2="740" y2="776" stroke="url(#brass)" stroke-width="22" stroke-linecap="round"/>
  `, { fill: '#122229', glow: '#d6a13a' });
}

function navSettings() {
  return iconBase(`
    <g transform="translate(512 512)" fill="url(#brass)" stroke="#2b1a10" stroke-width="10">
      ${Array.from({ length: 10 }).map((_, i) => {
        const a = i * 36;
        return `<rect x="-32" y="-286" width="64" height="112" rx="14" transform="rotate(${a})"/>`;
      }).join('')}
      <circle r="196"/>
      <circle r="82" fill="#14282f" stroke="#f0c468" stroke-width="18"/>
    </g>
    <path d="M350 728 L724 354" stroke="#e8d2a2" stroke-width="36" stroke-linecap="round"/>
    <path d="M684 324 L744 384" stroke="#7a251e" stroke-width="42" stroke-linecap="round"/>
  `, { fill: '#17242a', glow: '#d6a13a' });
}

function starBadge() {
  return svg(`
    <circle cx="512" cy="512" r="296" fill="#8b1e23" filter="url(#shadow)"/>
    <path d="M512 232 L584 420 L784 430 L626 550 L680 742 L512 632 L344 742 L398 550 L240 430 L440 420Z" fill="url(#brass)" stroke="#fff0a8" stroke-width="24" stroke-linejoin="round"/>
    <circle cx="512" cy="512" r="106" fill="#7b191d" opacity="0.8"/>
    <path d="M400 504 H624M446 570 H578" stroke="#f2c86d" stroke-width="22" stroke-linecap="round" opacity="0.75"/>
  `);
}

function swirlIcon() {
  return svg(`
    <circle cx="512" cy="512" r="380" fill="#0f242b" opacity="0.98" filter="url(#shadow)"/>
    <path d="M690 352 C572 246 330 302 324 484 C318 646 548 664 574 530 C594 428 442 410 428 514 C420 584 508 620 560 574" fill="none" stroke="#81c9d8" stroke-width="54" stroke-linecap="round"/>
    <path d="M722 716 L620 614" stroke="url(#brass)" stroke-width="44" stroke-linecap="round"/>
    <circle cx="548" cy="548" r="122" fill="none" stroke="url(#brass)" stroke-width="30"/>
    <circle cx="358" cy="348" r="26" fill="#f4d27b"/>
    <circle cx="732" cy="470" r="18" fill="#f4d27b"/>
  `);
}

function person({
  coat = '#1f3b45',
  accent = '#d6a13a',
  hair = '#3b2417',
  skin = '#d79a70',
  dress = false,
  hat = 'cap',
  item = 'magnifier',
  age = 'young',
  villain = false,
  glasses = false,
  skirt = false,
  trim = false,
  badge = false,
  smile = true,
  apron = false,
} = {}) {
  const lower = skirt || dress
    ? `<path d="M392 620 L632 620 L704 890 H320Z" fill="${coat}" stroke="#102028" stroke-width="14"/>
       <path d="M408 642 L512 890 L616 642" fill="#000" opacity="0.12"/>`
    : `<path d="M404 620 L494 620 L472 900 H350Z" fill="${coat}" stroke="#102028" stroke-width="12"/>
       <path d="M530 620 L620 620 L674 900 H548Z" fill="${coat}" stroke="#102028" stroke-width="12"/>`;
  const hatSvg = hat === 'top'
    ? `<rect x="390" y="236" width="244" height="58" rx="16" fill="#101820" stroke="${accent}" stroke-width="10"/>
       <rect x="420" y="132" width="184" height="130" rx="16" fill="#101820" stroke="${accent}" stroke-width="10"/>`
    : hat === 'bowler'
      ? `<path d="M380 270 C394 186 630 186 646 270 Z" fill="#101820" stroke="${accent}" stroke-width="10"/>
         <rect x="362" y="264" width="300" height="38" rx="18" fill="#101820" stroke="${accent}" stroke-width="8"/>`
      : hat === 'none'
        ? ''
        : `<path d="M372 284 C424 206 576 206 640 284 L686 304 L338 304Z" fill="#21323a" stroke="${accent}" stroke-width="10"/>
           <path d="M432 232 C486 204 550 204 596 232" stroke="#0c151a" stroke-width="16" stroke-linecap="round"/>`;
  const itemSvg = item === 'folder'
    ? `<rect x="612" y="536" width="144" height="190" rx="18" fill="#caa66b" stroke="#3a2314" stroke-width="12" transform="rotate(8 684 631)"/>
       <path d="M642 600 H724M642 650 H704" stroke="#4c311d" stroke-width="12" stroke-linecap="round" transform="rotate(8 684 631)"/>`
    : item === 'telegram'
      ? `<rect x="620" y="520" width="166" height="116" rx="14" fill="#e7d1a0" stroke="#3a2314" stroke-width="12" transform="rotate(-8 703 578)"/>
         <path d="M644 558 H758M644 596 H724" stroke="#4c311d" stroke-width="10" stroke-linecap="round" transform="rotate(-8 703 578)"/>`
      : item === 'coffee'
      ? `<path d="M626 560 H734 C728 646 704 690 654 690 C620 690 604 638 626 560Z" fill="#fff0d2" stroke="#3a2314" stroke-width="12"/>
           <path d="M730 584 C786 580 788 660 728 652" fill="none" stroke="#fff0d2" stroke-width="18"/>`
        : item === 'notebook'
          ? `<rect x="612" y="528" width="142" height="176" rx="18" fill="#caa66b" stroke="#3a2314" stroke-width="12" transform="rotate(7 683 616)"/>
             <path d="M644 580 H720M644 624 H704" stroke="#4c311d" stroke-width="10" stroke-linecap="round" transform="rotate(7 683 616)"/>
             <circle cx="720" cy="670" r="18" fill="#9b2428" transform="rotate(7 683 616)"/>`
        : item === 'cane'
          ? `<path d="M694 474 C758 442 792 502 734 532" fill="none" stroke="${accent}" stroke-width="24" stroke-linecap="round"/>
             <line x1="734" y1="524" x2="670" y2="894" stroke="#26160e" stroke-width="24" stroke-linecap="round"/>`
          : item === 'satchel'
            ? `<rect x="612" y="570" width="160" height="142" rx="26" fill="#5d351e" stroke="#2d1a10" stroke-width="12"/>
               <path d="M632 570 C652 516 726 516 750 570" fill="none" stroke="#2d1a10" stroke-width="12"/>`
            : `<circle cx="672" cy="560" r="70" fill="none" stroke="url(#brass)" stroke-width="22"/>
               <line x1="720" y1="610" x2="804" y2="694" stroke="#8a5a18" stroke-width="26" stroke-linecap="round"/>`;
  const faceLines = glasses
    ? `<circle cx="470" cy="374" r="26" fill="none" stroke="#23150d" stroke-width="8"/>
       <circle cx="554" cy="374" r="26" fill="none" stroke="#23150d" stroke-width="8"/>
       <path d="M496 374 H528" stroke="#23150d" stroke-width="8"/>`
    : `<circle cx="470" cy="380" r="9" fill="#091116"/><circle cx="554" cy="380" r="9" fill="#091116"/>`;
  const mouth = smile
    ? `<path d="M466 448 C500 474 542 474 574 448" stroke="#804a35" stroke-width="10" stroke-linecap="round" fill="none"/>`
    : `<path d="M472 454 C506 442 540 442 572 454" stroke="#804a35" stroke-width="10" stroke-linecap="round" fill="none"/>`;
  return svg(`
    <ellipse cx="512" cy="918" rx="260" ry="48" fill="#061117" opacity="0.35"/>
    <circle cx="512" cy="430" r="330" fill="${accent}" opacity="0.09"/>
    ${hatSvg}
    <path d="M402 302 C430 222 594 222 626 310 C650 372 626 460 584 498 C540 538 468 536 426 498 C384 458 376 366 402 302Z" fill="${skin}" stroke="#6d3d28" stroke-width="12" filter="url(#softShadow)"/>
    <path d="${villain ? 'M388 340 C416 236 610 232 646 344 C580 300 486 298 388 340Z' : 'M390 334 C414 248 598 238 638 336 C568 292 470 294 390 334Z'}" fill="${hair}"/>
    ${age === 'old' ? '<path d="M450 430 C480 414 540 414 574 430" stroke="#ffffff" stroke-width="12" stroke-linecap="round" opacity="0.82"/>' : ''}
    ${faceLines}
    <path d="M444 350 C468 338 488 340 506 350M526 350 C548 338 570 338 592 350" stroke="#2a170f" stroke-width="10" stroke-linecap="round" opacity="0.55"/>
    ${mouth}
    <rect x="468" y="502" width="88" height="68" rx="18" fill="${skin}" stroke="#6d3d28" stroke-width="10"/>
    <path d="M372 472 C448 432 576 432 652 472 C694 552 704 720 676 894 H348 C320 720 330 552 372 472Z" fill="${coat}" stroke="#0c171c" stroke-width="16" filter="url(#shadow)"/>
    <path d="M444 486 L512 662 L580 486" fill="#ebd8b3"/>
    <path d="M512 662 L462 858 H562Z" fill="${villain ? '#8c1f27' : '#152832'}" opacity="0.82"/>
    ${trim ? `<path d="M384 504 C448 566 464 738 426 888M640 504 C576 566 560 738 598 888" fill="none" stroke="${accent}" stroke-width="16" opacity="0.85"/>` : ''}
    ${apron ? '<path d="M420 540 H604 L644 846 H380Z" fill="#e5d6bd" opacity="0.88"/>' : ''}
    ${badge ? `<circle cx="606" cy="548" r="34" fill="url(#brass)" stroke="#fff0a8" stroke-width="8"/>
               <path d="M606 520 L616 548 L646 548 L622 566 L632 594 L606 576 L580 594 L590 566 L566 548 L596 548Z" fill="#5b2418"/>` : ''}
    <path d="M374 512 C284 578 276 706 344 758" fill="none" stroke="${coat}" stroke-width="54" stroke-linecap="round"/>
    <path d="M650 512 C742 578 744 706 676 758" fill="none" stroke="${coat}" stroke-width="54" stroke-linecap="round"/>
    ${lower}
    ${itemSvg}
    <path d="M354 900 H474M548 900 H674" stroke="#10161a" stroke-width="30" stroke-linecap="round"/>
  `);
}

function thunderbird() {
  return svg(`
    <ellipse cx="512" cy="842" rx="250" ry="46" fill="#061117" opacity="0.32"/>
    <path d="M214 492 C330 282 454 376 512 500 C572 376 704 282 814 492 C694 456 626 526 578 650 C548 730 474 730 444 650 C398 526 328 456 214 492Z" fill="#1f5e7a" stroke="#082432" stroke-width="18" filter="url(#shadow)"/>
    <path d="M334 464 C422 392 480 424 512 524 C546 424 602 392 690 464 C620 470 566 540 512 664 C458 540 404 470 334 464Z" fill="#f2c65f"/>
    <path d="M472 406 C486 310 546 310 560 406 L622 462 L512 438 L402 462Z" fill="#164154" stroke="#082432" stroke-width="14"/>
    <circle cx="482" cy="396" r="11" fill="#ffd36d"/><circle cx="542" cy="396" r="11" fill="#ffd36d"/>
    <path d="M468 520 L338 704 L482 638 L412 806 L640 550 L524 610 L592 478Z" fill="#f6d15a" opacity="0.88"/>
  `);
}

function ashwinder() {
  return svg(`
    <ellipse cx="512" cy="832" rx="260" ry="48" fill="#061117" opacity="0.35"/>
    <path d="M256 660 C356 424 706 736 750 458 C774 306 566 258 498 406 C442 526 606 526 638 438" fill="none" stroke="#3b3130" stroke-width="78" stroke-linecap="round" filter="url(#shadow)"/>
    <path d="M256 660 C356 424 706 736 750 458 C774 306 566 258 498 406 C442 526 606 526 638 438" fill="none" stroke="#d86b2c" stroke-width="34" stroke-linecap="round" opacity="0.78"/>
    <path d="M636 388 C712 346 780 384 790 456 C734 434 682 440 638 488Z" fill="#3b3130" stroke="#160d0b" stroke-width="14"/>
    <circle cx="704" cy="420" r="10" fill="#ffd369"/>
    <path d="M332 604 C310 542 342 514 370 488M492 596 C460 534 496 500 528 470M642 548 C610 490 638 450 674 420" stroke="#ffb24d" stroke-width="20" stroke-linecap="round" opacity="0.65"/>
    <circle cx="298" cy="722" r="30" fill="#f26b2d" opacity="0.7"/>
    <circle cx="384" cy="758" r="18" fill="#ffd166" opacity="0.8"/>
  `);
}

function bowtruckle() {
  return svg(`
    <ellipse cx="512" cy="842" rx="228" ry="44" fill="#061117" opacity="0.28"/>
    <path d="M512 276 C462 372 468 548 430 748 H594 C556 548 562 372 512 276Z" fill="#5d7f38" stroke="#1c351b" stroke-width="18" filter="url(#shadow)"/>
    <path d="M448 456 C354 406 312 342 266 242M576 456 C670 406 712 342 758 242M438 584 C340 620 282 696 236 782M586 584 C684 620 742 696 788 782" stroke="#45652c" stroke-width="34" stroke-linecap="round"/>
    <path d="M360 260 C314 208 272 230 246 294 C308 306 348 292 360 260ZM664 260 C710 208 752 230 778 294 C716 306 676 292 664 260ZM488 246 C462 184 514 154 564 194 C548 242 524 264 488 246Z" fill="#75a64b" stroke="#22401f" stroke-width="12"/>
    <circle cx="474" cy="392" r="16" fill="#f4d77a"/><circle cx="550" cy="392" r="16" fill="#f4d77a"/>
    <path d="M472 460 C500 488 532 488 558 460" stroke="#1c351b" stroke-width="12" fill="none" stroke-linecap="round"/>
  `);
}

function mooncalf() {
  return svg(`
    <ellipse cx="512" cy="842" rx="230" ry="46" fill="#061117" opacity="0.3"/>
    <path d="M354 536 C360 356 666 356 672 536 C678 708 610 800 512 800 C414 800 348 708 354 536Z" fill="#b6c6c1" stroke="#455b5a" stroke-width="18" filter="url(#shadow)"/>
    <path d="M370 466 C294 392 312 304 406 330M654 466 C730 392 712 304 618 330" fill="#b6c6c1" stroke="#455b5a" stroke-width="18"/>
    <circle cx="454" cy="492" r="58" fill="#11252d"/><circle cx="570" cy="492" r="58" fill="#11252d"/>
    <circle cx="474" cy="472" r="17" fill="#f4d77a"/><circle cx="590" cy="472" r="17" fill="#f4d77a"/>
    <path d="M478 590 C500 616 526 616 548 590" stroke="#455b5a" stroke-width="12" fill="none" stroke-linecap="round"/>
    <path d="M682 230 C604 248 560 316 574 398 C634 372 680 306 682 230Z" fill="#f4d77a" opacity="0.8"/>
  `);
}

function niffler() {
  return svg(`
    <ellipse cx="512" cy="842" rx="260" ry="48" fill="#061117" opacity="0.32"/>
    <path d="M348 506 C350 350 674 350 676 506 C680 716 594 806 512 806 C430 806 344 716 348 506Z" fill="#172023" stroke="#071015" stroke-width="18" filter="url(#shadow)"/>
    <path d="M442 392 C384 326 334 322 304 384M582 392 C640 326 690 322 720 384" stroke="#172023" stroke-width="54" stroke-linecap="round"/>
    <path d="M512 430 C468 486 456 574 512 626 C568 574 556 486 512 430Z" fill="#d4a374" stroke="#6b3b24" stroke-width="14"/>
    <circle cx="454" cy="458" r="13" fill="#f2ca67"/><circle cx="570" cy="458" r="13" fill="#f2ca67"/>
    <circle cx="394" cy="690" r="58" fill="url(#brass)"/>
    <circle cx="622" cy="702" r="48" fill="url(#brass)"/>
    <path d="M336 690 H686" stroke="#172023" stroke-width="42" stroke-linecap="round"/>
  `);
}

function kelpie() {
  return svg(`
    <ellipse cx="512" cy="842" rx="280" ry="48" fill="#061117" opacity="0.3"/>
    <path d="M298 668 C302 488 396 382 554 360 C670 344 734 404 760 498 C690 468 610 478 560 550 C512 618 458 668 298 668Z" fill="#174955" stroke="#092732" stroke-width="18" filter="url(#shadow)"/>
    <path d="M558 360 C574 260 664 224 754 272 C678 318 654 396 646 486" fill="#174955" stroke="#092732" stroke-width="18"/>
    <path d="M672 306 C706 316 728 340 742 374" stroke="#a4e4e0" stroke-width="14" stroke-linecap="round" opacity="0.8"/>
    <path d="M340 618 C454 580 546 612 680 566M292 716 C432 682 574 716 748 672" stroke="#8ccfd0" stroke-width="18" stroke-linecap="round" opacity="0.55"/>
    <circle cx="662" cy="350" r="12" fill="#f4d77a"/>
  `);
}

function erumpent() {
  return svg(`
    <ellipse cx="512" cy="840" rx="290" ry="54" fill="#061117" opacity="0.34"/>
    <path d="M284 594 C312 432 488 362 660 430 C782 478 810 642 710 740 C596 834 338 776 284 594Z" fill="#6b756c" stroke="#26302d" stroke-width="20" filter="url(#shadow)"/>
    <path d="M618 438 C648 328 734 284 826 306 C758 360 734 436 724 520" fill="#6b756c" stroke="#26302d" stroke-width="18"/>
    <path d="M754 310 L858 176 L820 350Z" fill="url(#brass)" stroke="#4a2a15" stroke-width="14"/>
    <circle cx="690" cy="442" r="13" fill="#f2c96a"/>
    <path d="M370 520 H560M338 600 H646M400 690 H708" stroke="#3a4741" stroke-width="18" stroke-linecap="round" opacity="0.55"/>
    <path d="M390 744 L360 874M560 760 L552 884M682 716 L740 862" stroke="#26302d" stroke-width="34" stroke-linecap="round"/>
  `);
}

function wampus() {
  return svg(`
    <ellipse cx="512" cy="844" rx="280" ry="46" fill="#061117" opacity="0.35"/>
    <path d="M250 646 C350 454 582 442 744 600 C636 632 552 718 402 744 C312 758 254 724 250 646Z" fill="#12191d" stroke="#050a0d" stroke-width="18" filter="url(#shadow)"/>
    <path d="M594 500 C630 388 760 358 838 442 C760 444 712 494 692 574" fill="#12191d" stroke="#050a0d" stroke-width="16"/>
    <path d="M676 410 L690 296 L736 414M770 432 L842 342 L812 470" fill="#12191d" stroke="#050a0d" stroke-width="14"/>
    <circle cx="706" cy="444" r="16" fill="#ffd166"/><circle cx="768" cy="452" r="16" fill="#ffd166"/>
    <path d="M390 710 L328 870M516 692 L494 870M656 624 L716 846" stroke="#050a0d" stroke-width="34" stroke-linecap="round"/>
    <path d="M284 616 C204 574 162 638 226 692" fill="none" stroke="#12191d" stroke-width="46" stroke-linecap="round"/>
  `);
}

function phoenix() {
  return svg(`
    <ellipse cx="512" cy="846" rx="260" ry="48" fill="#061117" opacity="0.32"/>
    <path d="M512 684 C396 486 284 416 180 448 C258 588 350 700 512 778 C674 700 766 588 844 448 C740 416 628 486 512 684Z" fill="#9d2224" stroke="#3a0e10" stroke-width="18" filter="url(#shadow)"/>
    <path d="M512 296 C582 386 612 516 566 662 H458 C412 516 442 386 512 296Z" fill="#f2a33a" stroke="#6e1f16" stroke-width="18"/>
    <path d="M476 318 C500 212 588 196 650 254 C582 276 548 330 534 418" fill="#d93225" stroke="#6e1f16" stroke-width="14"/>
    <circle cx="536" cy="386" r="12" fill="#fff0a8"/>
    <path d="M334 500 C390 560 440 626 512 740M690 500 C634 560 584 626 512 740" stroke="#ffd166" stroke-width="20" stroke-linecap="round" opacity="0.8"/>
    <path d="M512 654 C474 758 454 852 512 930 C570 852 550 758 512 654Z" fill="#f6d15a" opacity="0.78"/>
  `);
}

function demiguise() {
  return svg(`
    <ellipse cx="512" cy="842" rx="230" ry="46" fill="#061117" opacity="0.24"/>
    <path d="M350 542 C360 352 664 352 674 542 C682 722 604 812 512 812 C420 812 342 722 350 542Z" fill="#b9c0bc" opacity="0.78" stroke="#556260" stroke-width="18" filter="url(#shadow)"/>
    <path d="M352 470 C270 440 264 328 370 338M672 470 C754 440 760 328 654 338" fill="#b9c0bc" opacity="0.72" stroke="#556260" stroke-width="18"/>
    <circle cx="454" cy="496" r="56" fill="#101d22" opacity="0.88"/>
    <circle cx="570" cy="496" r="56" fill="#101d22" opacity="0.88"/>
    <circle cx="474" cy="478" r="16" fill="#f4d77a"/><circle cx="590" cy="478" r="16" fill="#f4d77a"/>
    <path d="M456 616 C492 648 532 648 568 616" stroke="#556260" stroke-width="12" fill="none" stroke-linecap="round"/>
    <path d="M308 304 C458 240 604 260 744 334M274 724 C426 784 594 784 752 714" stroke="#dbe8e6" stroke-width="22" stroke-linecap="round" opacity="0.35"/>
  `);
}

function bestiary() {
  const icons = [thunderbird(), ashwinder(), bowtruckle(), mooncalf(), niffler(), kelpie(), erumpent(), wampus(), phoenix(), demiguise()]
    .map((raw) => raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace('</svg>', ''));
  return svg(`
    <rect x="84" y="92" width="856" height="840" rx="44" fill="#1a2d34" stroke="url(#brass)" stroke-width="22" filter="url(#shadow)"/>
    <rect x="124" y="136" width="776" height="756" rx="28" fill="#d7bd80" opacity="0.78"/>
    ${icons.slice(0, 9).map((inner, i) => {
      const x = 198 + (i % 3) * 240;
      const y = 210 + Math.floor(i / 3) * 220;
      return `<g transform="translate(${x - 512} ${y - 512}) scale(0.22)">${inner}</g>`;
    }).join('')}
    <path d="M220 832 H804" stroke="#51331e" stroke-width="24" stroke-linecap="round" opacity="0.35"/>
  `);
}

function pwaIcon() {
  return svg(`
    <rect width="1024" height="1024" rx="210" fill="#07151c"/>
    <circle cx="512" cy="512" r="440" fill="#102832"/>
    <path d="M184 710 C292 542 372 470 498 394 C638 310 766 272 888 290 V872 H184Z" fill="#0c1b22" opacity="0.9"/>
    <rect x="224" y="280" width="378" height="470" rx="42" fill="#d6b46f" stroke="#3a2414" stroke-width="28" transform="rotate(-8 413 515)" filter="url(#shadow)"/>
    <path d="M302 424 H526M314 510 H556M326 596 H500" stroke="#4b321f" stroke-width="24" stroke-linecap="round" transform="rotate(-8 413 515)" opacity="0.5"/>
    <circle cx="604" cy="512" r="188" fill="none" stroke="url(#brass)" stroke-width="52" filter="url(#softShadow)"/>
    <line x1="736" y1="646" x2="886" y2="796" stroke="#8f5d25" stroke-width="70" stroke-linecap="round"/>
    <line x1="736" y1="646" x2="886" y2="796" stroke="#f2c96a" stroke-width="28" stroke-linecap="round"/>
    <circle cx="604" cy="512" r="122" fill="#89c2c9" opacity="0.2"/>
    <circle cx="398" cy="244" r="42" fill="#f5c76b" opacity="0.65"/>
  `);
}

function assetDefinitions() {
  return [
    ['bg_magic_lab', 'assets/bg_magic_lab.png', officeBackground()],
    ['char_alchemist', 'assets/char_alchemist.png', person({ coat: '#1e4650', accent: '#d6a13a', hair: '#5a2d1c', item: 'magnifier', hat: 'cap', trim: true, badge: true })],
    ['char_mentor', 'assets/char_mentor.png', person({ coat: '#3d3529', accent: '#cda15b', hair: '#77706a', item: 'satchel', hat: 'bowler', age: 'old', glasses: true, trim: true })],
    ['char_scout', 'assets/char_scout.png', person({ coat: '#233d51', accent: '#e2b764', hair: '#2a1710', item: 'telegram', hat: 'cap', badge: true, trim: true })],
    ['char_broker', 'assets/char_broker.png', person({ coat: '#473328', accent: '#d6a13a', hair: '#6d6259', item: 'coffee', hat: 'none', age: 'old', apron: true, smile: true })],
    ['char_rival', 'assets/char_rival.png', person({ coat: '#111820', accent: '#a22124', hair: '#17100d', item: 'cane', hat: 'top', villain: true, trim: true, smile: false })],
    ['char_client', 'assets/char_client.png', person({ coat: '#4a382d', accent: '#c99a52', hair: '#4a2818', item: 'folder', hat: 'bowler', smile: false })],
    ['female_stage1', 'assets/chars/female_stage1.png', person({ coat: '#795233', accent: '#c99a52', hair: '#5b2e1f', item: 'notebook', hat: 'cap', skirt: true })],
    ['female_stage2', 'assets/chars/female_stage2.png', person({ coat: '#1e4b45', accent: '#d6a13a', hair: '#5b2e1f', item: 'magnifier', hat: 'cap', skirt: true, trim: true, badge: true })],
    ['female_stage3', 'assets/chars/female_stage3.png', person({ coat: '#102642', accent: '#f0c468', hair: '#4a251a', item: 'cane', hat: 'top', skirt: true, trim: true, badge: true })],
    ['male_stage1', 'assets/chars/male_stage1.png', person({ coat: '#7a5638', accent: '#c99a52', hair: '#3b2417', item: 'notebook', hat: 'cap' })],
    ['male_stage2', 'assets/chars/male_stage2.png', person({ coat: '#293f4a', accent: '#d6a13a', hair: '#2c1a12', item: 'magnifier', hat: 'bowler', trim: true, badge: true })],
    ['male_stage3', 'assets/chars/male_stage3.png', person({ coat: '#111d35', accent: '#f0c468', hair: '#22140f', item: 'cane', hat: 'top', trim: true, badge: true })],
    ['coin', 'assets/icons/coin.png', poundCoin()],
    ['potion_red', 'assets/icons/potion_red.png', coffeeIcon()],
    ['potion_blue', 'assets/icons/potion_blue.png', avatarIcon()],
    ['potion_green', 'assets/icons/potion_green.png', clueTagIcon()],
    ['potion_yellow', 'assets/icons/potion_yellow.png', notebookIcon()],
    ['potion_purple', 'assets/icons/potion_purple.png', dossierIcon()],
    ['star', 'assets/icons/star.png', starBadge()],
    ['swirl', 'assets/icons/swirl.png', swirlIcon()],
    ['nav_home', 'assets/icons/nav_home.png', navHome()],
    ['nav_shop', 'assets/icons/nav_shop.png', navShop()],
    ['nav_story', 'assets/icons/nav_story.png', navStory()],
    ['nav_daily', 'assets/icons/nav_daily.png', navDaily()],
    ['nav_inventory', 'assets/icons/nav_inventory.png', navInventory()],
    ['nav_settings', 'assets/icons/nav_settings.png', navSettings()],
    ['starry_slime', 'assets/enemies/starry_slime.png', thunderbird()],
    ['cinder_fox', 'assets/enemies/cinder_fox.png', ashwinder()],
    ['leafy_dragon', 'assets/enemies/leafy_dragon.png', bowtruckle()],
    ['moonlight_owl', 'assets/enemies/moonlight_owl.png', mooncalf()],
    ['solar_sprite', 'assets/enemies/solar_sprite.png', niffler()],
    ['mist_jellyfish', 'assets/enemies/mist_jellyfish.png', kelpie()],
    ['crystal_turtle', 'assets/enemies/crystal_turtle.png', erumpent()],
    ['shadow_cat', 'assets/enemies/shadow_cat.png', wampus()],
    ['clockwork_bird', 'assets/enemies/clockwork_bird.png', phoenix()],
    ['cloud_sheep', 'assets/enemies/cloud_sheep.png', demiguise()],
    ['enemies', 'assets/enemies/enemies.png', bestiary()],
    ['pwa_icon_192', 'assets/pwa/icon-192.png', pwaIcon()],
    ['pwa_icon_512', 'assets/pwa/icon-512.png', pwaIcon()],
    ['apple_touch_icon', 'assets/pwa/apple-touch-icon.png', pwaIcon()],
  ];
}

function writeSvgs() {
  fs.rmSync(SVG_DIR, { recursive: true, force: true });
  fs.rmSync(PNG_DIR, { recursive: true, force: true });
  fs.mkdirSync(SVG_DIR, { recursive: true });
  fs.mkdirSync(PNG_DIR, { recursive: true });
  for (const [id, , body] of assetDefinitions()) {
    fs.writeFileSync(path.join(SVG_DIR, `${id}.svg`), body);
  }
  console.log(assetDefinitions().map(([id]) => path.join(SVG_DIR, `${id}.svg`)).join('\n'));
}

function installPngs() {
  for (const [id, target] of assetDefinitions()) {
    const source = path.join(PNG_DIR, `${id}.svg.png`);
    if (!fs.existsSync(source)) {
      throw new Error(`Rendered PNG missing: ${source}`);
    }
    const destination = path.join(ROOT, target);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.rmSync(destination, { force: true });
    fs.copyFileSync(source, destination);
  }
  execFileSync('sips', ['-z', '512', '512', path.join(ROOT, 'assets/pwa/icon-512.png')], { stdio: 'ignore' });
  execFileSync('sips', ['-z', '192', '192', path.join(ROOT, 'assets/pwa/icon-192.png')], { stdio: 'ignore' });
  execFileSync('sips', ['-z', '180', '180', path.join(ROOT, 'assets/pwa/apple-touch-icon.png')], { stdio: 'ignore' });
  writeFavicon();
}

function writeFavicon() {
  const source = path.join(ROOT, 'assets/pwa/icon-192.png');
  const png = fs.readFileSync(source);
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(192, 0);
  entry.writeUInt8(192, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);

  fs.writeFileSync(path.join(ROOT, 'favicon.ico'), Buffer.concat([header, entry, png]));
}

const mode = process.argv[2];

if (mode === '--write-svg') {
  writeSvgs();
} else if (mode === '--install') {
  installPngs();
} else if (mode === '--favicon') {
  writeFavicon();
} else if (mode === '--list-svg') {
  console.log(assetDefinitions().map(([id]) => path.join(SVG_DIR, `${id}.svg`)).join(' '));
} else {
  console.log('Usage: node tools/generate-detective-assets.mjs --write-svg|--install|--list-svg');
  process.exitCode = 1;
}
