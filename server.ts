import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { loadDatabase, saveDatabase, syncDatabaseFromFirestore, INITIAL_CATEGORIES, INITIAL_POETS, INITIAL_POETRY, INITIAL_BANNERS } from './server/db.js';
import { deleteDocumentFromFirestore } from './server/firestoreService.js';
import type { Poetry, Poet, Banner } from './src/types.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Sync with Firebase Firestore on boot
  await syncDatabaseFromFirestore();

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Admin credentials and session tracking
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  const activeAdminTokens = new Set<string>();

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'Firestore' });
  });

  // --- ADMIN AUTH & STATS API ---

  // Admin Login (supports Firebase Auth ID Token & default admin credentials)
  app.post('/api/admin/login', (req, res) => {
    try {
      const { username, password, firebaseIdToken, email } = req.body;

      // Handle Firebase Authentication Login
      if (firebaseIdToken) {
        const token = `fb_adm_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        activeAdminTokens.add(token);
        return res.json({
          success: true,
          token,
          username: email || username || 'Firebase Admin',
          authProvider: 'firebase'
        });
      }

      if (!username || !password) {
        return res.status(400).json({ error: 'صارف نام اور پاس ورڈ درکار ہیں (Username and password required)' });
      }

      const isDefaultCreds = username.trim() === 'admin' && password === 'admin123';
      const isConfiguredCreds = username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD;

      if (isDefaultCreds || isConfiguredCreds) {
        const loggedInUser = isConfiguredCreds ? ADMIN_USERNAME : 'admin';
        const token = `adm_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        activeAdminTokens.add(token);
        return res.json({ success: true, token, username: loggedInUser });
      } else {
        return res.status(401).json({ error: 'غلط صارف نام یا پاس ورڈ (Invalid username or password)' });
      }
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server error during login' });
    }
  });

  // Admin Logout
  app.post('/api/admin/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.body?.token;
    if (token) {
      activeAdminTokens.delete(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // Admin Verify Session
  app.get('/api/admin/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || (req.query?.token as string);
    const isValid = Boolean(token && activeAdminTokens.has(token));
    res.json({ authenticated: isValid });
  });

  // Admin Dashboard Statistics
  app.get('/api/admin/stats', (req, res) => {
    try {
      const db = loadDatabase();
      const poets = db.poets || [];
      const poetry = db.poetry || [];

      const totalPoets = poets.length;
      const totalPoetry = poetry.length;
      const totalGhazals = poetry.filter(p => p.poetryType === 'ghazal').length;
      const totalAshar = poetry.filter(p => p.poetryType === 'ashar').length;
      const totalKalam = poetry.filter(p => p.poetryType === 'kalam' || (p.poetryType !== 'ghazal' && p.poetryType !== 'ashar')).length;
      const totalPublished = poetry.filter(p => p.status === 'published').length;
      const totalDrafts = poetry.filter(p => p.status === 'draft').length;
      const totalLikes = poetry.reduce((sum, p) => sum + (p.likesCount || 0), 0);

      res.json({
        totalPoets,
        totalPoetry,
        totalGhazals,
        totalAshar,
        totalKalam,
        totalPublished,
        totalDrafts,
        totalLikes,
        totalCategories: (db.categories || []).length
      });
    } catch (err) {
      console.error('Stats error:', err);
      res.status(500).json({ error: 'Failed to compute stats' });
    }
  });

// Helper normalization functions for bilingual search
function normalizeUrdu(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u064B-\u065F\u0670\u0610-\u061A\u0640\u0653\u0654\u0655]/g, '')
    .replace(/[آأإ]/g, 'ا')
    .replace(/[ىيے]/g, 'ی')
    .replace(/[ةۂۃ]/g, 'ہ')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ی')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeEnglish(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/['’`\-_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SERVER_ROMAN_ALIASES: Record<string, string> = {
  ahmed: 'ahmad',
  meer: 'mir',
  jon: 'jaun',
  john: 'jaun',
  eliya: 'elia',
  ilya: 'elia',
  parvin: 'parveen',
  perveen: 'parveen',
  saagar: 'saghar',
  saghir: 'saghar',
  muneer: 'munir',
  saahir: 'sahir',
  wasim: 'waseem',
  amir: 'ameer',
  ubaidullah: 'obaidullah',
  khawaja: 'khwaja',
  daagh: 'dagh',
  katil: 'qateel',
  faize: 'faiz',
  allama: 'iqbal',
};

function matchPoetServer(poet: any, rawQuery: string): boolean {
  if (!rawQuery || !rawQuery.trim()) return true;
  const q = rawQuery.trim();

  // 1. Urdu match
  const qUrdu = normalizeUrdu(q);
  const pUrdu = normalizeUrdu(poet.nameUrdu || '');
  if (pUrdu.includes(qUrdu)) return true;
  if (poet.titleOrEra && normalizeUrdu(poet.titleOrEra).includes(qUrdu)) return true;

  // 2. English match
  const qEn = normalizeEnglish(q);
  const pEn = normalizeEnglish(poet.nameEnglish || '');
  if (pEn.includes(qEn)) return true;

  // 3. Alias match
  const words = qEn.split(' ').filter(Boolean);
  const replaced = words.map(w => SERVER_ROMAN_ALIASES[w] || w).join(' ');
  if (pEn.includes(replaced)) return true;

  // 4. Token match
  const pEnTokens = pEn.split(' ').filter(Boolean);
  if (
    words.length > 0 &&
    words.every(w => {
      const canonical = SERVER_ROMAN_ALIASES[w] || w;
      return pEnTokens.some(t => t === canonical || t.startsWith(canonical) || t.includes(canonical));
    })
  ) {
    return true;
  }

  return false;
}

  // --- POETS API (Database-driven poet profiles) ---

  // Get all poets with live poem counts and sample verses
  app.get('/api/poets', (req, res) => {
    try {
      const { search } = req.query;
      const db = loadDatabase();
      const poets = db.poets || [];
      const publishedPoems = db.poetry.filter(p => p.status === 'published');

      // Enrich poets with dynamic counts and sample verses
      let enriched = poets.map(poet => {
        const poetPoems = publishedPoems.filter(
          p => p.poetId === poet.id || p.poetNameUrdu === poet.nameUrdu
        );
        const sampleVerse = poetPoems[0]?.versesUrdu?.[0] || '';
        const totalLikes = poetPoems.reduce((sum, p) => sum + (p.likesCount || 0), 0);

        return {
          ...poet,
          totalPoems: poetPoems.length,
          totalLikes,
          sampleVerse
        };
      });

      // Filter by search query if provided (bilingual matching)
      if (search && typeof search === 'string') {
        enriched = enriched.filter(p => matchPoetServer(p, search));
      }

      // Sort: featured first, then by total poems descending
      enriched.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.totalPoems || 0) - (a.totalPoems || 0);
      });

      res.json(enriched);
    } catch (err) {
      console.error('Error fetching poets:', err);
      res.status(500).json({ error: 'Failed to fetch poets' });
    }
  });

  // Get single poet by ID
  app.get('/api/poets/:id', (req, res) => {
    try {
      const { id } = req.params;
      const db = loadDatabase();
      const poet = (db.poets || []).find(p => p.id === id);
      if (!poet) {
        return res.status(404).json({ error: 'Poet not found' });
      }

      const publishedPoems = db.poetry.filter(
        p => (p.poetId === poet.id || p.poetNameUrdu === poet.nameUrdu) && p.status === 'published'
      );

      res.json({
        ...poet,
        totalPoems: publishedPoems.length,
        totalLikes: publishedPoems.reduce((sum, p) => sum + (p.likesCount || 0), 0)
      });
    } catch (err) {
      console.error('Error fetching poet:', err);
      res.status(500).json({ error: 'Failed to fetch poet' });
    }
  });

  // Add new poet
  app.post('/api/poets', (req, res) => {
    try {
      const { nameUrdu, nameEnglish, titleOrEra, featured } = req.body;
      if (!nameUrdu || !nameUrdu.trim()) {
        return res.status(400).json({ error: 'Urdu poet name is required' });
      }

      const db = loadDatabase();
      if (!db.poets) db.poets = [];

      // Check if already exists
      const existing = db.poets.find(
        p => p.nameUrdu.trim() === nameUrdu.trim()
      );
      if (existing) {
        return res.status(409).json({ error: 'Poet already exists', poet: existing });
      }

      const newPoet: Poet = {
        id: `poet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        nameUrdu: nameUrdu.trim(),
        nameEnglish: (nameEnglish || '').trim(),
        titleOrEra: (titleOrEra || '').trim(),
        featured: Boolean(featured),
        createdAt: new Date().toISOString()
      };

      db.poets.push(newPoet);
      saveDatabase(db);
      res.status(201).json(newPoet);
    } catch (err) {
      console.error('Error adding poet:', err);
      res.status(500).json({ error: 'Failed to create poet' });
    }
  });

  // Update poet
  app.put('/api/poets/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { nameUrdu, nameEnglish, titleOrEra, featured } = req.body;
      const db = loadDatabase();
      const index = (db.poets || []).findIndex(p => p.id === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Poet not found' });
      }

      const oldNameUrdu = db.poets[index].nameUrdu;

      if (nameUrdu !== undefined) db.poets[index].nameUrdu = nameUrdu.trim();
      if (nameEnglish !== undefined) db.poets[index].nameEnglish = nameEnglish.trim();
      if (titleOrEra !== undefined) db.poets[index].titleOrEra = titleOrEra.trim();
      if (featured !== undefined) db.poets[index].featured = Boolean(featured);

      // Cascade name change to poetry
      if (nameUrdu && nameUrdu.trim() !== oldNameUrdu) {
        db.poetry.forEach(p => {
          if (p.poetId === id || p.poetNameUrdu === oldNameUrdu) {
            p.poetNameUrdu = nameUrdu.trim();
            if (nameEnglish) p.poetNameEnglish = nameEnglish.trim();
          }
        });
      }

      saveDatabase(db);
      res.json(db.poets[index]);
    } catch (err) {
      console.error('Error updating poet:', err);
      res.status(500).json({ error: 'Failed to update poet' });
    }
  });

  // Delete poet
  app.delete('/api/poets/:id', (req, res) => {
    try {
      const { id } = req.params;
      const db = loadDatabase();
      const count = (db.poets || []).length;
      db.poets = (db.poets || []).filter(p => p.id !== id);

      if (db.poets.length === count) {
        return res.status(404).json({ error: 'Poet not found' });
      }

      saveDatabase(db);
      deleteDocumentFromFirestore('poets', id);
      res.json({ success: true, deletedId: id });
    } catch (err) {
      console.error('Error deleting poet:', err);
      res.status(500).json({ error: 'Failed to delete poet' });
    }
  });

  // --- CATEGORIES API ---

  // Get all categories sorted by order
  app.get('/api/categories', (req, res) => {
    try {
      const db = loadDatabase();
      const sorted = [...db.categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      res.json(sorted);
    } catch (err) {
      console.error('Error fetching categories:', err);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Add new category
  app.post('/api/categories', (req, res) => {
    try {
      const { nameUrdu, nameEnglish, description } = req.body;
      if (!nameUrdu || !nameUrdu.trim()) {
        return res.status(400).json({ error: 'Urdu category name is required' });
      }

      const db = loadDatabase();
      const maxOrder = db.categories.reduce((max, c) => Math.max(max, c.order || 0), 0);
      const newCategory = {
        id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        nameUrdu: nameUrdu.trim(),
        nameEnglish: (nameEnglish || '').trim(),
        description: (description || '').trim(),
        order: maxOrder + 1,
        createdAt: new Date().toISOString()
      };

      db.categories.push(newCategory);
      saveDatabase(db);
      res.status(201).json(newCategory);
    } catch (err) {
      console.error('Error creating category:', err);
      res.status(500).json({ error: 'Failed to create category' });
    }
  });

  // Update category
  app.put('/api/categories/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { nameUrdu, nameEnglish, description, order } = req.body;
      const db = loadDatabase();
      const index = db.categories.findIndex(c => c.id === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Category not found' });
      }

      if (nameUrdu !== undefined) db.categories[index].nameUrdu = nameUrdu.trim();
      if (nameEnglish !== undefined) db.categories[index].nameEnglish = nameEnglish.trim();
      if (description !== undefined) db.categories[index].description = description.trim();
      if (order !== undefined) db.categories[index].order = Number(order);

      saveDatabase(db);
      res.json(db.categories[index]);
    } catch (err) {
      console.error('Error updating category:', err);
      res.status(500).json({ error: 'Failed to update category' });
    }
  });

  // Reorder categories
  app.put('/api/categories/reorder/all', (req, res) => {
    try {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'orderedIds array is required' });
      }

      const db = loadDatabase();
      orderedIds.forEach((id: string, index: number) => {
        const cat = db.categories.find(c => c.id === id);
        if (cat) {
          cat.order = index + 1;
        }
      });

      saveDatabase(db);
      const sorted = [...db.categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      res.json(sorted);
    } catch (err) {
      console.error('Error reordering categories:', err);
      res.status(500).json({ error: 'Failed to reorder categories' });
    }
  });

  // Delete category
  app.delete('/api/categories/:id', (req, res) => {
    try {
      const { id } = req.params;
      const db = loadDatabase();
      const initialCount = db.categories.length;
      db.categories = db.categories.filter(c => c.id !== id);

      if (db.categories.length === initialCount) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Re-assign orphaned poetry to default or first category if needed
      const fallbackCat = db.categories[0]?.id || 'general';
      db.poetry.forEach(p => {
        if (p.categoryId === id) {
          p.categoryId = fallbackCat;
        }
      });

      saveDatabase(db);
      deleteDocumentFromFirestore('categories', id);
      res.json({ success: true, deletedId: id });
    } catch (err) {
      console.error('Error deleting category:', err);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  // --- POETRY API ---

  // Get poetry with filters
  app.get('/api/poetry', (req, res) => {
    try {
      const { category, search, status, poetId, poetName, type } = req.query;
      const db = loadDatabase();

      let items = [...db.poetry];

      // Filter by status (default: only published for public users, 'all' for admin)
      if (status && status !== 'all') {
        items = items.filter(p => p.status === status);
      } else if (!status) {
        // default public view shows published
        items = items.filter(p => p.status === 'published');
      }

      // Filter by poet ID or poet Name
      if (poetId && typeof poetId === 'string' && poetId !== 'all') {
        items = items.filter(p => p.poetId === poetId);
      } else if (poetName && typeof poetName === 'string') {
        const pName = poetName.trim().toLowerCase();
        items = items.filter(p => 
          p.poetNameUrdu?.toLowerCase() === pName || 
          p.poetNameEnglish?.toLowerCase() === pName
        );
      }

      // Filter by type (ashar, ghazal, kalam, nazm)
      if (type && typeof type === 'string' && type !== 'all') {
        if (type === 'ashar') {
          items = items.filter(p => p.poetryType === 'ashar' || (!p.poetryType && p.versesUrdu.length <= 2));
        } else if (type === 'ghazal') {
          items = items.filter(p => p.poetryType === 'ghazal' || (!p.poetryType && p.versesUrdu.length > 2));
        } else if (type === 'kalam') {
          items = items.filter(p => p.poetryType === 'kalam');
        } else if (type === 'nazm') {
          items = items.filter(p => p.poetryType === 'nazm');
        }
      }

      // Filter by category
      if (category && category !== 'all') {
        items = items.filter(p => p.categoryId === category);
      }

      // Filter by search query (poet name, verse text, english name)
      if (search && typeof search === 'string') {
        const query = search.trim().toLowerCase();
        items = items.filter(p => {
          const inPoetUrdu = p.poetNameUrdu?.toLowerCase().includes(query);
          const inPoetEn = p.poetNameEnglish?.toLowerCase().includes(query);
          const inVerses = p.versesUrdu?.some(v => v.toLowerCase().includes(query));
          return inPoetUrdu || inPoetEn || inVerses;
        });
      }

      // Sort newest or featured first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(items);
    } catch (err) {
      console.error('Error fetching poetry:', err);
      res.status(500).json({ error: 'Failed to fetch poetry' });
    }
  });

  // Add poetry
  app.post('/api/poetry', (req, res) => {
    try {
      const { poetId, poetNameUrdu, poetNameEnglish, categoryId, versesUrdu, status, featured, poetryType } = req.body;

      if (!poetNameUrdu || !poetNameUrdu.trim()) {
        return res.status(400).json({ error: 'Poet name in Urdu is required' });
      }

      const verses = Array.isArray(versesUrdu)
        ? versesUrdu.map((v: string) => v.trim()).filter((v: string) => v.length > 0)
        : typeof versesUrdu === 'string'
          ? versesUrdu.split('\n').map((v: string) => v.trim()).filter((v: string) => v.length > 0)
          : [];

      if (verses.length === 0) {
        return res.status(400).json({ error: 'At least one verse line is required' });
      }

      const db = loadDatabase();
      if (!db.poets) db.poets = [];

      // Link to existing poet or create new poet in database
      let targetPoetId = poetId;
      if (!targetPoetId) {
        const matchingPoet = db.poets.find(
          p => p.nameUrdu.trim() === poetNameUrdu.trim() ||
               (poetNameEnglish && p.nameEnglish.toLowerCase() === poetNameEnglish.trim().toLowerCase())
        );
        if (matchingPoet) {
          targetPoetId = matchingPoet.id;
        } else {
          // Register poet in DB
          targetPoetId = `poet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          db.poets.push({
            id: targetPoetId,
            nameUrdu: poetNameUrdu.trim(),
            nameEnglish: (poetNameEnglish || '').trim(),
            createdAt: new Date().toISOString()
          });
        }
      }

      const resolvedType = poetryType || (verses.length > 2 ? 'ghazal' : 'ashar');

      const newPoem: Poetry = {
        id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        poetId: targetPoetId,
        poetNameUrdu: poetNameUrdu.trim(),
        poetNameEnglish: (poetNameEnglish || '').trim(),
        categoryId: categoryId || (db.categories[0]?.id || 'cat-ishq'),
        versesUrdu: verses,
        poetryType: resolvedType,
        status: status === 'draft' ? 'draft' : 'published',
        likesCount: 0,
        featured: Boolean(featured),
        createdAt: new Date().toISOString()
      };

      db.poetry.unshift(newPoem);
      saveDatabase(db);
      res.status(201).json(newPoem);
    } catch (err) {
      console.error('Error adding poetry:', err);
      res.status(500).json({ error: 'Failed to add poetry' });
    }
  });

  // Update poetry
  app.put('/api/poetry/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { poetId, poetNameUrdu, poetNameEnglish, categoryId, versesUrdu, status, featured, poetryType } = req.body;
      const db = loadDatabase();
      const index = db.poetry.findIndex(p => p.id === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Poetry not found' });
      }

      if (poetId !== undefined) db.poetry[index].poetId = poetId;
      if (poetNameUrdu !== undefined) db.poetry[index].poetNameUrdu = poetNameUrdu.trim();
      if (poetNameEnglish !== undefined) db.poetry[index].poetNameEnglish = poetNameEnglish.trim();
      if (categoryId !== undefined) db.poetry[index].categoryId = categoryId;
      if (poetryType !== undefined) db.poetry[index].poetryType = poetryType;
      if (versesUrdu !== undefined) {
        const v = Array.isArray(versesUrdu)
          ? versesUrdu.map((line: string) => line.trim()).filter((line: string) => line.length > 0)
          : typeof versesUrdu === 'string'
            ? versesUrdu.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0)
            : [];
        db.poetry[index].versesUrdu = v;
        if (!poetryType && !db.poetry[index].poetryType) {
          db.poetry[index].poetryType = v.length > 2 ? 'ghazal' : 'ashar';
        }
      }
      if (status !== undefined) {
        db.poetry[index].status = status === 'draft' ? 'draft' : 'published';
      }
      if (featured !== undefined) {
        db.poetry[index].featured = Boolean(featured);
      }

      db.poetry[index].updatedAt = new Date().toISOString();
      saveDatabase(db);
      res.json(db.poetry[index]);
    } catch (err) {
      console.error('Error updating poetry:', err);
      res.status(500).json({ error: 'Failed to update poetry' });
    }
  });

  // Toggle publish/draft status
  app.patch('/api/poetry/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const db = loadDatabase();
      const poem = db.poetry.find(p => p.id === id);

      if (!poem) {
        return res.status(404).json({ error: 'Poetry not found' });
      }

      poem.status = poem.status === 'published' ? 'draft' : 'published';
      poem.updatedAt = new Date().toISOString();
      saveDatabase(db);
      res.json(poem);
    } catch (err) {
      console.error('Error toggling poetry status:', err);
      res.status(500).json({ error: 'Failed to update status' });
    }
  });

  // Delete poetry
  app.delete('/api/poetry/:id', (req, res) => {
    try {
      const { id } = req.params;
      const db = loadDatabase();
      const count = db.poetry.length;
      db.poetry = db.poetry.filter(p => p.id !== id);

      if (db.poetry.length === count) {
        return res.status(404).json({ error: 'Poetry not found' });
      }

      saveDatabase(db);
      deleteDocumentFromFirestore('poetry', id);
      res.json({ success: true, deletedId: id });
    } catch (err) {
      console.error('Error deleting poetry:', err);
      res.status(500).json({ error: 'Failed to delete poetry' });
    }
  });

  // Like poetry
  app.post('/api/poetry/:id/like', (req, res) => {
    try {
      const { id } = req.params;
      const db = loadDatabase();
      const poem = db.poetry.find(p => p.id === id);

      if (!poem) {
        return res.status(404).json({ error: 'Poetry not found' });
      }

      poem.likesCount = (poem.likesCount || 0) + 1;
      saveDatabase(db);
      res.json({ likesCount: poem.likesCount });
    } catch (err) {
      console.error('Error liking poetry:', err);
      res.status(500).json({ error: 'Failed to like poetry' });
    }
  });

  // Reset to initial collection (convenience tool)
  app.post('/api/reset', (req, res) => {
    try {
      saveDatabase({
        categories: INITIAL_CATEGORIES,
        poets: INITIAL_POETS,
        poetry: INITIAL_POETRY,
        banners: INITIAL_BANNERS
      });
      res.json({ success: true, message: 'Database reset to default catalog' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to reset database' });
    }
  });

  // --- BANNERS API (Admin controlled Home Screen Banners) ---

  // Get all banners (for Admin Dashboard)
  app.get('/api/banners', (req, res) => {
    try {
      const db = loadDatabase();
      const banners = db.banners || [];
      // Sort by order or createdAt
      const sorted = [...banners].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return (a.order ?? 0) - (b.order ?? 0);
      });
      res.json(sorted);
    } catch (err) {
      console.error('Error fetching banners:', err);
      res.status(500).json({ error: 'Failed to fetch banners' });
    }
  });

  // Get active banners for Home Screen (if none active, returns empty list [])
  app.get('/api/banners/active', (req, res) => {
    try {
      const db = loadDatabase();
      const banners = db.banners || [];
      const active = banners.filter(b => b.isActive);
      res.json(active);
    } catch (err) {
      console.error('Error fetching active banners:', err);
      res.status(500).json({ error: 'Failed to fetch active banners' });
    }
  });

  // Add new banner
  app.post('/api/banners', (req, res) => {
    try {
      const { title, subtitle, imageUrl, linkUrl, isActive, order } = req.body;
      if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
        return res.status(400).json({ error: 'تصویر کا لنک یا فائل درکار ہے (Banner image is required)' });
      }

      const db = loadDatabase();
      db.banners = db.banners || [];

      const newBanner: Banner = {
        id: `banner-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: (title || '').trim(),
        subtitle: (subtitle || '').trim(),
        imageUrl: imageUrl.trim(),
        linkUrl: (linkUrl || '').trim(),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        order: order !== undefined ? Number(order) : db.banners.length + 1,
        createdAt: new Date().toISOString()
      };

      // If this new banner is active and admin wants only one active banner, we can either keep all or let multiple exist.
      // Prepend to banners list
      db.banners.unshift(newBanner);
      saveDatabase(db);
      res.status(201).json(newBanner);
    } catch (err) {
      console.error('Error creating banner:', err);
      res.status(500).json({ error: 'Failed to create banner' });
    }
  });

  // Update banner
  app.put('/api/banners/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { title, subtitle, imageUrl, linkUrl, isActive, order } = req.body;
      const db = loadDatabase();
      db.banners = db.banners || [];

      const index = db.banners.findIndex(b => b.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Banner not found' });
      }

      if (title !== undefined) db.banners[index].title = title.trim();
      if (subtitle !== undefined) db.banners[index].subtitle = subtitle.trim();
      if (imageUrl !== undefined && imageUrl.trim()) db.banners[index].imageUrl = imageUrl.trim();
      if (linkUrl !== undefined) db.banners[index].linkUrl = linkUrl.trim();
      if (isActive !== undefined) db.banners[index].isActive = Boolean(isActive);
      if (order !== undefined) db.banners[index].order = Number(order);
      db.banners[index].updatedAt = new Date().toISOString();

      saveDatabase(db);
      res.json(db.banners[index]);
    } catch (err) {
      console.error('Error updating banner:', err);
      res.status(500).json({ error: 'Failed to update banner' });
    }
  });

  // Toggle active status
  app.patch('/api/banners/:id/toggle', (req, res) => {
    try {
      const { id } = req.params;
      const db = loadDatabase();
      db.banners = db.banners || [];

      const banner = db.banners.find(b => b.id === id);
      if (!banner) {
        return res.status(404).json({ error: 'Banner not found' });
      }

      banner.isActive = !banner.isActive;
      banner.updatedAt = new Date().toISOString();
      saveDatabase(db);
      res.json(banner);
    } catch (err) {
      console.error('Error toggling banner status:', err);
      res.status(500).json({ error: 'Failed to toggle banner status' });
    }
  });

  // Delete banner
  app.delete('/api/banners/:id', (req, res) => {
    try {
      const { id } = req.params;
      const db = loadDatabase();
      db.banners = db.banners || [];

      const initialCount = db.banners.length;
      db.banners = db.banners.filter(b => b.id !== id);

      if (db.banners.length === initialCount) {
        return res.status(404).json({ error: 'Banner not found' });
      }

      saveDatabase(db);
      deleteDocumentFromFirestore('banners', id);
      res.json({ success: true, message: 'Banner deleted successfully' });
    } catch (err) {
      console.error('Error deleting banner:', err);
      res.status(500).json({ error: 'Failed to delete banner' });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Harf-e-Qalam server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
