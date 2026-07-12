const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { errorHandler, notFoundHandler } = require('./middlewares/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const assetRoutes = require('./routes/assetRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const transferRoutes = require('./routes/transferRoutes');

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/allocations', allocationRoutes);
app.use('/api/v1/transfers', transferRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
