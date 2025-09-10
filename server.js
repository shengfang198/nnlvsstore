// ========================
// SERVER CONFIGURATION
// ========================
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;


// ========================
// MIDDLEWARE
// ========================
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use(cors({ origin: 'https://nnlvsstore.onrender.com', credentials: true }));
app.use(bodyParser.json());
app.use(session({ 
    secret: process.env.JWT_SECRET, 
    resave: false, 
    saveUninitialized: true 
}));
app.use(passport.initialize());
app.use(passport.session());
// ========================
// IN-MEMORY STORAGE
// ========================
const users = {}; // { email: { name, email, password, cart: [] } }

const products = [
  { id: 'shirt01', name: 'Astro Shirt', images: ['white.png', 'red.png', 'blue.png'], price: 500 },
  { id: 'shirt02', name: 'Tokyo', images: ['white.png'], price: 450 },
  { id: 'shirt03', name: 'Cool Shirt', images: ['white.png'], price: 400 },
  // Add more products here...
];

// ========================
// AUTHENTICATION MIDDLEWARE
// ========================
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ========================
// ROUTES
// ========================

// ----- Google OAuth Login -----

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://nnlvs.onrender.com/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    users[profile.emails[0].value] = { password: null, email: profile.emails[0].value };
    return done(null, profile);
  }
));

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('https://nnlvs.onrender.com/myecommerce.html'); 
  }
);


// ----- Signup -----
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Fill all fields' });

  if (users[email]) return res.status(400).json({ error: 'Email already exists' });

  try {
    const hashed = await bcrypt.hash(password, 10);
    users[email] = { name: email.split('@')[0], email, password: hashed, cart: [] };
    res.status(201).json({ message: 'Account created', user: { email, name: users[email].name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----- Login -----
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Fill all fields' });

  const user = users[email];
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  if (!user.password) return res.status(400).json({ error: 'Use Google login' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ email, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// ----- Products -----
app.get('/products', (req, res) => {
  res.json(products);
});

// ----- Cart Operations -----
// Get Cart
app.get('/cart', authMiddleware, (req, res) => {
  const user = users[req.user.email];
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user.cart || []);
});

// Add to Cart
app.post('/cart', authMiddleware, (req, res) => {
  const { product_id, size, quantity } = req.body;
  if (!product_id || !size || !quantity) return res.status(400).json({ error: 'Missing fields' });

  const user = users[req.user.email];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const existing = user.cart.find(c => c.product_id === product_id && c.size === size);
  if (existing) {
    existing.quantity += quantity;
  } else {
    user.cart.push({ product_id, size, quantity });
  }

  res.json({ message: 'Added to cart' });
});

// Remove from Cart
app.delete('/cart', authMiddleware, (req, res) => {
  const { product_id, size } = req.body;
  if (!product_id || !size) return res.status(400).json({ error: 'Missing fields' });

  const user = users[req.user.email];
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.cart = user.cart.filter(c => !(c.product_id === product_id && c.size === size));
  res.json({ message: 'Removed from cart' });
});


// Serve everything in public folder
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// ========================
// START SERVER
// ========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

