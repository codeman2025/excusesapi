require('dotenv').config();
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fs = require('fs');

console.log('ENV:', {
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  JWT_SECRET: process.env.JWT_SECRET,
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const cors = require('cors');
app.use(cors());

const SECRET = process.env.JWT_SECRET;
const ADMIN_USER = {
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD,
};

const excusesFile = path.join(__dirname, 'excuses.json');
console.log('Excuses JSON file path:', excusesFile);

// Load excuses or create default
let excuses = [];
try {
  const data = fs.readFileSync(excusesFile, 'utf8');
  excuses = JSON.parse(data);
} catch (err) {
  console.log('excuses.json not found, creating default excuses...');
  excuses = [
    { id: 1, excuse: 'My Wi-Fi was down because my neighbor’s cat unplugged it.' },
    { id: 2, excuse: 'I couldn’t come to the meeting, I was busy fighting a goose.' },
    { id: 3, excuse: 'My alarm clock joined a protest and refused to go off.' },
    { id: 4, excuse: 'Traffic was bad because a llama parade blocked the road.' },
    { id: 5, excuse: 'I accidentally glued myself to my desk chair.' },
  ];
  fs.writeFileSync(excusesFile, JSON.stringify(excuses, null, 2));
}

// Middleware to verify JWT token from cookie and serve 401 error page if unauthorized
function authenticateJWT(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).sendFile(path.join(__dirname, 'public', '401.html'));

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(401).sendFile(path.join(__dirname, 'public', '401.html'));
    req.user = user;
    next();
  });
}

// Routes...
app.get('/admin.html', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).sendFile(path.join(__dirname, 'public', '401.html'));
  jwt.verify(token, SECRET, (err) => {
    if (err) return res.status(401).sendFile(path.join(__dirname, 'public', '401.html'));
    res.redirect('/admin');
  });
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', username, password);
    if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
      const token = jwt.sign({ username }, SECRET);
      res.cookie('token', token, { httpOnly: true });
      return res.redirect('/admin');
    } else {
      return res.status(401).sendFile(path.join(__dirname, 'public', '401.html'));
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).sendFile(path.join(__dirname, 'public', '500.html'));
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

app.get('/admin', authenticateJWT, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API routes
app.get('/api/excuses', (req, res) => {
  res.json(excuses);
});

app.get('/api/excuses/random', (req, res) => {
  const randomExcuse = excuses[Math.floor(Math.random() * excuses.length)];
  res.json(randomExcuse);
});

app.post('/api/excuses', authenticateJWT, (req, res) => {
  const { excuse } = req.body;
  if (!excuse || excuse.trim() === '') {
    return res.status(400).sendFile(path.join(__dirname, 'public', '400.html'));
  }

  const newExcuse = {
    id: excuses.length ? excuses[excuses.length - 1].id + 1 : 1,
    excuse: excuse.trim(),
  };
  excuses.push(newExcuse);

  try {
    fs.writeFileSync(excusesFile, JSON.stringify(excuses, null, 2));
    console.log('✅ Excuses saved to JSON file successfully!');
  } catch (error) {
    console.error('❌ Failed to save excuses:', error);
    return res.status(500).sendFile(path.join(__dirname, 'public', '500.html'));
  }

  res.status(201).json(newExcuse);
});

app.delete('/api/excuses/:id', authenticateJWT, (req, res) => {
  const id = parseInt(req.params.id);
  const index = excuses.findIndex((e) => e.id === id);
  if (index === -1) return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));

  const deleted = excuses.splice(index, 1);

  try {
    fs.writeFileSync(excusesFile, JSON.stringify(excuses, null, 2));
    console.log('✅ Excuses updated after deletion!');
  } catch (error) {
    console.error('❌ Failed to update excuses after deletion:', error);
    return res.status(500).sendFile(path.join(__dirname, 'public', '500.html'));
  }

  res.json({ message: 'Deleted successfully', deleted });
});

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Extra routes for error pages so you can test or link to them directly
app.get('/400', (req, res) => {
  res.status(400).sendFile(path.join(__dirname, 'public', '400.html'));
});

app.get('/401', (req, res) => {
  res.status(401).sendFile(path.join(__dirname, 'public', '401.html'));
});

app.get('/403', (req, res) => {
  res.status(403).sendFile(path.join(__dirname, 'public', '403.html'));
});

app.get('/404', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.get('/500', (req, res) => {
  res.status(500).sendFile(path.join(__dirname, 'public', '500.html'));
});

// 404 handler (catch-all)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// 500 error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('🔥 Server error:', err.stack);
  res.status(500).sendFile(path.join(__dirname, 'public', '500.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server up and running on http://localhost:${PORT}`);
});

