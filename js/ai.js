// ai.js — opt-in AI layer. Calls Google Gemini (free tier) directly from the
// browser with the user's own key (stored on-device). No backend; REWIRE stays
// static and works fully offline for everything except an explicit AI call.

import { getState, isDone, dayStreak, challengeProgress } from './state.js';
import { levelFromXp, rankFromXp, todayStr } from './utils.js';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
// Free-tier, fast, vision-capable. If a key rejects this, the error surfaces to the user.
export const GEMINI_MODEL = 'gemini-2.0-flash';

// Build the coach's system prompt from the user's real data so it talks about
// their actual numbers, not generic advice. REWIRE's own original voice.
export function buildCoachSystem(S) {
  const done = S.quests.filter(isDone).length;
  const total = S.quests.length;
  const level = levelFromXp(S.totalXp);
  const rank = rankFromXp(S.totalXp).rank.name;
  const cp = challengeProgress();
  const reps = S.quests.map(q => `${isDone(q) ? '[x]' : '[ ]'} ${q.title}${q.hard ? ' (hard)' : ''}`).join(', ');
  const reflection = (S.history[todayStr()] && S.history[todayStr()].reflection) || '';
  const ch = cp
    ? `${cp.c.name}, day ${cp.dayNumber}/${cp.totalDays}, today ${cp.todayComplete ? 'banked' : `${cp.todayDoneCount}/${cp.reqCount} reps left`}, status ${cp.c.status}`
    : 'none active';

  return [
    `You are the REWIRE Coach — a relentless, no-excuses discipline coach. Sharp, direct, a little hard, never cruel and never therapy-speak. You push; you do not coddle. You speak straight to ${S.name}.`,
    `Rules: keep replies SHORT — 2 to 5 sentences. Be specific to their real data below. No emoji spam. No bullet lists unless asked. If they're dodging, name it. If they're winning, acknowledge it in one line then raise the bar.`,
    ``,
    `What you know about ${S.name} right now:`,
    `- Their why: "${S.why || '(not set)'}"`,
    `- The version of them they're proving wrong: "${S.nemesis || '(not set)'}"`,
    `- Today: ${done}/${total} reps done. Day streak: ${dayStreak()}. Level ${level} (rank: ${rank}).`,
    `- Reps today: ${reps || '(none set)'}`,
    `- Challenge: ${ch}`,
    `- Anti-scroll: ${S.scroll.resisted} urges resisted, ${S.scroll.gaveIn} slips, clean run ${S.scroll.run}. Focus sessions held: ${S.focusSessions || 0}.`,
    `- Today's reflection: "${reflection || '(none yet)'}"`,
    ``,
    `Use these facts. Reference their why or nemesis when it actually lands. Make every reply about their numbers, not platitudes.`,
  ].join('\n');
}

// Send the current coach conversation to Gemini and return the reply text.
// Expects S.ai.chat to already include the latest user message.
export async function aiCoachReply() {
  const S = getState();
  const key = S.ai && S.ai.key;
  if (!key) { const e = new Error('No API key set'); e.code = 'NO_KEY'; throw e; }

  const history = (S.ai.chat || []).map(m => ({
    role: m.role === 'coach' ? 'model' : 'user',
    parts: [{ text: m.text }],
  }));
  if (!history.length) throw new Error('Nothing to send');

  const body = {
    system_instruction: { parts: [{ text: buildCoachSystem(S) }] },
    contents: history,
    generationConfig: { temperature: 0.9, maxOutputTokens: 600 },
  };

  const res = await fetch(`${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json()).error?.message || ''; } catch { detail = await res.text().catch(() => ''); }
    if (res.status === 400 && /API key/i.test(detail)) { const e = new Error('That key was rejected. Check it in Settings.'); e.code = 'BAD_KEY'; throw e; }
    throw new Error(`Gemini ${res.status}: ${(detail || 'request failed').slice(0, 160)}`);
  }
  const data = await res.json();
  const text = (data.candidates && data.candidates[0] && data.candidates[0].content
    && data.candidates[0].content.parts || []).map(p => p.text || '').join('').trim();
  if (!text) throw new Error('Coach went quiet — try again.');
  return text;
}
