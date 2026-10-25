import { useEffect, useState } from 'react';

// Curated trivia, checked against the original organisations' histories.
const facts = [
  {
    en: '☕ The first webcam watched a coffee pot—so Cambridge researchers could avoid an empty one.',
    tl: '☕ Nakatutok sa coffee pot ang unang webcam—para hindi masayang ang lakad ng mga researcher!',
    zh: '☕ 最早的网络摄像头对着咖啡壶，帮剑桥研究员省下白跑一趟的功夫。',
    source: 'https://www.cl.cam.ac.uk/coffee/qsf/timeline.html',
  },
  {
    en: '🔢 In science, “exa” means a quintillion: a 1 followed by 18 zeros. Think big!',
    tl: '🔢 Sa agham, ang “exa” ay isang quintillion: 1 na may kasunod na 18 zero. Ang laki!',
    zh: '🔢 科学里的“exa”代表 10 的 18 次方：1 后面跟着 18 个零。够大吧！',
    source: 'https://www.nist.gov/pml/owm/metric-si-prefixes',
  },
  {
    en: '🔌 The first web server had a handwritten warning: “DO NOT POWER IT DOWN!!”',
    tl: '🔌 May sulat-kamay na babala ang unang web server: “DO NOT POWER IT DOWN!!”',
    zh: '🔌 第一台网页服务器上贴着手写警告：“千万别关机！！”',
    source: 'https://home.cern/science/computing/the-birth-of-the-web/short-history-web/',
  },
  {
    en: '✏️ The first web browser could edit pages too. The Web began as a place to create, not just read.',
    tl: '✏️ Puwede ring mag-edit ng mga pahina sa unang web browser—hindi lang magbasa!',
    zh: '✏️ 第一个浏览器还能编辑网页。万维网从一开始，就不只是用来阅读的。',
    source: 'https://web30.web.cern.ch/web-history.html',
  },
  {
    en: '🕸️ The Web and the internet are different: the Web is one of the things that runs on the internet.',
    tl: '🕸️ Magkaiba ang Web at internet: isa lang ang Web sa mga serbisyong gumagamit ng internet.',
    zh: '🕸️ 万维网和互联网不是一回事：万维网只是运行在互联网上的一种服务。',
    source: 'https://developer.mozilla.org/en-US/docs/Glossary/World_Wide_Web',
  },
  {
    en: '🌐 The world’s first website explained… how the World Wide Web works.',
    tl: '🌐 Ang unang website sa mundo ay tungkol sa… kung paano gumagana ang World Wide Web.',
    zh: '🌐 世界上第一个网站，介绍的正是……万维网怎么用。',
    source: 'https://home.cern/science/computing/the-birth-of-the-web/where-web-was-born/',
  },
  {
    en: '🎁 In 1993, CERN released the Web’s software into the public domain. No royalties required.',
    tl: '🎁 Noong 1993, inilagay ng CERN sa public domain ang Web software—walang royalty!',
    zh: '🎁 1993 年，CERN 将万维网软件放入公共领域，无需支付使用费。',
    source: 'https://home.cern/science/computing/the-birth-of-the-web/where-web-was-born/',
  },
  {
    en: '💬 ARPANET’s first message was “LO”. It crashed before finishing “LOGIN”!',
    tl: '💬 “LO” ang unang mensahe sa ARPANET. Nag-crash bago matapos ang “LOGIN”!',
    zh: '💬 ARPANET 的第一条消息是“LO”：还没打完“LOGIN”，系统就崩溃了！',
    source: 'https://www.lk.cs.ucla.edu/internet_first_words.html',
  },
];

const storageKey = 'hal-plan-facts';
let remaining: number[] = [];
let last = -1;

// A shuffled deck: show every fact before repeating, including across Plan requests.
function nextFact() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    if (saved && Array.isArray(saved.remaining) && saved.remaining.every((i: number) => Number.isInteger(i) && i >= 0 && i < facts.length)) {
      remaining = saved.remaining;
      last = saved.last;
    }
  } catch { /* In-memory shuffle still works when storage is unavailable. */ }
  if (!remaining.length) {
    remaining = facts.map((_, i) => i);
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    if (remaining[0] === last) [remaining[0], remaining[1]] = [remaining[1], remaining[0]];
  }
  last = remaining.shift()!;
  try { sessionStorage.setItem(storageKey, JSON.stringify({ remaining, last })); } catch {}
  return last;
}

export default function PlanSearchFact({ country, query }: { country: string | null; query: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const language = /\p{Script=Han}/u.test(query) ? 'zh' : country === 'PH' ? 'tl' : 'en';
  useEffect(() => {
    setIndex(nextFact());
    const timer = setInterval(() => setIndex(nextFact()), 5000);
    return () => clearInterval(timer);
  }, []);
  // Announce the steady loading status, not new trivia every five seconds.
  return <span className="plan-search-fact" aria-live="off">{index === null ? '\u00a0' : facts[index][language]}</span>;
}
