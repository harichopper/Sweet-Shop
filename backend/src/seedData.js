require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user');
const Sweet = require('./models/sweet');

const sweetData = [
  // Chocolates
  { name: 'Dark Chocolate Truffle', category: 'Chocolate', price: 3.99, quantity: 45 },
  { name: 'Milk Chocolate Hearts', category: 'Chocolate', price: 2.50, quantity: 60 },
  { name: 'White Chocolate Roses', category: 'Chocolate', price: 4.25, quantity: 30 },
  { name: 'Belgian Chocolate Pralines', category: 'Chocolate', price: 5.99, quantity: 25 },
  { name: 'Hazelnut Chocolate Bars', category: 'Chocolate', price: 3.75, quantity: 40 },
  
  // Gummies
  { name: 'Rainbow Gummy Bears', category: 'Gummy', price: 1.99, quantity: 80 },
  { name: 'Sour Gummy Worms', category: 'Gummy', price: 2.25, quantity: 70 },
  { name: 'Peach Gummy Rings', category: 'Gummy', price: 2.50, quantity: 55 },
  { name: 'Cola Gummy Bottles', category: 'Gummy', price: 2.75, quantity: 65 },
  { name: 'Tropical Fruit Gummies', category: 'Gummy', price: 3.00, quantity: 50 },
  
  // Hard Candy
  { name: 'Strawberry Lollipops', category: 'Hard Candy', price: 1.50, quantity: 90 },
  { name: 'Peppermint Candy Canes', category: 'Hard Candy', price: 0.99, quantity: 120 },
  { name: 'Butterscotch Drops', category: 'Hard Candy', price: 2.00, quantity: 75 },
  { name: 'Lemon Drops', category: 'Hard Candy', price: 1.75, quantity: 85 },
  { name: 'Cinnamon Hard Candy', category: 'Hard Candy', price: 2.25, quantity: 60 },
  
  // Caramels
  { name: 'Sea Salt Caramels', category: 'Caramel', price: 4.50, quantity: 35 },
  { name: 'Vanilla Caramel Squares', category: 'Caramel', price: 3.25, quantity: 50 },
  { name: 'Chocolate Covered Caramels', category: 'Caramel', price: 4.99, quantity: 28 },
  { name: 'Apple Caramel Chews', category: 'Caramel', price: 3.50, quantity: 42 },
  
  // Marshmallows
  { name: 'Vanilla Marshmallows', category: 'Marshmallow', price: 2.99, quantity: 65 },
  { name: 'Strawberry Marshmallow Hearts', category: 'Marshmallow', price: 3.25, quantity: 45 },
  { name: 'Coconut Marshmallow Cubes', category: 'Marshmallow', price: 3.75, quantity: 35 },
  
  // Fudge
  { name: 'Classic Chocolate Fudge', category: 'Fudge', price: 5.25, quantity: 20 },
  { name: 'Peanut Butter Fudge', category: 'Fudge', price: 5.50, quantity: 18 },
  { name: 'Maple Walnut Fudge', category: 'Fudge', price: 6.00, quantity: 15 },
  
  // Licorice
  { name: 'Red Strawberry Licorice', category: 'Licorice', price: 2.75, quantity: 55 },
  { name: 'Black Licorice Wheels', category: 'Licorice', price: 2.50, quantity: 40 },
  
  // Mints
  { name: 'Chocolate Mints', category: 'Mint', price: 3.99, quantity: 45 },
  { name: 'Peppermint Patties', category: 'Mint', price: 2.99, quantity: 60 },
  { name: 'Spearmint Leaves', category: 'Mint', price: 2.25, quantity: 70 },
  
  // Taffy
  { name: 'Salt Water Taffy Mix', category: 'Taffy', price: 4.25, quantity: 35 },
  { name: 'Banana Taffy', category: 'Taffy', price: 2.75, quantity: 50 },
  { name: 'Cherry Taffy', category: 'Taffy', price: 2.75, quantity: 48 },
  
  // Premium Items (Low stock)
  { name: 'Gold Leaf Chocolate', category: 'Premium', price: 15.99, quantity: 8 },
  { name: 'Truffle Collection Box', category: 'Premium', price: 24.99, quantity: 5 },
  { name: 'Artisan Honey Candy', category: 'Premium', price: 8.75, quantity: 12 },
  
  // Out of stock items
  { name: 'Limited Edition Rainbow Fudge', category: 'Fudge', price: 7.99, quantity: 0 },
  { name: 'Seasonal Pumpkin Spice Candy', category: 'Seasonal', price: 4.50, quantity: 0 }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🍭 Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Sweet.deleteMany({});
    console.log('🧹 Cleared existing data...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = new User({
      username: 'admin',
      password: adminPassword,
      isAdmin: true
    });
    await adminUser.save();
    console.log('👑 Created admin user (username: admin, password: admin123)');

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    const regularUser = new User({
      username: 'user',
      password: userPassword,
      isAdmin: false
    });
    await regularUser.save();
    console.log('👤 Created regular user (username: user, password: user123)');

    // Insert sweet data
    await Sweet.insertMany(sweetData);
    console.log(`🍬 Inserted ${sweetData.length} sweet varieties with stock!`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Sweet Statistics:');
    
    const categories = [...new Set(sweetData.map(s => s.category))];
    for (const category of categories) {
      const count = sweetData.filter(s => s.category === category).length;
      console.log(`   ${category}: ${count} varieties`);
    }
    
    const totalStock = sweetData.reduce((sum, sweet) => sum + sweet.quantity, 0);
    const totalValue = sweetData.reduce((sum, sweet) => sum + (sweet.price * sweet.quantity), 0);
    
    console.log(`\n💰 Total Stock: ${totalStock} items`);
    console.log(`💵 Total Inventory Value: $${totalValue.toFixed(2)}`);
    console.log(`📈 Average Price: $${(sweetData.reduce((sum, s) => sum + s.price, 0) / sweetData.length).toFixed(2)}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();

