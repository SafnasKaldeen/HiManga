// hooks/useAvatar.ts
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const AVATAR_COOKIE_KEY = 'user_avatar_id';
const COOKIE_EXPIRY_DAYS = 365; // 1 year
const AVATAR_UPDATE_EVENT = 'avatarUpdated';

export const useAvatar = (initialAvatarId: number) => {
  const [avatarId, setAvatarId] = useState<number>(initialAvatarId);
  const [isLoading, setIsLoading] = useState(false);

  // Load avatar from cookie on mount
  useEffect(() => {
    const savedAvatarId = Cookies.get(AVATAR_COOKIE_KEY);
    
    if (savedAvatarId) {
      const parsedId = parseInt(savedAvatarId, 10);
      if (!isNaN(parsedId)) {
        setAvatarId(parsedId);
      }
    }
  }, []);

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
      // Save to backend API
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: includes cookies
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
  };

  return { avatarId, isLoading, updateAvatar };
};