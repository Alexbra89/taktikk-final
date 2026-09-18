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
  if (syncTimer) return;
  syncTimer = setTimeout(async () => {
    try {
      // Hent siste state fra store (vi må ha en måte å hente den på)
      // For å unngå sirkulær avhengighet, bruker vi en getState-funksjon som settes fra storen.
      const state = getCurrentState();

      if (dirty.phases && state.phases) {
        await withTimeout(pushPhasesFn(state.phases));
        dirty.phases = false;
      }
      if (dirty.events && state.events) {
        await withTimeout(pushEventsFn(state.events));
        dirty.events = false;
      }
      if (dirty.playerAccounts && state.playerAccounts) {
        await withTimeout(pushPlayerAccountsFn(state.playerAccounts));
        dirty.playerAccounts = false;
      }
      if (dirty.coachMessages && state.coachMessages) {
        await withTimeout(pushCoachMessagesFn(state.coachMessages));
        dirty.coachMessages = false;
      }
      if (dirty.chatMessages && state.chatMessages) {
        await withTimeout(pushChatMessagesFn(state.chatMessages));
        dirty.chatMessages = false;
      }
    } catch (e) {
      console.warn('syncQueue run failed', e);
    } finally {
      syncTimer = null;
      // Hvis noe fortsatt er dirty (push feilet), prøv igjen.
      if (hasDirty()) scheduleSync();
    }
  }, 2000); // 2 sekunders batch-vindu
}

let getCurrentState: () => any = () => ({});

export function initSyncQueue(getState: () => any) {
  getCurrentState = getState;
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