const express = require('express');
const router = express.Router();
const Sweet = require('../models/sweet');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Middleware to authenticate token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findOne({ username: decoded.username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Search sweets by name, category, or price range
router.get('/search', async (req, res) => {
  try {
    const { name, category, minPrice, maxPrice } = req.query;
    const query = {};
    
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    const sweets = await Sweet.find(query).sort({ name: 1 });
    res.json(sweets);
  } catch (err) {
    console.error('Error searching sweets:', err);
    res.status(500).json({ error: 'Server error while searching sweets' });
  }
});

// Get all sweets (public endpoint)
router.get('/', async (req, res) => {
  try {
    const sweets = await Sweet.find().sort({ name: 1 });
    res.json(sweets);
  } catch (err) {
    console.error('Error fetching sweets:', err);
    res.status(500).json({ error: 'Server error while fetching sweets' });
  }
});

// Create sweet (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, category, price, quantity } = req.body;
    
    const sweet = new Sweet({
      name,
      category,
      price: parseFloat(price),
      quantity: parseInt(quantity)
    });
    
    await sweet.save();
    res.status(201).json(sweet);
  } catch (err) {
    console.error('Error creating sweet:', err);
    res.status(500).json({ error: 'Server error while creating sweet' });
  }
});

// Purchase sweet
router.post('/:id/purchase', authenticateToken, async (req, res) => {
  try {
    const sweet = await Sweet.findById(req.params.id);
    
    if (!sweet) {
      return res.status(404).json({ error: 'Sweet not found' });
    }
    
    if (sweet.quantity <= 0) {
      return res.status(400).json({ error: 'Sweet out of stock' });
    }
    
    sweet.quantity -= 1;
    await sweet.save();
    
    res.json({ 
      message: 'Purchase successful', 
      sweet: sweet,
      quantity: sweet.quantity 
    });
  } catch (err) {
    console.error('Error purchasing sweet:', err);
    res.status(500).json({ error: 'Server error during purchase' });
  }
});

// Restock sweet (admin only)
router.post('/:id/restock', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { quantity } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Valid quantity required' });
    }

    const sweet = await Sweet.findById(req.params.id);
    
    if (!sweet) {
      return res.status(404).json({ error: 'Sweet not found' });
    }
    
    sweet.quantity += parseInt(quantity);
    await sweet.save();
    
    res.json({ 
      message: 'Restock successful', 
      sweet: sweet,
      quantity: sweet.quantity 
    });
  } catch (err) {
    console.error('Error restocking sweet:', err);
    res.status(500).json({ error: 'Server error during restock' });
  }
});

// Delete sweet (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const sweet = await Sweet.findByIdAndDelete(req.params.id);
    
    if (!sweet) {
      return res.status(404).json({ error: 'Sweet not found' });
    }
    
    res.json({ message: 'Sweet deleted successfully' });
  } catch (err) {
    console.error('Error deleting sweet:', err);
    res.status(500).json({ error: 'Server error during deletion' });
  }
});

module.exports = router;
