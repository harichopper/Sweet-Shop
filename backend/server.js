const app = require('./src/app');

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🍭 Sweet Shop Server running on port ${PORT}`);
  console.log(`🌐 Server available at: http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at: http://localhost:${PORT}/api`);
});
