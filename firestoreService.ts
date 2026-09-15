import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  Firestore
} from 'firebase/firestore';
import type { Category, Poet, Poetry, Banner } from '../src/types.js';

let firestoreInstance: Firestore | null = null;

export function getFirestoreDb(): Firestore {
  if (firestoreInstance) return firestoreInstance;

  const configPath = path.resolve('firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('firebase-applet-config.json not found');
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const app = getApps().length === 0 ? initializeApp({
    apiKey: config.apiKey,
    projectId: config.projectId,
    appId: config.appId,
    authDomain: config.authDomain
  }) : getApp();

  firestoreInstance = getFirestore(app, config.firestoreDatabaseId);
  return firestoreInstance;
}

// Fetch all categories from Firestore
export async function getCategoriesFromFirestore(): Promise<Category[]> {
  try {
    const db = getFirestoreDb();
    const snap = await getDocs(collection(db, 'categories'));
    const list: Category[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Category);
    });
    return list.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (err) {
    console.error('Error fetching categories from Firestore:', err);
    return [];
  }
}

// Fetch all poets from Firestore
export async function getPoetsFromFirestore(): Promise<Poet[]> {
  try {
    const db = getFirestoreDb();
    const snap = await getDocs(collection(db, 'poets'));
    const list: Poet[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Poet);
    });
    return list.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (err) {
    console.error('Error fetching poets from Firestore:', err);
    return [];
  }
}

// Fetch all poetry from Firestore
export async function getPoetryFromFirestore(): Promise<Poetry[]> {
  try {
    const db = getFirestoreDb();
    const snap = await getDocs(collection(db, 'poetry'));
    const list: Poetry[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Poetry);
    });
    return list;
  } catch (err) {
    console.error('Error fetching poetry from Firestore:', err);
    return [];
  }
}

// Fetch all banners from Firestore
export async function getBannersFromFirestore(): Promise<Banner[]> {
  try {
    const db = getFirestoreDb();
    const snap = await getDocs(collection(db, 'banners'));
    const list: Banner[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Banner);
    });
    return list.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (err) {
    console.error('Error fetching banners from Firestore:', err);
    return [];
  }
}

// Save single document to Firestore
export async function saveDocumentToFirestore(collectionName: string, id: string, data: any): Promise<void> {
  try {
    const db = getFirestoreDb();
    await setDoc(doc(db, collectionName, id), data, { merge: true });
  } catch (err) {
    console.error(`Error saving ${collectionName}/${id} to Firestore:`, err);
  }
}

// Delete single document from Firestore
export async function deleteDocumentFromFirestore(collectionName: string, id: string): Promise<void> {
  try {
    const db = getFirestoreDb();
    await deleteDoc(doc(db, collectionName, id));
  } catch (err) {
    console.error(`Error deleting ${collectionName}/${id} from Firestore:`, err);
  }
}

// Increment like counter in Firestore
export async function incrementLikesInFirestore(poetryId: string): Promise<void> {
  try {
    const db = getFirestoreDb();
    await updateDoc(doc(db, 'poetry', poetryId), {
      likesCount: increment(1)
    });
  } catch (err) {
    console.error(`Error incrementing likes for poetry/${poetryId} in Firestore:`, err);
  }
}
