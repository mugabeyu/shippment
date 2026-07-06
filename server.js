import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import staffRoutes from './server/src/routes/staff.js';
import customerRoutes from './server/src/routes/customers.js';
import shipmentRoutes from './server/src/routes/shipments.js';
import categoryRoutes from './server/src/routes/categories.js';
import offerRoutes from './server/src/routes/offers.js';
import settingsRoutes from './server/src/routes/settings.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/staff', staffRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/settings', settingsRoutes);

// Serve static built frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'dist' });
  });
}

app.listen(PORT, () => {
  console.log(`La Grande Marque running on port ${PORT}`);
});
