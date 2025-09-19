const app = require('./src/app');
const cors = require('cors');

const PORT = process.env.PORT || 8000;
app.get('/', (req, res) => {
  res.send('Sweet Shop Backend is running! Use /api/... for API endpoints.');
});

app.listen(PORT, () => {
  console.log(`🍭 Sweet Shop Server running on port ${PORT}`);
  console.log(`🌐 Server available at: http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at: http://localhost:${PORT}/api`);
});
app.use(cors({
  origin: 'https://sweet-shop-vyap.vercel.app', // frontend URL
  credentials: true, // if sending cookies
}));