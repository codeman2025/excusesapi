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
app.use(express.urlencoded({ extended: true })); // for form submits
app.use(cookieParser());

const cors = require('cors');
app.use(cors());

const SECRET = process.env.JWT_SECRET;
const ADMIN_USER = {
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD,
};

const excusesFile = path.join(__dirname, 'excuses.json');

// Load excuses from file or create default
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

// Middleware to verify JWT token from cookie
function authenticateJWT(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.redirect('/login');
    req.user = user;
    next();
  });
}

// Routes...
app.get('/admin.html', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');
  jwt.verify(token, SECRET, (err) => {
    if (err) return res.redirect('/login');
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
      const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
      res.cookie('token', token, { httpOnly: true });
      return res.redirect('/admin');
    } else {
      return res.status(401).send('Invalid credentials');
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Internal Server Error');
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
  if (!excuse || excuse.trim() === '') return res.status(400).json({ error: 'Excuse text required' });

  const newExcuse = {
    id: excuses.length ? excuses[excuses.length - 1].id + 1 : 1,
    excuse: excuse.trim(),
  };
  excuses.push(newExcuse);
  fs.writeFileSync(excusesFile, JSON.stringify(excuses, null, 2));
  res.status(201).json(newExcuse);
});

app.delete('/api/excuses/:id', authenticateJWT, (req, res) => {
  const id = parseInt(req.params.id);
  const index = excuses.findIndex((e) => e.id === id);
  if (index === -1) return res.status(404).json({ error: 'Excuse not found' });

  const deleted = excuses.splice(index, 1);
  fs.writeFileSync(excusesFile, JSON.stringify(excuses, null, 2));
  res.json({ message: 'Deleted successfully', deleted });
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server up and running on http://localhost:${PORT}`);
});
