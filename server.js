require('dotenv').config();
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

console.log('ENV:', {
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  JWT_SECRET: process.env.JWT_SECRET,
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for form submits
app.use(cookieParser());

const SECRET = process.env.JWT_SECRET;

const ADMIN_USER = {
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD
};

// Middleware to verify JWT token from cookie
function authenticateJWT(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      return res.redirect('/login');
    }
    req.user = user;
    next();
  });
}

// Redirect /admin.html to /admin (locked down)
app.get('/admin.html', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  jwt.verify(token, SECRET, (err) => {
    if (err) return res.redirect('/login');
    res.redirect('/admin');
  });
});

// Serve login page
app.get('/login', (req, res) => {
  const style = req.query.style || 'default';
  res.sendFile(path.join(__dirname, 'public', `login.html`));
});

// Handle login POST, issue JWT token cookie with try-catch + logs
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

// Logout clears cookie and redirects to login
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// Serve admin page (locked down with JWT)
app.get('/admin', authenticateJWT, (req, res) => {
  const style = req.query.style || 'default';
  res.sendFile(path.join(__dirname, 'public', `admin-${style}.html`));
});

// Excuses array (example data)
let excuses = [
  { id: 1, excuse: 'My Wi-Fi was down because my neighbor’s cat unplugged it.' },
  { id: 2, excuse: 'I couldn’t come to the meeting, I was busy fighting a goose.' },
  { id: 3, excuse: 'My alarm clock joined a protest and refused to go off.' },
  { id: 4, excuse: 'Traffic was bad because a llama parade blocked the road.' },
  { id: 5, excuse: 'I accidentally glued myself to my desk chair.' }
];

// Public API routes (no auth required to read)
app.get('/api/excuses', (req, res) => {
  res.json(excuses);
});

app.get('/api/excuses/random', (req, res) => {
  const randomExcuse = excuses[Math.floor(Math.random() * excuses.length)];
  res.json(randomExcuse);
});

// Auth required to add a new excuse
app.post('/api/excuses', authenticateJWT, (req, res) => {
  const { excuse } = req.body;
  if (!excuse || excuse.trim() === '') return res.status(400).json({ error: 'Excuse text required' });

  const newExcuse = {
    id: excuses.length ? excuses[excuses.length - 1].id + 1 : 1,
    excuse: excuse.trim()
  };
  excuses.push(newExcuse);
  res.status(201).json(newExcuse);
});

// Auth required to delete an excuse
app.delete('/api/excuses/:id', authenticateJWT, (req, res) => {
  const id = parseInt(req.params.id);
  const index = excuses.findIndex(e => e.id === id);
  if (index === -1) return res.status(404).json({ error: 'Excuse not found' });

  const deleted = excuses.splice(index, 1);
  res.json({ message: 'Deleted successfully', deleted });
});

// Serve static files (css/js/html)
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server up and running on http://localhost:${PORT}`);
});
