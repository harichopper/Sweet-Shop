require('dotenv').config(); // Load environment variables at the top
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const User = require('./models/user');
const Sweet = require('./models/sweet');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// JWT setup
const SECRET_KEY = process.env.SECRET_KEY;

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    const user = await User.findOne({ username: payload.username });
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ---------------------- Auth Routes ----------------------
// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password, isAdmin } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Username already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      id: uuidv4(),
      username,
      password: hashedPassword,
      isAdmin: !!isAdmin
    });
    await user.save();
    res.status(201).json({ id: user.id, username: user.username, isAdmin: user.isAdmin });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Incorrect username or password' });
    }
    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '30m' });
    res.json({ access_token: token, token_type: 'bearer' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username, isAdmin: req.user.isAdmin });
});

// ---------------------- Sweet Routes ----------------------
// Create Sweet (Admin only)
app.post('/api/sweets', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });

  const { name, category, price, quantity } = req.body;
  try {
    const sweet = new Sweet({ id: uuidv4(), name, category, price, quantity });
    await sweet.save();
    res.status(201).json(sweet);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all sweets
app.get('/api/sweets', async (req, res) => {
  try {
    const sweets = await Sweet.find();
    res.json(sweets);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Search sweets
app.get('/api/sweets/search', async (req, res) => {
  const { name, category, minPrice, maxPrice } = req.query;
  const query = {};
  if (name) query.name = { $regex: name, $options: 'i' };
  if (category) query.category = category;
  if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
  if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };

  try {
    const sweets = await Sweet.find(query);
    res.json(sweets);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update sweet (Admin only)
app.put('/api/sweets/:id', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });

  const { name, category, price, quantity } = req.body;
  try {
    const sweet = await Sweet.findOneAndUpdate(
      { id: req.params.id },
      { name, category, price, quantity },
      { new: true }
    );
    if (!sweet) return res.status(404).json({ error: 'Sweet not found' });
    res.json(sweet);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete sweet (Admin only)
app.delete('/api/sweets/:id', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });

  try {
    const sweet = await Sweet.findOneAndDelete({ id: req.params.id });
    if (!sweet) return res.status(404).json({ error: 'Sweet not found' });
    res.json({ message: 'Sweet deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Purchase sweet
app.post('/api/sweets/:id/purchase', authenticateToken, async (req, res) => {
  try {
    const sweet = await Sweet.findOne({ id: req.params.id });
    if (!sweet) return res.status(404).json({ error: 'Sweet not found' });
    if (sweet.quantity <= 0) return res.status(400).json({ error: 'Sweet out of stock' });
    sweet.quantity -= 1;
    await sweet.save();
    res.json({ message: 'Purchase successful', quantity: sweet.quantity });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Restock sweet (Admin only)
app.post('/api/sweets/:id/restock', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });

  const { quantity } = req.body;
  if (!quantity || quantity <= 0) return res.status(400).json({ error: 'Quantity must be positive' });

  try {
    const sweet = await Sweet.findOne({ id: req.params.id });
    if (!sweet) return res.status(404).json({ error: 'Sweet not found' });
    sweet.quantity += quantity;
    await sweet.save();
    res.json({ message: 'Restock successful', quantity: sweet.quantity });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------- Start Server ----------------------
// src/index.js
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

