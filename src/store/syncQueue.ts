// src/store/syncQueue.ts
import { supabase } from '../lib/supabase';
import type { TacticPhase, CalendarEvent, PlayerAccount, CoachMessage } from '../types';

// ─── Dirty flags ──────────────────────────────────────────────
let dirty = {
  phases: false,
  events: false,
  playerAccounts: false,
  coachMessages: false,
  chatMessages: false,
};

let syncTimer: ReturnType<typeof setTimeout> | null = null;

const SYNC_TIMEOUT_MS = 12_000;
const MAX_SYNC_ATTEMPTS = 5;

let syncFailCount = 0;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  const controller = new AbortController();
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Sync push timed out after ${SYNC_TIMEOUT_MS}ms`));
    }, SYNC_TIMEOUT_MS);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

function hasDirty() {
  return dirty.phases || dirty.events || dirty.playerAccounts || dirty.coachMessages || dirty.chatMessages;
}

// ─── Pushere (samme som dine eksisterende) ────────────────────
// Du må flytte disse hit fra useAppStore.ts, eller importere dem.
// For enkelhets skyld – behold dem i useAppStore, men kall dem via denne filen.

// Vi definerer en callback som storen kaller for å utføre selve pushes.
let pushPhasesFn: (phases: TacticPhase[]) => Promise<void> = async () => {};
let pushEventsFn: (events: CalendarEvent[]) => Promise<void> = async () => {};
let pushPlayerAccountsFn: (accounts: PlayerAccount[]) => Promise<void> = async () => {};
let pushCoachMessagesFn: (msgs: CoachMessage[]) => Promise<void> = async () => {};
let pushChatMessagesFn: (msgs: any[]) => Promise<void> = async () => {};

export function registerSyncCallbacks(callbacks: {
  pushPhases: (phases: TacticPhase[]) => Promise<void>;
  pushEvents: (events: CalendarEvent[]) => Promise<void>;
  pushPlayerAccounts: (accounts: PlayerAccount[]) => Promise<void>;
  pushCoachMessages: (msgs: CoachMessage[]) => Promise<void>;
  pushChatMessages: (msgs: any[]) => Promise<void>;
}) {
  pushPhasesFn = callbacks.pushPhases;
  pushEventsFn = callbacks.pushEvents;
  pushPlayerAccountsFn = callbacks.pushPlayerAccounts;
  pushCoachMessagesFn = callbacks.pushCoachMessages;
  pushChatMessagesFn = callbacks.pushChatMessages;
}

function scheduleSync() {
  if (!initialized) return;
  if (syncTimer) return;
  syncTimer = setTimeout(async () => {
    let failed = false;
    // Hent siste state fra store (vi må ha en måte å hente den på)
    // For å unngå sirkulær avhengighet, bruker vi en getState-funksjon som settes fra storen.
    const state = getCurrentState();

    if (dirty.phases && state.phases) {
      try {
        await withTimeout(pushPhasesFn(state.phases));
        dirty.phases = false;
      } catch (e) { failed = true; console.warn('syncQueue: pushPhases failed', e); }
    }
    if (dirty.events && state.events) {
      try {
        await withTimeout(pushEventsFn(state.events));
        dirty.events = false;
      } catch (e) { failed = true; console.warn('syncQueue: pushEvents failed', e); }
    }
    if (dirty.playerAccounts && state.playerAccounts) {
      try {
        await withTimeout(pushPlayerAccountsFn(state.playerAccounts));
        dirty.playerAccounts = false;
      } catch (e) { failed = true; console.warn('syncQueue: pushPlayerAccounts failed', e); }
    }
    if (dirty.coachMessages && state.coachMessages) {
      try {
        await withTimeout(pushCoachMessagesFn(state.coachMessages));
        dirty.coachMessages = false;
      } catch (e) { failed = true; console.warn('syncQueue: pushCoachMessages failed', e); }
    }
    if (dirty.chatMessages && state.chatMessages) {
      try {
        await withTimeout(pushChatMessagesFn(state.chatMessages));
        dirty.chatMessages = false;
      } catch (e) { failed = true; console.warn('syncQueue: pushChatMessages failed', e); }
    }

    syncTimer = null;
    if (!failed) {
      syncFailCount = 0;
    } else {
      syncFailCount += 1;
      if (syncFailCount >= MAX_SYNC_ATTEMPTS) {
        console.error(`syncQueue ga opp etter ${MAX_SYNC_ATTEMPTS} feilede forsøk; endringer venter på ny brukerhandling`);
      }
    }
    // Prøv igjen inntil maks antall forsøk er nådd.
    if (hasDirty() && syncFailCount < MAX_SYNC_ATTEMPTS) scheduleSync();
  }, 2000); // 2 sekunders batch-vindu
}

let getCurrentState: () => any = () => ({});
let initialized = false;

export function initSyncQueue(getState: () => any) {
  getCurrentState = getState;
  initialized = true;
  if (hasDirty()) scheduleSync();
}

// ─── Eksponerte mark-funksjoner ───────────────────────────────
export function markPhasesDirty() { dirty.phases = true; scheduleSync(); }
export function markEventsDirty() { dirty.events = true; scheduleSync(); }
export function markPlayerAccountsDirty() { dirty.playerAccounts = true; scheduleSync(); }
export function markCoachMessagesDirty() { dirty.coachMessages = true; scheduleSync(); }
export function markChatMessagesDirty() { dirty.chatMessages = true; scheduleSync(); }

// Force sync umiddelbart (f.eks. før app lukkes)
export async function forceSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = null;
  const state = getCurrentState();
  try {
    const promises: Promise<void>[] = [];
    if (dirty.phases && state.phases) promises.push(withTimeout(pushPhasesFn(state.phases)));
    if (dirty.events && state.events) promises.push(withTimeout(pushEventsFn(state.events)));
    if (dirty.playerAccounts && state.playerAccounts) promises.push(withTimeout(pushPlayerAccountsFn(state.playerAccounts)));
    if (dirty.coachMessages && state.coachMessages) promises.push(withTimeout(pushCoachMessagesFn(state.coachMessages)));
    if (dirty.chatMessages && state.chatMessages) promises.push(withTimeout(pushChatMessagesFn(state.chatMessages)));
    await Promise.all(promises);
    dirty = { phases: false, events: false, playerAccounts: false, coachMessages: false, chatMessages: false };
  } catch (e) {
    console.warn('forceSync failed', e);
  }
}