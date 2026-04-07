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
    // Hent siste state fra store (vi må ha en måte å hente den på)
    // For å unngå sirkulær avhengighet, bruker vi en getState-funksjon som settes fra storen.
    const state = getCurrentState();
    
    if (dirty.phases && state.phases) {
      await pushPhasesFn(state.phases);
      dirty.phases = false;
    }
    if (dirty.events && state.events) {
      await pushEventsFn(state.events);
      dirty.events = false;
    }
    if (dirty.playerAccounts && state.playerAccounts) {
      await pushPlayerAccountsFn(state.playerAccounts);
      dirty.playerAccounts = false;
    }
    if (dirty.coachMessages && state.coachMessages) {
      await pushCoachMessagesFn(state.coachMessages);
      dirty.coachMessages = false;
    }
    if (dirty.chatMessages && state.chatMessages) {
      await pushChatMessagesFn(state.chatMessages);
      dirty.chatMessages = false;
    }

    syncTimer = null;
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
  const promises = [];
  if (dirty.phases && state.phases) promises.push(pushPhasesFn(state.phases));
  if (dirty.events && state.events) promises.push(pushEventsFn(state.events));
  if (dirty.playerAccounts && state.playerAccounts) promises.push(pushPlayerAccountsFn(state.playerAccounts));
  if (dirty.coachMessages && state.coachMessages) promises.push(pushCoachMessagesFn(state.coachMessages));
  if (dirty.chatMessages && state.chatMessages) promises.push(pushChatMessagesFn(state.chatMessages));
  await Promise.all(promises);
  dirty = { phases: false, events: false, playerAccounts: false, coachMessages: false, chatMessages: false };
}