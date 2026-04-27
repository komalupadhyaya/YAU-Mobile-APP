import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { apiService } from '../services/api';
import { registerForPushNotificationsAsync } from '../services/notifications';
import { Member } from '../types';

interface UserContextType {
  user: Member | null;
  setUser: (user: Member | null) => Promise<void>;
  loading: boolean;
  clearUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);
const USER_STORAGE_KEY = '@yau_user_data';
const AUTH_STATE_KEY = '@yau_auth_state';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageAvailable, setStorageAvailable] = useState(Platform.OS !== 'web');

  useEffect(() => {
    loadUserData();
    setupAuthListener();
  }, []);

  useEffect(() => {
    if (user && !loading) {
      registerPushToken();
    }
  }, [user, loading]);

  const registerPushToken = async () => {
    try {
      // Only register token if we're on a real device (not Expo Go)
      if (Platform.OS === 'web') {
        return;
      }

      const token = await registerForPushNotificationsAsync();
      
      if (!token) {
        return;
      }
      
      if (user) {
        // Update user with push tokens array (support multiple devices)
        const existingTokens = user.expoPushTokens || [];
        // Add token if not already present
        if (!existingTokens.includes(token)) {
          const updatedTokens = [...existingTokens, token];
          const updatedUser = { ...user, expoPushTokens: updatedTokens };
          
          // Update AsyncStorage
          await updateUser(updatedUser);
          
          // Sync to Firebase directly if user has an ID
          if (user.id) {
            try {
              const memberRef = doc(db, (user as any).collection || 'members', user.id);
              await updateDoc(memberRef, {
                expoPushTokens: updatedTokens
              });
            } catch (apiError) {
              // Firebase update failed, but AsyncStorage update succeeded
              // This is acceptable as the token is still stored locally
              console.warn('[UserContext] Failed to sync push tokens to Firebase:', apiError);
            }
          }
        }
      }
    } catch (error) {
      // Don't throw error - push notifications are optional
    }
  };

  const loadUserData = async () => {
    try {
      if (!storageAvailable) {
        setLoading(false);
        return;
      }
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        
        // DEV logging for debugging
        if (__DEV__) {
          console.log('[UserContext] User state:', parsedUser);
          console.log('[UserContext] Students:', parsedUser?.students);
        }
        
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setStorageAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const setupAuthListener = () => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Firebase user is logged in, load user data from AsyncStorage
        loadUserData();
      } else {
        // Firebase user is logged out
        setUser(null);
      }
    });

    return unsubscribe;
  };

  const updateUser = async (newUser: Member | null) => {
    try {
      // Intentionally update React state BEFORE saving to persistent storage 
      // so routing redirects don't mount early with stale null contexts
      setUser(newUser);
      
      if (newUser && storageAvailable) {
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      } else if (storageAvailable) {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      // State is already updated, which is fine
    }
  };

  const clearUser = async () => {
    try {
      if (storageAvailable) {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
      }
      setUser(null);
    } catch (error) {
      console.error('Error clearing user data:', error);
      setUser(null);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser: updateUser, loading, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
