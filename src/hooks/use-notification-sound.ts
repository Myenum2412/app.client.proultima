'use client';
import { useEffect, useRef } from 'react';

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousCountRef = useRef<number>(0);

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.5; // 50% volume
    audioRef.current.preload = 'auto';
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reset to start
      audioRef.current.play().catch(err => {
        console.warn('Could not play notification sound:', err);
      });
    }
  };

  const checkAndPlaySound = (currentCount: number) => {
    // Only play if count increased (new notification)
    if (currentCount > previousCountRef.current) {
      // Check if sound is enabled in localStorage
      const soundEnabled = localStorage.getItem('notification-sound-enabled') !== 'false';
      if (soundEnabled) {
        playNotificationSound();
      }
    }
    previousCountRef.current = currentCount;
  };

  const toggleSound = (enabled: boolean) => {
    localStorage.setItem('notification-sound-enabled', enabled.toString());
  };

  const isSoundEnabled = () => {
    return localStorage.getItem('notification-sound-enabled') !== 'false';
  };

  return { 
    playNotificationSound, 
    checkAndPlaySound, 
    toggleSound, 
    isSoundEnabled 
  };
}
