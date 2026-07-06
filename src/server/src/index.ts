import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import staffRoutes from './routes/staff.js';
import customerRoutes from './routes/customers.js';
import shipmentRoutes from './routes/shipments.js';
import categoryRoutes from './routes/categories.js';
import offerRoutes from './routes/offers.js';
import settingsRoutes from './routes/settings.js';
import notificationRoutes from './routes/notifications.js';
import auditRoutes from './routes/audit.js';
import receiptRoutes from './routes/receipts.js';
import configRoutes from './routes/config.js';

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
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/config', configRoutes);

app.listen(PORT, () => {
  console.log(`La Grande Marque API server running on port ${PORT}`);
});
