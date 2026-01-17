import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
  FieldValue,
  Firestore,
} from 'firebase/firestore';
// @ts-ignore - db может быть undefined если Firebase не инициализирован
import { Firestore as db } from '../config/firebase';

// @ts-ignore - Explicitly type the db variable
const dbTyped: Firestore | undefined = db as any;

// Type assertion for db
const firestoreDb: Firestore = dbTyped || ({} as Firestore);
import { COLLECTIONS, UserProfile, Analysis, User } from '../types/database';

class DatabaseService {
  // ===== ПОЛЬЗОВАТЕЛИ =====

  async createUser(userId: string, email: string): Promise<void> {
    if (!firestoreDb) {
      console.error('Firestore db is not initialized');
      throw new Error('Firebase db not initialized');
    }

    const userDoc: Omit<User, 'id'> = {
      email,
      createdAt: new Date(),
    };

    console.log('Creating user document:', userId, email);
    await setDoc(doc(firestoreDb, COLLECTIONS.USERS, userId), userDoc);
    console.log('User document created successfully');
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    if (!firestoreDb) {
      console.error('Firestore db is not initialized');
      throw new Error('Firebase db not initialized');
    }

    console.log('Updating user last login:', userId);
    const userRef = doc(firestoreDb, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    });
    console.log('User last login updated successfully');
  }

  async getUser(userId: string): Promise<User | null> {
    if (!firestoreDb) {
      console.error('Firestore db is not initialized');
      throw new Error('Firebase db not initialized');
    }

    console.log('Getting user:', userId);
    const docRef = doc(firestoreDb, COLLECTIONS.USERS, userId);
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
    if (!firestoreDb) {
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
    const docRef = doc(firestoreDb, COLLECTIONS.USER_PROFILES, userId);
    await setDoc(docRef, profileDoc);
    return userId;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!firestoreDb) {
      console.error('Firestore db is not initialized');
      throw new Error('Firebase db not initialized');
    }

    console.log('Getting user profile:', userId);
    const docRef = doc(firestoreDb, COLLECTIONS.USER_PROFILES, userId);
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
    if (!firestoreDb) {
      console.error('Firestore db is not initialized');
      throw new Error('Firebase db not initialized');
    }

    console.log('Updating user profile:', userId);
    const docRef = doc(firestoreDb, COLLECTIONS.USER_PROFILES, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      // Clean updates from undefined values
      const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined)) as Record<string, any>;
      cleanUpdates.updatedAt = serverTimestamp();
      await updateDoc(docRef, cleanUpdates as Record<string, any>);
    } else {
      // Если профиль не существует, создаем его под id = userId
      await this.createUserProfile(userId, updates);
    }
  }

  // ===== АНАЛИЗЫ =====

  async saveAnalysis(userId: string, analysisData: Omit<Analysis, 'id' | 'userId' | 'createdAt'>): Promise<string> {
    if (!firestoreDb) {
      console.error('Firestore db is not initialized');
      throw new Error('Firebase db not initialized');
    }

    const analysisDoc: Omit<Analysis, 'id'> = {
      userId,
      ...analysisData,
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(firestoreDb, COLLECTIONS.ANALYSES), analysisDoc);
    return docRef.id;
  }

  async getUserAnalyses(userId: string): Promise<Analysis[]> {
    if (!firestoreDb) {
      console.error('Firestore db is not initialized');
      throw new Error('Firebase db not initialized');
    }

    console.log('Getting user analyses:', userId);
    // Query only by equality to avoid requiring a composite index in Firestore.
    const q = query(
      collection(firestoreDb, COLLECTIONS.ANALYSES),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const analyses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any),
      createdAt: (doc.data() as any).createdAt?.toDate() || new Date(),
    })) as Analysis[];

    // Sort client-side by createdAt desc to preserve previous ordering behavior.
    analyses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return analyses;
  }

  async getAnalysisById(analysisId: string): Promise<Analysis | null> {
    const docRef = doc(firestoreDb, COLLECTIONS.ANALYSES, analysisId);
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

  async deleteAnalysis(analysisId: string): Promise<void> {
    if (!firestoreDb) {
      console.error('Firestore db is not initialized');
      throw new Error('Firebase db not initialized');
    }

    try {
      await deleteDoc(doc(firestoreDb, COLLECTIONS.ANALYSES, analysisId));
      console.log('Analysis deleted:', analysisId);
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      throw error;
    }
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