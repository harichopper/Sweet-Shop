const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const sweetSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

module.exports = mongoose.model('Sweet', sweetSchema);