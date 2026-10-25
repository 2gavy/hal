import { useEffect, useState } from 'react';

const facts = {
  en: [
    '☕ “Java” can mean coffee, an island or a programming language. Context matters!',
    '📍 “Near me” starts with one important clue: where you are.',
    '🔎 Different words can ask the same question. Meaning matters more than an exact match.',
    '📅 A great answer from last year might need a fresh look today.',
    '🔗 A source link lets you follow the trail behind an answer.',
  ],
  tl: [
    '☕ Ang “Java” ay puwedeng kape, isla o programming language. Mahalaga ang konteksto!',
    '📍 Ang “malapit sa akin” ay nagsisimula sa lokasyon mo.',
    '🔎 Magkaibang salita, parehong tanong. Mahalaga ang kahulugan.',
    '📅 Ang sagot noong nakaraang taon ay maaaring kailangan nang i-update.',
    '🔗 Sa source link, puwede mong tingnan kung saan galing ang sagot.',
  ],
  zh: [
    '☕ “Java”可以指咖啡、岛屿或编程语言。上下文很重要！',
    '📍 搜索“附近”时，你的位置就是重要线索。',
    '🔎 不同的用词，也可能是在问同一个问题。意思比字面更重要。',
    '📅 去年的好答案，今天可能需要重新确认。',
    '🔗 来源链接让你能追溯答案的依据。',
  ],
};

// Only mounted while Plan is loading; cleanup stops rotation on completion or cancel.
export default function PlanSearchFact({ country, query }: { country: string | null; query: string }) {
  const [index, setIndex] = useState(0);
  const language = /\p{Script=Han}/u.test(query) ? 'zh' : country === 'PH' ? 'tl' : 'en';
  const items = facts[language];
  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % items.length), 5000);
    return () => clearInterval(timer);
  }, [items.length]);
  // Keep the steady loading status accessible without announcing trivia every five seconds.
  return <span className="plan-search-fact" aria-live="off">{items[index]}</span>;
}
