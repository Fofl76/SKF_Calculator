import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, Auth } from 'firebase/auth';
// @ts-ignore - firebaseAuth может быть undefined если Firebase не инициализирован
import { Auth as firebaseAuth, Firestore as firestoreDb } from '../config/firebase';
import { databaseService } from '../services/databaseService';
import { UserProfile, Analysis } from '../types/database';

// Type assertion for auth
// @ts-ignore - firebaseAuth может быть undefined если Firebase не инициализирован
const typedAuth: Auth | undefined = firebaseAuth;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  userProfile: UserProfile | null;
  userAnalyses: Analysis[];
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  saveAnalysis: (analysisData: Omit<Analysis, 'id' | 'userId' | 'createdAt'>) => Promise<string>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userAnalyses, setUserAnalyses] = useState<Analysis[]>([]);

  useEffect(() => {
    let isMounted = true;

    // Проверяем инициализирован ли Firebase
    if (!typedAuth) {
      console.error('Firebase auth not initialized');
      setError('Firebase не инициализирован. Проверьте настройки.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(typedAuth, async (user) => {
      console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');

      try {
        if (user && isMounted) {
          try {
            // Обновляем время последнего входа
            await databaseService.updateUserLastLogin(user.uid);

            // Загружаем профиль пользователя
            const profile = await databaseService.getUserProfile(user.uid);
            if (isMounted) setUserProfile(profile);

            // Загружаем анализы пользователя
            const analyses = await databaseService.getUserAnalyses(user.uid);
            if (isMounted) setUserAnalyses(analyses);

            // Сбрасываем ошибку если данные загружены успешно
            if (isMounted) setError(null);
          } catch (error) {
            console.error('Error loading user data from database:', error);
            if (isMounted) {
              setError('Ошибка загрузки данных пользователя из базы данных');
              setUserProfile(null);
              setUserAnalyses([]);
            }
          }
        } else if (isMounted) {
          setUserProfile(null);
          setUserAnalyses([]);
          setError(null);
        }

        if (isMounted) {
          setUser(user);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        if (isMounted) {
          setError('Ошибка подключения к базе данных. Проверьте настройки Firebase.');
          setUser(null);
          setUserProfile(null);
          setUserAnalyses([]);
          setLoading(false);
        }
      }
    });

    // Таймаут на случай если Firebase не отвечает
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('Firebase auth timeout - loading fallback');
        setError('Превышено время ожидания подключения к Firebase');
        setUser(null);
        setUserProfile(null);
        setUserAnalyses([]);
        setLoading(false);
      }
    }, 10000); // 10 секунд таймаут

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!typedAuth) throw new Error('Firebase auth not initialized');

    try {
      const userCredential = await signInWithEmailAndPassword(typedAuth, email, password);
      console.log('User signed in:', userCredential.user.email);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!typedAuth) throw new Error('Firebase auth not initialized');

    try {
      const userCredential = await createUserWithEmailAndPassword(typedAuth, email, password);
      console.log('User signed up:', userCredential.user.email);

      // Создаем запись в базе данных
      await databaseService.createUser(userCredential.user.uid, email);
      console.log('User created in database');
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!typedAuth) throw new Error('Firebase auth not initialized');

    try {
      await signOut(typedAuth);
      console.log('User signed out');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await databaseService.updateUserProfile(user.uid, updates);

      // Обновляем локальное состояние
      if (userProfile) {
        setUserProfile({ ...userProfile, ...updates, updatedAt: new Date() });
      } else {
        // Если профиля не было, создаем новый
        const newProfile = await databaseService.getUserProfile(user.uid);
        setUserProfile(newProfile);
      }

      console.log('User profile updated');
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const saveAnalysis = async (analysisData: Omit<Analysis, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const analysisId = await databaseService.saveAnalysis(user.uid, analysisData);

      // Обновляем локальное состояние
      const newAnalysis: Analysis = {
        id: analysisId,
        userId: user.uid,
        ...analysisData,
        createdAt: new Date(),
      };

      setUserAnalyses(prev => [newAnalysis, ...prev]);
      console.log('Analysis saved:', analysisId);
      return analysisId;
    } catch (error) {
      console.error('Save analysis error:', error);
      throw error;
    }
  };

  const refreshUserData = async () => {
    if (!user) return;

    try {
      const [profile, analyses] = await Promise.all([
        databaseService.getUserProfile(user.uid),
        databaseService.getUserAnalyses(user.uid),
      ]);

      setUserProfile(profile);
      setUserAnalyses(analyses);
      console.log('User data refreshed');
    } catch (error) {
      console.error('Refresh user data error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    userProfile,
    userAnalyses,
    signIn,
    signUp,
    logout,
    updateUserProfile,
    saveAnalysis,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};