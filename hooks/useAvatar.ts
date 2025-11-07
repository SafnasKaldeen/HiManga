// hooks/useAvatar.ts
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const AVATAR_COOKIE_KEY = 'user_avatar_id';
const COOKIE_EXPIRY_DAYS = 365;
const AVATAR_UPDATE_EVENT = 'avatarUpdated';

interface UseAvatarOptions {
  serverAvatarId?: number;
  fallbackAvatarId?: number;
}

export const useAvatar = (options: UseAvatarOptions = {}) => {
  const { serverAvatarId, fallbackAvatarId = 42 } = options;
  
  const [avatarId, setAvatarId] = useState<number>(() => {
    // Initialize from cookie first
    if (typeof window !== 'undefined') {
      const savedAvatarId = Cookies.get(AVATAR_COOKIE_KEY);
      if (savedAvatarId) {
        const parsedId = parseInt(savedAvatarId, 10);
        if (!isNaN(parsedId)) {
          return parsedId;
        }
      }
    }
    return fallbackAvatarId;
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Update avatar when serverAvatarId changes (user data loads)
  useEffect(() => {
    if (serverAvatarId !== undefined && serverAvatarId !== avatarId) {
      setAvatarId(serverAvatarId);
      // Also update cookie to stay in sync
      Cookies.set(AVATAR_COOKIE_KEY, serverAvatarId.toString(), {
        expires: COOKIE_EXPIRY_DAYS,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
    }
  }, [serverAvatarId]);

  // Listen for avatar updates from other components
  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent<number>) => {
      setAvatarId(event.detail);
    };

    window.addEventListener(AVATAR_UPDATE_EVENT, handleAvatarUpdate as EventListener);
    
    return () => {
      window.removeEventListener(AVATAR_UPDATE_EVENT, handleAvatarUpdate as EventListener);
    };
  }, []);

  const updateAvatar = async (newAvatarId: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Save to cookie FIRST for immediate persistence
      Cookies.set(AVATAR_COOKIE_KEY, newAvatarId.toString(), {
        expires: COOKIE_EXPIRY_DAYS,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });

      // Update local state
      setAvatarId(newAvatarId);
      
      // Dispatch custom event to notify other components
      const event = new CustomEvent(AVATAR_UPDATE_EVENT, { detail: newAvatarId });
      window.dispatchEvent(event);
      
      return true;
    } catch (error) {
      console.error('Error updating avatar:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { avatarId, isLoading, updateAvatar };
};