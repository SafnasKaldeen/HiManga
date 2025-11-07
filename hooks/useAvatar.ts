// hooks/useAvatar.ts
import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';

const AVATAR_COOKIE_KEY = 'user_avatar_id';
const COOKIE_EXPIRY_DAYS = 365;
const AVATAR_UPDATE_EVENT = 'avatarUpdated';

interface UseAvatarOptions {
  serverAvatarId?: number; // Avatar ID from server (SSR)
  fallbackAvatarId?: number; // Fallback if no server value
}

export const useAvatar = (options: UseAvatarOptions = {}) => {
  const { serverAvatarId, fallbackAvatarId = 42 } = options;
  
  // Initialize with server value if available, otherwise use fallback
  const [avatarId, setAvatarId] = useState<number>(() => {
    // If we have a server-provided avatar, use it
    if (serverAvatarId !== undefined) {
      return serverAvatarId;
    }
    
    // Otherwise, try to get from cookie (client-side only)
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

  // Sync with cookie on mount (only if no server avatar provided)
  useEffect(() => {
    if (serverAvatarId !== undefined) {
      // We already have the correct value from server
      return;
    }
    
    const savedAvatarId = Cookies.get(AVATAR_COOKIE_KEY);
    if (savedAvatarId) {
      const parsedId = parseInt(savedAvatarId, 10);
      if (!isNaN(parsedId) && parsedId !== avatarId) {
        setAvatarId(parsedId);
      }
    }
  }, [serverAvatarId, avatarId]);

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

  const updateAvatar = useCallback(async (newAvatarId: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Save to backend API
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatarId: newAvatarId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update avatar');
      }

      // Save to cookie for persistence
      Cookies.set(AVATAR_COOKIE_KEY, newAvatarId.toString(), {
        expires: COOKIE_EXPIRY_DAYS,
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
  }, []);

  return { avatarId, isLoading, updateAvatar };
};

// Utility to get avatar from cookie (for Server Components)
export function getAvatarIdFromCookie(): number | null {
  if (typeof window === 'undefined') return null;
  
  const savedAvatarId = Cookies.get(AVATAR_COOKIE_KEY);
  if (savedAvatarId) {
    const parsedId = parseInt(savedAvatarId, 10);
    if (!isNaN(parsedId)) {
      return parsedId;
    }
  }
  return null;
}