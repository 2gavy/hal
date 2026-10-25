import { useEffect, useRef, useState } from 'react';
import { elevenChat } from '@/lib/eleven-chat';
import { requestPlan } from '@/lib/plan-client.mjs';
import { displayAnswer } from '@/lib/display-answer.mjs';
import { canRunPlan } from '@/lib/logic.mjs';
import type { Mode, Result, Turn } from '@/lib/hal-types';
import type { VoiceTurn } from '../components/eleven-voice';
import { useHalLocation } from './use-hal-location';

// Conversation controller: persisted demo state, requests and provider callbacks.
// UI components receive data and actions; they do not call Exa or ElevenLabs.
export function useHal() {
  const [mode, setMode] = useState<Mode>('chat');
  const [drafts, setDrafts] = useState({ chat: '', plan: '' });
  const [turns, setTurns] = useState<Record<Mode, Turn[]>>({ chat: [], plan: [] });
  const [runs, setRuns] = useState(0);
  const [upgraded, setUpgraded] = useState(false);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<null | 'settings' | 'subscription' | 'cancel'>(null);
  const [paywall, setPaywall] = useState(false);
  const [settings, setSettings] = useState(false);
  const [busy, setBusy] = useState<Mode | null>(null);
  const [partial, setPartial] = useState<{ title: string; answer: string } | null>(null);
  const [chatStage, setChatStage] = useState<'connecting' | 'searching' | 'writing'>('connecting');
  const [activeQuery, setActiveQuery] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const geo = useHalLocation(setToast);
  const { location, locating, useDeviceLocation } = geo;
  const [access, setAccess] = useState('');
  const pendingQuery = useRef('');
  const [accessError, setAccessError] = useState('');
  useEffect(() => {
    try {
      setAccess(sessionStorage.getItem('hal-access') || '');
    } catch {}
  }, []);
  const [callOpen, setCallOpen] = useState(false);
  const callButton = useRef<HTMLButtonElement>(null);
  const [speaking, setSpeaking] = useState(false);
  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
      abort.current?.abort();
    },
    [],
  );
  const abort = useRef<AbortController | null>(null),
    lock = useRef(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('hal-demo-v1') || 'null');
      if (saved) {
        setRuns(Math.max(0, Math.min(3, Number(saved.runs) || 0)));
        setUpgraded(saved.upgraded === true);
        if (saved.turns?.chat && saved.turns?.plan) setTurns(saved.turns);
      }
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem('hal-demo-v1', JSON.stringify({ runs, upgraded, turns }));
      } catch {}
  }, [runs, upgraded, turns, ready]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (paywall || settings || profile || callOpen) return;
      if ((e.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]'))
        return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setMode('chat');
        setError('');
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setMode('plan');
        setError('');
      }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [paywall, settings, profile, callOpen]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }
  function chooseCountry(country: string) {
    stopSpeaking();
    if (country !== location.country) {
      abort.current?.abort();
      abort.current = null;
      lock.current = false;
      setBusy(null);
      setActiveQuery('');
      setPartial(null);
      setTurns({ chat: [], plan: [] });
      setDrafts({ chat: '', plan: '' });
      pendingQuery.current = '';
      setSettings(false);
      setError('');
      setToast('');
    }
    geo.chooseCountry(country);
  }
  function change(next: Mode) {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setMode(next);
    setError('');
  }
  async function send(text = drafts[mode], accessCode = access, requestMode: Mode = mode) {
    if (lock.current || !text.trim()) return;
    if (requestMode === 'plan' && !canRunPlan(runs, upgraded)) {
      setPaywall(true);
      return;
    }
    lock.current = true;
    const current = requestMode;
    const query = text.trim();
    setActiveQuery(query);
    setPartial(null);
    setChatStage('connecting');
    setBusy(current);
    setError('');
    const controller = new AbortController();
    abort.current = controller;
    try {
      let result: Result;
      if (current === 'chat') {
        result = await elevenChat(
          query,
          accessCode,
          location,
          controller.signal,
          turns.chat.map((t) => ({ query: t.query, answer: t.result.answer })),
          (update) => {
            if (controller.signal.aborted) return;
            setChatStage(update.stage);
            if (update.answer !== undefined) setPartial({ title: '', answer: update.answer });
          },
        );
      } else {
        result = await requestPlan(query, accessCode, location, controller.signal, setPartial);
        try {
          if (accessCode) sessionStorage.setItem('hal-access', accessCode);
        } catch {}
      }

      if (controller.signal.aborted) return;
      result = { ...result, answer: displayAnswer(result.answer) };
      const turnId = crypto.randomUUID();
      setTurns((t) => ({ ...t, [current]: [...t[current], { id: turnId, query, result }] }));
      setDrafts((d) => ({ ...d, [current]: '' }));
      if (current === 'plan' && !upgraded) setRuns((n) => Math.min(3, n + 1));
    } catch (e) {
      if ((e as { status?: number }).status === 401) {
        pendingQuery.current = query;
        setAccessError(accessCode ? 'That code wasn’t accepted. Please try again.' : '');
        try {
          sessionStorage.removeItem('hal-access');
        } catch {}
        setSettings(true);
        return;
      }
      if (!controller.signal.aborted && e instanceof Error && e.name !== 'AbortError')
        setError(e.message);
    } finally {
      if (abort.current === controller) {
        setActiveQuery('');
        setPartial(null);
        setBusy(null);
        lock.current = false;
        abort.current = null;
      }
    }
  }
  function speak(text: string) {
    if (!window.speechSynthesis) {
      setToast('Speech playback is unavailable in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = location.speech;
    const voices = window.speechSynthesis.getVoices();
    const match =
      voices.find((v) => v.lang.toLowerCase() === location.speech.toLowerCase()) ||
      voices.find((v) => v.lang.split('-')[0] === location.speech.split('-')[0]);
    if (match) utterance.voice = match;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }
  function endCall() {
    setCallOpen(false);
    setToast('');
    requestAnimationFrame(() => callButton.current?.focus());
  }
  function startCall() {
    stopSpeaking();
    setMode('chat');
    setCallOpen(true);
    setError('');
    setToast('');
  }
  function resetDemo() {
    setRuns(0);
    setUpgraded(false);
    setTurns({ chat: [], plan: [] });
    setDrafts({ chat: '', plan: '' });
    setProfile(null);
    setToast('Demo reset. 3 plan runs left.');
  }
  function onVoiceTurn(turn: VoiceTurn) {
    setTurns((previous) => {
      const result: Result = {
        title: '',
        answer: displayAnswer(turn.answer),
        places: turn.evidence.places,
        sources: turn.evidence.sources,
        sample: false,
        elapsedMs: 0,
        metrics: {
          searchType: 'lite',
          searchMs: turn.evidence.searchMs,
          voiceMs: turn.evidence.voiceMs,
          estimatedHighlightTokens: turn.evidence.estimatedHighlightTokens,
          costDollars: null,
        },
      };
      const item: Turn = { id: turn.id, channel: 'voice', query: turn.query, result };
      return {
        ...previous,
        chat: previous.chat.some((t) => t.id === turn.id)
          ? previous.chat.map((t) => (t.id === turn.id ? item : t))
          : [...previous.chat, item],
      };
    });
  }
  return {
    mode,
    drafts,
    turns,
    runs,
    upgraded,
    ready,
    profile,
    setProfile,
    paywall,
    setPaywall,
    settings,
    setSettings,
    busy,
    partial,
    chatStage,
    activeQuery,
    error,
    toast,
    location,
    locating,
    useDeviceLocation,
    access,
    setAccess,
    accessError,
    callOpen,
    callButton,
    speaking,
    chooseCountry,
    change,
    send,
    speak,
    stopSpeaking,
    endCall,
    startCall,
    resetDemo,
    onVoiceTurn,
    setUpgraded,
    setToast,
    stop: () => abort.current?.abort(),
    setDraft: (text: string) => setDrafts((d) => ({ ...d, [mode]: text })),
    newConversation: () => {
      setTurns((t) => ({ ...t, [mode]: [] }));
      setError('');
    },
    continueWithCode: (code: string) => send(pendingQuery.current, code),
  };
}
