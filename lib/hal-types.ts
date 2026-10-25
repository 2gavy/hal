import { resolveLocation } from './location.mjs';
export type Mode = 'chat' | 'plan';
export type Result = {
  places?: { name: string; address?: string }[];
  searchResults?: { title: string; url: string; excerpt: string }[];
  title: string;
  answer: string;
  sources: { title: string; url: string }[];
  sample: boolean;
  elapsedMs: number;
  metrics?: {
    requestId?: string;
    contextBudgetScope?: string;
    searchTimingSource?: string;
    searchMs?: number;
    voiceMs?: number;
    generationMs?: number;
    inputTokens?: number;
    outputTokens?: number;
    audioStartMs?: number;
    endpointMs?: number;
    searchType: string;
    estimatedHighlightTokens?: number;
    costDollars: number | null;
  };
};
export type Turn = {
  channel?: 'chat' | 'voice' | 'plan';
  id: string;
  query: string;
  result: Result;
};
export type HalLocation = ReturnType<typeof resolveLocation>;
export type PartialAnswer = { title: string; answer: string };
export type ChatStage = 'connecting' | 'searching' | 'writing';
export type Profile = null | 'settings' | 'subscription' | 'cancel';
