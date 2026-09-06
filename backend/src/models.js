/* ================================================================
   FILE: models.js
   PROJECT: UNILUS Sports Hub - Backend
   DESCRIPTION: All MongoDB database models in one file
   ================================================================ */

// ================================================================
// IMPORT DEPENDENCIES
// ================================================================

const mongoose = require('mongoose');

// ================================================================
// USER SCHEMA
// ================================================================

const UserSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'staff'],
        default: 'student'
    },
    program: {
        type: String,
        trim: true
    },
    year: {
        type: Number
    },
    semester: {
        type: Number
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

// ================================================================
// FACILITY SCHEMA
// ================================================================

const FacilitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String,
        default: ''
    },
    dailyPrice: {
        type: Number,
        required: true,
        default: 50
    },
    weeklyPrice: {
        type: Number,
        required: true,
        default: 120
    },
    monthlyPrice: {
        type: Number,
        required: true,
        default: 400
    },
    capacity: {
        type: Number,
        default: 30
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// ================================================================
// BOOKING SCHEMA
// ================================================================

const BookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    facilityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Facility',
        required: true
    },
    bookingDate: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        enum: ['day', 'week', 'month'],
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    isCheckedIn: {
        type: Boolean,
        default: false
    },
    checkInTime: {
        type: Date
    },
    checkedInBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    expiresAt: {
        type: Date
    },
    qrCode: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// ================================================================
// NOTIFICATION SCHEMA
// ================================================================

const NotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['emergency', 'price_update', 'general'],
        required: true
    },
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
    },
    showOnLogin: {
        type: Boolean,
        default: true
    },
    showOnDashboard: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// ================================================================
// PRICE SETTINGS SCHEMA
// ================================================================

const PriceSettingsSchema = new mongoose.Schema({
    facilityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Facility',
        required: true
    },
    dailyPrice: {
        type: Number,
        required: true
    },
    weeklyPrice: {
        type: Number,
        required: true
    },
    monthlyPrice: {
        type: Number,
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// ================================================================
// CREATE MODELS
// ================================================================

const User = mongoose.model('User', UserSchema);
const Facility = mongoose.model('Facility', FacilitySchema);
const Booking = mongoose.model('Booking', BookingSchema);
const Notification = mongoose.model('Notification', NotificationSchema);
const PriceSettings = mongoose.model('PriceSettings', PriceSettingsSchema);

// ================================================================
// EXPORT ALL
// ================================================================

module.exports = {
    User,
    Facility,
    Booking,
    Notification,
    PriceSettings
};