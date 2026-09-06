/* ================================================================
   FILE: server.js
   PROJECT: UNILUS Sports Hub - Backend
   DESCRIPTION: Main entry point - starts the server
   ================================================================ */

// ================================================================
// LOAD ENVIRONMENT VARIABLES
// ================================================================

require('dotenv').config();

// ================================================================
// IMPORT DEPENDENCIES
// ================================================================

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config');
const routes = require('./routes');
const { errorHandler } = require('./middleware');

// ================================================================
// CREATE EXPRESS APP
// ================================================================

const app = express();
const PORT = process.env.PORT || 5000;

// ================================================================
// MIDDLEWARE
// ================================================================

// CORS - allow frontend to access API
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ================================================================
// ROUTES
// ================================================================

// Welcome route
app.get('/', (req, res) => {
    res.json({
        message: '🏟️ UNILUS Sports Hub API',
        version: '1.0.0',
        status: 'online',
        endpoints: {
            auth: '/api/auth',
            facilities: '/api/facilities',
            bookings: '/api/bookings',
            notifications: '/api/notifications',
            staff: '/api/staff',
            qr: '/api/qr'
        }
    });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use(errorHandler);

// ================================================================
// START SERVER
// ================================================================

async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📂 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();