import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
// @ts-ignore - db может быть undefined если Firebase не инициализирован
import { Firestore as db } from '../config/firebase';

// Type assertion for db
const firestoreDb = db as any;
import { COLLECTIONS, UserProfile, Analysis, User } from '../types/database';

class DatabaseService {
  // ===== ПОЛЬЗОВАТЕЛИ =====

  async createUser(userId: string, email: string): Promise<void> {
    if (!db) {
      console.error('Firestore db is not initialized');
      throw new Error('Firebase db not initialized');
    }

    const userDoc: Omit<User, 'id'> = {
      email,
      createdAt: new Date(),
    };

    console.log('Creating user document:', userId, email);
    await setDoc(doc(db, COLLECTIONS.USERS, userId), userDoc);
    console.log('User document created successfully');
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    if (!db) {
      console.error('Firestore db is not initialized');
      throw new Error('Firebase db not initialized');
    }

    console.log('Updating user last login:', userId);
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    });
    console.log('User last login updated successfully');
  }

  async getUser(userId: string): Promise<User | null> {
    if (!db) {
      console.error('Firestore db is not initialized');
      throw new Error('Firebase db not initialized');
    }

    console.log('Getting user:', userId);
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        lastLoginAt: docSnap.data().lastLoginAt?.toDate(),
      } as User;
    }
    return null;
  }

  // ===== ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ =====

  async createUserProfile(userId: string, profileData: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<string> {
    if (!db) {
      console.error('Firestore db is not initialized');
      throw new Error('Firebase db not initialized');
    }

    let profileDoc: any = {
      userId,
      email: profileData.email || '',
      name: profileData.name,
      birthDate: profileData.birthDate,
      gender: profileData.gender,
      race: profileData.race,
      height: profileData.height,
      weight: profileData.weight,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    // Remove undefined fields (Firestore rejects undefined)
    profileDoc = Object.fromEntries(Object.entries(profileDoc).filter(([_, v]) => v !== undefined));
    // Store profile under document id == userId for simpler security rules and direct access
    const docRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
    await setDoc(docRef, profileDoc);
    return userId;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!db) {
      console.error('Firestore db is not initialized');
      throw new Error('Firebase db not initialized');
    }

    console.log('Getting user profile:', userId);
    const docRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
      } as UserProfile;
    }
    return null;
  }

  async updateUserProfile(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    if (!db) {
      console.error('Firestore db is not initialized');
      throw new Error('Firebase db not initialized');
    }

    console.log('Updating user profile:', userId);
    const docRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      // Clean updates from undefined values
      const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
      cleanUpdates.updatedAt = serverTimestamp();
      await updateDoc(docRef, cleanUpdates);
    } else {
      // Если профиль не существует, создаем его под id = userId
      await this.createUserProfile(userId, updates);
    }
  }

  // ===== АНАЛИЗЫ =====

  async saveAnalysis(userId: string, analysisData: Omit<Analysis, 'id' | 'userId' | 'createdAt'>): Promise<string> {
    if (!db) {
      console.error('Firestore db is not initialized');
      throw new Error('Firebase db not initialized');
    }

    const analysisDoc: Omit<Analysis, 'id'> = {
      userId,
      ...analysisData,
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.ANALYSES), analysisDoc);
    return docRef.id;
  }

  async getUserAnalyses(userId: string): Promise<Analysis[]> {
    if (!db) {
      console.error('Firestore db is not initialized');
      throw new Error('Firebase db not initialized');
    }

    console.log('Getting user analyses:', userId);
    const q = query(
      collection(db, COLLECTIONS.ANALYSES),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Analysis[];
  }

  async getAnalysisById(analysisId: string): Promise<Analysis | null> {
    const docRef = doc(db, COLLECTIONS.ANALYSES, analysisId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      } as Analysis;
    }
    return null;
  }

  // ===== СТАТИСТИКА =====

  async getUserStats(userId: string): Promise<{
    totalAnalyses: number;
    averageBMI: number;
    averageEGFR: number;
    lastAnalysisDate?: Date;
  }> {
    const analyses = await this.getUserAnalyses(userId);

    if (analyses.length === 0) {
      return {
        totalAnalyses: 0,
        averageBMI: 0,
        averageEGFR: 0,
      };
    }

    const totalBMI = analyses.reduce((sum, analysis) => sum + analysis.bmi, 0);
    const totalEGFR = analyses.reduce((sum, analysis) => sum + analysis.result.eGFR, 0);

    return {
      totalAnalyses: analyses.length,
      averageBMI: totalBMI / analyses.length,
      averageEGFR: totalEGFR / analyses.length,
      lastAnalysisDate: analyses[0].createdAt,
    };
  }
}

export const databaseService = new DatabaseService();