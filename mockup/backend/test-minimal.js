const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

console.log('🚀 Starting minimal test server...');

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test server working' });
});

app.get('/', (req, res) => {
  res.send('Finding Sports - Test Server Running');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});