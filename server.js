// ========================
// SERVER CONFIGURATION
// ========================
require('dotenv').config();
const express = require('express');
// const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');

const app = express();


// ========================
// MIDDLEWARE
// ========================
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ========================
// DATABASE CONNECTION
// ========================
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASS,
//   port: process.env.DB_PORT,
// });

// ========================
// AUTHENTICATION MIDDLEWARE
// ========================
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ========================
// ROUTES
// ========================

// ===== Google Client =====
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post('/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const email = payload.email;

        if (!users[email]) users[email] = { name: payload.name, password: null, cart: [] };

        const jwtToken = jwt.sign({ email, name: payload.name }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token: jwtToken, user: { email, name: payload.name } });
    } catch (err) {
        console.error(err);
        res.status(401).json({ error: 'Invalid Google token' });
    }
});

// ----- Signup -----
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Fill all fields' });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashed]
    );
    res.status(201).json({ message: 'Account created', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// ----- Login -----
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Fill all fields' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ----- Products -----
app.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ----- Cart Operations -----

// Get Cart
app.get('/cart', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.product_id, c.size, c.quantity, p.name, p.images, p.price
       FROM carts c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id=$1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add to Cart
app.post('/cart', authMiddleware, async (req, res) => {
  const { product_id, size, quantity } = req.body;
  if (!product_id || !size || !quantity) return res.status(400).json({ error: 'Missing fields' });

  try {
    const existing = await pool.query(
      'SELECT * FROM carts WHERE user_id=$1 AND product_id=$2 AND size=$3',
      [req.user.id, product_id, size]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE carts SET quantity = quantity + $1 WHERE user_id=$2 AND product_id=$3 AND size=$4',
        [quantity, req.user.id, product_id, size]
      );
    } else {
      await pool.query(
        'INSERT INTO carts (user_id, product_id, size, quantity) VALUES ($1, $2, $3, $4)',
        [req.user.id, product_id, size, quantity]
      );
    }

    res.json({ message: 'Added to cart' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove from Cart
app.delete('/cart', authMiddleware, async (req, res) => {
  const { product_id, size } = req.body;
  if (!product_id || !size) return res.status(400).json({ error: 'Missing fields' });

  try {
    await pool.query(
      'DELETE FROM carts WHERE user_id=$1 AND product_id=$2 AND size=$3',
      [req.user.id, product_id, size]
    );
    res.json({ message: 'Removed from cart' });
  } catch (err) {
    console.error(err); // <-- add this
    res.status(500).json({ error: 'Server error' });
  }
});


// ========================
// START SERVER
// ========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
