import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  setDoc,
  updateDoc,
  db,
} from './firebase.js';
import type { Banner, Category, Poet, Poetry } from '../types.js';
import seedData from '../../data/poetry_db.json';

const seeded = seedData as {
  categories: Category[];
  poets: Poet[];
  poetry: Poetry[];
  banners: Banner[];
};

function withId<T extends { id?: string }>(id: string, data: T): T & { id: string } {
  return { ...data, id: data.id || id };
}

export async function ensureDatabaseSeeded(): Promise<void> {
  const refs = [
    ['categories', seeded.categories],
    ['poets', seeded.poets],
    ['poetry', seeded.poetry],
    ['banners', seeded.banners],
  ] as const;

  for (const [name, items] of refs) {
    const snap = await getDocs(collection(db, name));
    const existing = new Set(snap.docs.map((d) => d.id));
    const missing = items.filter((item) => item.id && !existing.has(item.id));
    for (const item of missing) {
      await setDoc(doc(db, name, item.id), item);
    }
  }
}

export async function getCategories(): Promise<Category[]> {
  const snap = await getDocs(collection(db, 'categories'));
  return snap.docs
    .map((d) => withId(d.id, d.data() as Category))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function getPoets(): Promise<Poet[]> {
  const [poetSnap, poetrySnap] = await Promise.all([
    getDocs(collection(db, 'poets')),
    getDocs(collection(db, 'poetry')),
  ]);
  const poetry = poetrySnap.docs.map((d) => withId(d.id, d.data() as Poetry));
  const published = poetry.filter((p) => p.status === 'published');

  return poetSnap.docs
    .map((d) => withId(d.id, d.data() as Poet))
    .map((poet) => {
      const poems = published.filter(
        (p) => p.poetId === poet.id || p.poetNameUrdu === poet.nameUrdu
      );
      return {
        ...poet,
        totalPoems: poems.length,
        totalLikes: poems.reduce((sum, p) => sum + (p.likesCount || 0), 0),
        sampleVerse: poems[0]?.versesUrdu?.[0] || '',
      };
    })
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (b.totalPoems || 0) - (a.totalPoems || 0);
    });
}

export async function getPoetry(status: 'all' | 'published' | 'draft' = 'published'): Promise<Poetry[]> {
  const snap = await getDocs(collection(db, 'poetry'));
  let items = snap.docs.map((d) => withId(d.id, d.data() as Poetry));
  if (status !== 'all') items = items.filter((p) => p.status === status);
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getActiveBanner(): Promise<Banner | null> {
  const snap = await getDocs(collection(db, 'banners'));
  const banners = snap.docs
    .map((d) => withId(d.id, d.data() as Banner))
    .filter((b) => b.isActive)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  return banners[0] || null;
}

export async function getBanners(): Promise<Banner[]> {
  const snap = await getDocs(collection(db, 'banners'));
  return snap.docs
    .map((d) => withId(d.id, d.data() as Banner))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function saveDocument(collectionName: string, id: string, data: unknown): Promise<void> {
  await setDoc(doc(db, collectionName, id), data as Record<string, unknown>, { merge: true });
}

export async function removeDocument(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}

export async function likePoetry(id: string): Promise<number> {
  const ref = doc(db, 'poetry', id);
  await updateDoc(ref, { likesCount: increment(1) });
  const snap = await getDocs(collection(db, 'poetry'));
  const item = snap.docs.find((d) => d.id === id);
  return Number((item?.data() as Poetry | undefined)?.likesCount || 0);
}
