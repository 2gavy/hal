import {SEARCH_PROFILES} from './search-profiles.mjs';
// Evaluation convention, not a model tokenizer. Applies to highlight text only.
export const CHARS_PER_ESTIMATED_TOKEN = 4;
export const MAX_CONTEXT_TOKENS = 6000;
export const MAX_CONTEXT_CHARACTERS = MAX_CONTEXT_TOKENS * CHARS_PER_ESTIMATED_TOKEN;
export const CHAT_RESULT_COUNT = SEARCH_PROFILES.chat.numResults;

export function budgetEvidence(sources, mode) {
 const totalLimit = MAX_CONTEXT_CHARACTERS;
 let left = totalLimit;
 const retained = sources.slice(0, mode === 'chat' ? CHAT_RESULT_COUNT : sources.length).map(source => {
  const limit = left;
  let excerpt = source.excerpt.slice(0, limit);
  // Do not cut a UTF-16 surrogate pair in half.
  if (/[\uD800-\uDBFF]$/.test(excerpt)) excerpt = excerpt.slice(0, -1);
  left -= excerpt.length;
  return {...source, excerpt};
 });
 const rawCharacters = sources.reduce((n, s) => n + s.excerpt.length, 0);
 const retainedCharacters = totalLimit - left;
 return {sources:retained,rawCharacters,retainedCharacters,characterLimit:totalLimit,
  estimatedTokens:Math.ceil(retainedCharacters / CHARS_PER_ESTIMATED_TOKEN),
  truncated:retainedCharacters < rawCharacters};
}
