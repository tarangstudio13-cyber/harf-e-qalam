import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, terminate } from 'firebase/firestore';

async function migrate() {
  console.log('--- Starting Migration from poetry_db.json to Firebase Firestore ---');
  
  const configPath = path.resolve('firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('firebase-applet-config.json not found');
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const app = initializeApp({
    apiKey: config.apiKey,
    projectId: config.projectId,
    appId: config.appId
  });

  const db = getFirestore(app, config.firestoreDatabaseId);

  const dbJsonPath = path.resolve('data/poetry_db.json');
  if (!fs.existsSync(dbJsonPath)) {
    throw new Error('data/poetry_db.json not found');
  }
  const localData = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));

  const categories = localData.categories || [];
  const poets = localData.poets || [];
  const poetry = localData.poetry || [];
  const banners = localData.banners || [];

  console.log(`Found: ${categories.length} categories, ${poets.length} poets, ${poetry.length} poetry items, ${banners.length} banners.`);

  // 1. Migrate Categories
  console.log('Migrating Categories...');
  for (const cat of categories) {
    if (!cat.id) continue;
    await setDoc(doc(db, 'categories', cat.id), cat, { merge: true });
  }
  console.log(`✓ Successfully migrated ${categories.length} categories to Firestore.`);

  // 2. Migrate Poets
  console.log('Migrating Poets...');
  for (const poet of poets) {
    if (!poet.id) continue;
    await setDoc(doc(db, 'poets', poet.id), poet, { merge: true });
  }
  console.log(`✓ Successfully migrated ${poets.length} poets to Firestore.`);

  // 3. Migrate Poetry
  console.log('Migrating Poetry items...');
  let count = 0;
  for (const item of poetry) {
    if (!item.id) continue;
    await setDoc(doc(db, 'poetry', item.id), item, { merge: true });
    count++;
  }
  console.log(`✓ Successfully migrated ${count} poetry items to Firestore.`);

  // 4. Migrate Banners
  console.log('Migrating Banners...');
  for (const banner of banners) {
    if (!banner.id) continue;
    await setDoc(doc(db, 'banners', banner.id), banner, { merge: true });
  }
  console.log(`✓ Successfully migrated ${banners.length} banners to Firestore.`);

  // Verify Counts in Firestore
  const catSnap = await getDocs(collection(db, 'categories'));
  const poetSnap = await getDocs(collection(db, 'poets'));
  const poetrySnap = await getDocs(collection(db, 'poetry'));
  const bannerSnap = await getDocs(collection(db, 'banners'));

  console.log('--- Migration Verification ---');
  console.log(`Firestore Categories Count: ${catSnap.size}`);
  console.log(`Firestore Poets Count: ${poetSnap.size}`);
  console.log(`Firestore Poetry Count: ${poetrySnap.size}`);
  console.log(`Firestore Banners Count: ${bannerSnap.size}`);

  await terminate(db);
  console.log('Migration to Firestore completed successfully!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
