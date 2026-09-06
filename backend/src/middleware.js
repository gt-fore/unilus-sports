/* ================================================================
   FILE: middleware.js
   PROJECT: UNILUS Sports Hub - Backend
   DESCRIPTION: Authentication and error handling middleware
   ================================================================ */

// ================================================================
// IMPORT DEPENDENCIES
// ================================================================

const { verifyToken } = require('./config');
const { User } = require('./models');

// ================================================================
// AUTHENTICATION MIDDLEWARE
// ================================================================

// Verify JWT token and attach user to request
async function authenticate(req, res, next) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        // Attach user to request
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// ================================================================
// STAFF ONLY MIDDLEWARE
// ================================================================

function staffOnly(req, res, next) {
    if (req.user.role !== 'staff') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Staff only.'
        });
    }
    next();
}

// ================================================================
// ERROR HANDLING MIDDLEWARE
// ================================================================

function errorHandler(err, req, res, next) {
    console.error('Error:', err.message);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
}

// ================================================================
// EXPORT
// ================================================================

module.exports = {
    authenticate,
    staffOnly,
    errorHandler
};