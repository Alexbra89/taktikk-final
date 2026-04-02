'use client';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

interface NotificationContextType {
  permission: NotificationPermission;
  requestPermission: () => void;
  sendNotification: (title: string, options?: NotificationOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};

// Lydfunksjon uten ekstern fil
const playBeep = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.3;
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
    setTimeout(() => {
      audioContext.close();
    }, 600);
  } catch (e) {
    console.log('Kunne ikke spille lyd', e);
  }
};

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [hasShownPrompt, setHasShownPrompt] = useState(false);
  const lastMessageIdRef = useRef<string | null>(null);
  const lastCoachMessageIdRef = useRef<string | null>(null);

  const { chatMessages, coachMessages, currentUser, events } = useAppStore();
  const isCoach = currentUser?.role === 'coach';
  const myPlayerId = currentUser?.playerId;

  // Be om tillatelse ved første interaksjon
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Notifikasjoner støttes ikke i denne nettleseren');
      return;
    }

    if (permission === 'granted') return;
    
    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      new Notification('🔔 Notifikasjoner aktivert', {
        body: 'Du vil nå motta varsler om nye meldinger og arrangementer.',
        icon: '/icon-192.png',
        silent: false,
      });
      playBeep();
    }
  };

  // Send notifikasjon
  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;
    
    playBeep();
    
    const notification = new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      silent: false,
      ...options,
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  // Lytt til nye chat-meldinger
  useEffect(() => {
    if (permission !== 'granted') return;
    
    const latestMessage = chatMessages[chatMessages.length - 1];
    if (!latestMessage) return;
    
    const isNewMessage = lastMessageIdRef.current !== latestMessage.id;
    
    if (isNewMessage && latestMessage.id) {
      lastMessageIdRef.current = latestMessage.id;
      
      const isFromMe = latestMessage.fromName === currentUser?.name;
      const isForMe = !latestMessage.toPlayerId || 
                      latestMessage.toPlayerId === myPlayerId ||
                      (isCoach && latestMessage.fromRole === 'player');
      
      if (!isFromMe && isForMe && document.hidden) {
        const fromName = latestMessage.fromRole === 'coach' ? '🏋️ Trener' : `👤 ${latestMessage.fromName}`;
        sendNotification(`Ny melding fra ${fromName}`, {
          body: latestMessage.content.slice(0, 100),
          tag: 'chat-message',
        });
      }
    }
  }, [chatMessages, permission, currentUser, myPlayerId, isCoach]);

  // Lytt til nye trenermeldinger
  useEffect(() => {
    if (permission !== 'granted' || isCoach) return;
    
    const latestMessage = coachMessages[coachMessages.length - 1];
    if (!latestMessage) return;
    
    const isForMe = latestMessage.playerId === myPlayerId;
    const isNew = lastCoachMessageIdRef.current !== latestMessage.id;
    
    if (isForMe && isNew && latestMessage.id) {
      lastCoachMessageIdRef.current = latestMessage.id;
      
      if (document.hidden) {
        sendNotification('📬 Ny melding fra trener', {
          body: latestMessage.content.slice(0, 100),
          tag: 'coach-message',
        });
      }
    }
  }, [coachMessages, permission, isCoach, myPlayerId]);

  // Sjekk kommende arrangementer (en gang per dag)
  useEffect(() => {
    if (permission !== 'granted') return;
    
    const checkUpcomingEvents = () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);
      
      const tomorrowEvents = events.filter(e => e.date === tomorrowStr);
      
      if (tomorrowEvents.length > 0 && !localStorage.getItem(`notified-${tomorrowStr}`)) {
        const event = tomorrowEvents[0];
        const emoji = event.type === 'match' ? '⚽' : '🏃';
        sendNotification(`${emoji} Kommende arrangement i morgen!`, {
          body: `${event.title} kl. ${event.time || '?'}${event.location ? ` 📍 ${event.location}` : ''}`,
          tag: 'upcoming-event',
        });
        localStorage.setItem(`notified-${tomorrowStr}`, 'true');
      }
    };
    
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    
    const timeout = setTimeout(() => {
      checkUpcomingEvents();
      setInterval(checkUpcomingEvents, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
    
    return () => clearTimeout(timeout);
  }, [events, permission]);

  // Vis prompt for notifikasjoner etter kort tid
  useEffect(() => {
    if (!hasShownPrompt && 'Notification' in window && permission === 'default') {
      const timer = setTimeout(() => {
        const wantNotifications = confirm('🔔 Vil du motta varsler om nye meldinger og kommende arrangementer?');
        if (wantNotifications) {
          requestPermission();
        }
        setHasShownPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasShownPrompt, permission]);

  return (
    <NotificationContext.Provider value={{ permission, requestPermission, sendNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}