// Типы данных для Firestore коллекций

export interface UserProfile {
  id: string;
  userId: string; // Firebase Auth user ID
  email: string;
  name?: string;
  position?: string;
  contactPhone?: string;
  birthDate?: string;
  gender?: 'male' | 'female';
  race?: 'black' | 'other';
  height?: number; // в см
  weight?: number; // в кг
  createdAt: Date;
  updatedAt: Date;
}

export interface Analysis {
  id: string;
  userId: string; // Firebase Auth user ID
  name?: string;
  age: number;
  gender: 'male' | 'female';
  race: 'black' | 'other';
  height: number; // в см
  weight: number; // в кг
  bmi: number;
  creatinine: number;
  result: {
    eGFR: number;
    stage: string;
    risk: string;
  };
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

// Коллекции Firestore
export const COLLECTIONS = {
  USERS: 'users',
  USER_PROFILES: 'userProfiles',
  ANALYSES: 'analyses',
} as const;