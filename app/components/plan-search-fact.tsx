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
    en: '👗 Searches for Jennifer Lopez’s green Versace dress helped inspire Google Images.',
    tl: '👗 Naging inspirasyon ng Google Images ang paghahanap sa berdeng Versace dress ni Jennifer Lopez.',
    zh: '👗 大家争相搜索珍妮弗·洛佩兹的绿色礼服，推动了 Google 图片搜索的诞生。',
    source: 'https://blog.google/products-and-platforms/products/search/18-years-after-google-images-versace-jungle-print-dress-back/',
  },
  {
    en: '💆 Before it was Google, the search engine was called Backrub. Yes, really.',
    tl: '💆 Bago naging Google, Backrub ang pangalan ng search engine. Totoo!',
    zh: '💆 Google 最初的名字是 Backrub，意思是“背部按摩”。真的！',
    source: 'https://about.google/company-info/our-story/',
  },
  {
    en: '🔢 Google’s name plays on “googol”: a 1 followed by 100 zeros.',
    tl: '🔢 Mula sa “googol” ang pangalang Google: numero 1 na may kasunod na 100 zero.',
    zh: '🔢 Google 的名字源于“googol”：数字 1 后面跟着 100 个零。',
    source: 'https://about.google/company-info/our-story/',
  },
  {
    en: '🎨 The first Google Doodle told visitors the founders were away at Burning Man.',
    tl: '🎨 Ang unang Google Doodle ay nagsabing nasa Burning Man ang mga founder.',
    zh: '🎨 第一个 Google 涂鸦是个外出通知：创始人去参加火人节了！',
    source: 'https://about.google/company-info/our-story/',
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
