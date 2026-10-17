const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const apiRoutes = require('./routes');
const requestIdMiddleware = require('./middleware/requestId');
const { errorHandler, AppError } = require('./middleware/errorHandler');
const { ERROR_CODES } = require('../../shared/contracts/constants');

const app = express();

// Security and parsing middleware
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach x-request-id
app.use(requestIdMiddleware);

// Mount main API v1 router
app.use('/api/v1', apiRoutes);

// Handle unknown routes
app.use((req, res, next) => {
  next(new AppError(`Endpoint ${req.method} ${req.originalUrl} not found.`, 404, ERROR_CODES.NOT_FOUND));
});

// Global error handler
app.use(errorHandler);

module.exports = app;
