/* ================================================================
   FILE: config.js
   PROJECT: UNILUS Sports Hub - Backend
   DESCRIPTION: Database connection + Authentication helpers
   ================================================================ */

// ================================================================
// IMPORT DEPENDENCIES
// ================================================================

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ================================================================
// DATABASE CONNECTION
// ================================================================

// Connect to MongoDB Atlas
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected successfully');
        return true;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        throw error;
    }
}

// ================================================================
// JWT AUTHENTICATION
// ================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate JWT token
function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

// ================================================================
// PASSWORD HASHING
// ================================================================

// Hash password
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

// Compare password with hash
async function comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
}

// ================================================================
// EXPORT ALL
// ================================================================

module.exports = {
    connectDB,
    generateToken,
    verifyToken,
    hashPassword,
    comparePassword,
    JWT_SECRET
};