// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ============ DIRECTORIES SETUP ============
const uploadsDir = path.join(__dirname, 'uploads');
const dbDir = path.join(__dirname, 'db');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Serve uploads
app.use('/uploads', express.static(uploadsDir));

// ============ FILE UPLOAD SETUP ============
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  },
});

// ============ DATABASE (JSON FILES) ============
const eventsFile = path.join(dbDir, 'events.json');
const newsFile = path.join(dbDir, 'news.json');
const membersFile = path.join(dbDir, 'members.json');
const pastMembersFile = path.join(dbDir, 'past-members.json');
const pagesFile = path.join(dbDir, 'pages.json');

const readJSON = (file) => {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e);
  }
  return null;
};

const writeJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
};

// ============ AUTH MIDDLEWARE ============
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-token-123';

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.substring(7);
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  next();
};

// ============ INITIALIZE DB ============
function initDB() {
  if (!fs.existsSync(eventsFile)) {
    writeJSON(eventsFile, [
      {
        id: '1',
        title: 'Welcome Event',
        date: '2025-01-15',
        coverUrl: 'https://picsum.photos/800/400',
        summary: 'Join us for our first event!',
        content: '<p>Welcome to TU/e Photonics Society!</p>',
        published: true,
        latest: true,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  if (!fs.existsSync(newsFile)) {
    writeJSON(newsFile, [
      {
        id: '1',
        title: 'First News Article',
        date: new Date().toISOString(),
        coverUrl: 'https://picsum.photos/800/400',
        summary: 'Our first news post',
        content: '<p>Stay tuned for more updates!</p>',
        published: true,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  if (!fs.existsSync(membersFile)) {
    writeJSON(membersFile, []);
  }

  if (!fs.existsSync(pastMembersFile)) {
    writeJSON(pastMembersFile, []);
  }

  if (!fs.existsSync(pagesFile)) {
    writeJSON(pagesFile, {
      home: {
        heroImage: '/hero.jpg',
        typedPhrases: [
          'Join us today and enjoy a free OPTICA subscription!',
          'Connect with the photonics community at TU/e.',
          'Workshops, talks, cleanroom tours, and more.',
        ],
      },
      about: {
        sections: [
          {
            id: '1',
            type: 'text-image',
            title: 'About Us',
            text: '<p>We are the Photonics Society at TU/e.</p>',
            image: 'https://picsum.photos/600/400',
          },
        ],
      },
      joinUs: {
        introText: '<p>Become a member today!</p>',
        formFields: [
          {
            id: '1',
            name: 'name',
            label: 'Full Name',
            type: 'text',
            required: true,
            placeholder: 'John Doe',
          },
          {
            id: '2',
            name: 'email',
            label: 'Email',
            type: 'email',
            required: true,
            placeholder: 'john@example.com',
          },
        ],
      },
    });
  }

  console.log('✅ Database initialized');
}

initDB();

// ============ API ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== EVENTS =====
app.get('/api/events', (req, res) => {
  const events = readJSON(eventsFile) || [];
  const published = events.filter((e) => e.published);
  res.json(published);
});

app.get('/api/events/admin', requireAuth, (req, res) => {
  const events = readJSON(eventsFile) || [];
  res.json(events);
});

app.get('/api/events/:id', (req, res) => {
  const events = readJSON(eventsFile) || [];
  const event = events.find((e) => String(e.id) === String(req.params.id));
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(event);
});

app.post('/api/events', requireAuth, (req, res) => {
  const events = readJSON(eventsFile) || [];
  const newEvent = {
    ...req.body,
    id: String(Date.now()),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  events.push(newEvent);
  writeJSON(eventsFile, events);
  res.json(newEvent);
});

app.put('/api/events/:id', requireAuth, (req, res) => {
  const events = readJSON(eventsFile) || [];
  const index = events.findIndex((e) => String(e.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }
  events[index] = {
    ...events[index],
    ...req.body,
    id: events[index].id,
    updatedAt: new Date().toISOString(),
  };
  writeJSON(eventsFile, events);
  res.json(events[index]);
});

app.delete('/api/events/:id', requireAuth, (req, res) => {
  let events = readJSON(eventsFile) || [];
  events = events.filter((e) => String(e.id) !== String(req.params.id));
  writeJSON(eventsFile, events);
  res.json({ success: true });
});

// ===== NEWS =====
app.get('/api/news', (req, res) => {
  const news = readJSON(newsFile) || [];
  const published = news.filter((n) => n.published);
  res.json(published);
});

app.get('/api/news/admin', requireAuth, (req, res) => {
  const news = readJSON(newsFile) || [];
  res.json(news);
});

app.get('/api/news/:id', (req, res) => {
  const news = readJSON(newsFile) || [];
  const item = news.find((n) => String(n.id) === String(req.params.id));
  if (!item) {
    return res.status(404).json({ error: 'News not found' });
  }
  res.json(item);
});

app.post('/api/news', requireAuth, (req, res) => {
  const news = readJSON(newsFile) || [];
  const newItem = {
    ...req.body,
    id: String(Date.now()),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  news.push(newItem);
  writeJSON(newsFile, news);
  res.json(newItem);
});

app.put('/api/news/:id', requireAuth, (req, res) => {
  const news = readJSON(newsFile) || [];
  const index = news.findIndex((n) => String(n.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'News not found' });
  }
  news[index] = {
    ...news[index],
    ...req.body,
    id: news[index].id,
    updatedAt: new Date().toISOString(),
  };
  writeJSON(newsFile, news);
  res.json(news[index]);
});

app.delete('/api/news/:id', requireAuth, (req, res) => {
  let news = readJSON(newsFile) || [];
  news = news.filter((n) => String(n.id) !== String(req.params.id));
  writeJSON(newsFile, news);
  res.json({ success: true });
});

// ===== MEMBERS =====
app.get('/api/members', (req, res) => {
  const members = readJSON(membersFile) || [];
  res.json(members);
});

app.get('/api/members/admin', requireAuth, (req, res) => {
  const members = readJSON(membersFile) || [];
  res.json(members);
});

app.get('/api/members/past', (req, res) => {
  const pastMembers = readJSON(pastMembersFile) || [];
  res.json(pastMembers);
});

app.get('/api/members/past/admin', requireAuth, (req, res) => {
  const pastMembers = readJSON(pastMembersFile) || [];
  res.json(pastMembers);
});

app.post('/api/members', requireAuth, (req, res) => {
  const members = readJSON(membersFile) || [];
  const newMember = {
    ...req.body,
    id: String(Date.now()),
    order: members.length,
    createdAt: new Date().toISOString(),
  };
  members.push(newMember);
  writeJSON(membersFile, members);
  res.json(newMember);
});

app.put('/api/members/:id', requireAuth, (req, res) => {
  const members = readJSON(membersFile) || [];
  const index = members.findIndex((m) => String(m.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Member not found' });
  }
  members[index] = {
    ...members[index],
    ...req.body,
    id: members[index].id,
    updatedAt: new Date().toISOString(),
  };
  writeJSON(membersFile, members);
  res.json(members[index]);
});

app.delete('/api/members/:id', requireAuth, (req, res) => {
  let members = readJSON(membersFile) || [];
  members = members.filter((m) => String(m.id) !== String(req.params.id));
  writeJSON(membersFile, members);
  res.json({ success: true });
});

app.post('/api/members/reorder', requireAuth, (req, res) => {
  const { ids } = req.body;
  const members = readJSON(membersFile) || [];
  const reordered = ids
    .map((id, index) => {
      const member = members.find((m) => String(m.id) === String(id));
      if (member) {
        return { ...member, order: index };
      }
      return null;
    })
    .filter(Boolean);
  writeJSON(membersFile, reordered);
  res.json(reordered);
});

app.post('/api/members/:id/move-to-past', requireAuth, (req, res) => {
  const members = readJSON(membersFile) || [];
  const pastMembers = readJSON(pastMembersFile) || [];
  
  const index = members.findIndex((m) => String(m.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Member not found' });
  }
  
  const [member] = members.splice(index, 1);
  pastMembers.push(member);
  
  writeJSON(membersFile, members);
  writeJSON(pastMembersFile, pastMembers);
  
  res.json({ success: true });
});

app.post('/api/past-members/:id/restore', requireAuth, (req, res) => {
  const members = readJSON(membersFile) || [];
  const pastMembers = readJSON(pastMembersFile) || [];
  
  const index = pastMembers.findIndex((m) => String(m.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Past member not found' });
  }
  
  const [member] = pastMembers.splice(index, 1);
  member.order = members.length;
  members.push(member);
  
  writeJSON(membersFile, members);
  writeJSON(pastMembersFile, pastMembers);
  
  res.json({ success: true });
});

app.delete('/api/past-members/:id', requireAuth, (req, res) => {
  let pastMembers = readJSON(pastMembersFile) || [];
  pastMembers = pastMembers.filter((m) => String(m.id) !== String(req.params.id));
  writeJSON(pastMembersFile, pastMembers);
  res.json({ success: true });
});

// ===== PAGES =====
app.get('/api/pages/:page', (req, res) => {
  const pages = readJSON(pagesFile) || {};
  const page = pages[req.params.page];
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }
  res.json(page);
});

app.put('/api/pages/:page', requireAuth, (req, res) => {
  const pages = readJSON(pagesFile) || {};
  pages[req.params.page] = req.body;
  writeJSON(pagesFile, pages);
  res.json(req.body);
});

// ===== UPLOAD =====
app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

// ===== CONTACT FORM =====
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  console.log('Contact form submission:', { name, email, message });
  // Here you could send email, save to DB, etc.
  res.json({ success: true, message: 'Message received' });
});

// ===== JOIN FORM =====
app.post('/api/join', (req, res) => {
  console.log('Join form submission:', req.body);
  // Here you could send email, save to DB, etc.
  res.json({ success: true, message: 'Application received' });
});

// ============ SERVE FRONTEND ============
const distPath = path.join(__dirname, '../dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // All other routes return index.html (for React Router)
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  
  console.log('📦 Serving frontend from:', distPath);
} else {
  console.warn('⚠️  dist folder not found. Build frontend first: npm run build');
  app.get('*', (req, res) => {
    res.status(404).send('Frontend not built. Run: npm run build');
  });
}

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🗄️  Database directory: ${dbDir}`);
  console.log(`🔑 Admin token: ${ADMIN_TOKEN}`);
  console.log(`\n🌐 Open: http://localhost:${PORT}`);
  console.log(`🔧 Admin: http://localhost:${PORT}/admin`);
});