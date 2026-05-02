const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Simple test route
app.get('/', (req, res) => {
  res.send('<h1>AfriClaw - Admin Dashboard Coming</h1><p><a href="/admin">Click here to view Admin Dashboard</a></p>');
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'AfriClaw' });
});

// 404
app.use((req, res) => {
  res.status(404).send('404 - Not Found');
});

app.listen(PORT, () => {
  console.log(`[Test Server] Running on port ${PORT}`);
});
