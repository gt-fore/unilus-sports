/* ================================================================
   FILE: routes.js
   PROJECT: UNILUS Sports Hub - Backend
   DESCRIPTION: All API routes in one file
                INCLUDES: Auth, Facilities, Bookings, Staff, Notifications, Price Management, Add Facility
   ================================================================ */

// ================================================================
// IMPORT DEPENDENCIES
// ================================================================

const express = require('express');
const router = express.Router();

const { generateToken, hashPassword, comparePassword } = require('./config');
const { User, Facility, Booking, Notification, PriceSettings } = require('./models');
const { authenticate, staffOnly } = require('./middleware');

// ================================================================
// AUTH ROUTES
// ================================================================

// Register new student - SIMPLIFIED (Name + Student ID + Password)
router.post('/auth/register', async (req, res) => {
    try {
        const { name, studentId, password } = req.body;

        // Check if student already exists
        const existingUser = await User.findOne({ studentId });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Student ID already registered. Please login.'
            });
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Extract program from Student ID (first 3 letters)
        const program = studentId.substring(0, 3).toUpperCase();

        // Create new user with minimal fields
        const user = new User({
            studentId,
            name,
            email: `${studentId}@unilus.ac.zm`,
            password: hashedPassword,
            role: 'student',
            program: program,
            year: 2024,
            semester: 1,
            isActive: true
        });

        await user.save();

        // Generate JWT token
        const token = generateToken({
            id: user._id,
            email: user.email,
            role: user.role
        });

        res.status(201).json({
            success: true,
            message: '✅ Registration successful! Welcome to UNILUS Sports Hub!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                studentId: user.studentId,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Student Login
router.post('/auth/login', async (req, res) => {
    try {
        const { studentId, password } = req.body;

        // Find user by studentId
        const user = await User.findOne({ studentId });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Student ID or password'
            });
        }

        // Check password
        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Student ID or password'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken({
            id: user._id,
            email: user.email,
            role: user.role
        });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                studentId: user.studentId,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Staff Login
router.post('/auth/staff-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if staff
        if (user.role !== 'staff') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Staff only.'
            });
        }

        // Check password
        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken({
            id: user._id,
            email: user.email,
            role: user.role
        });

        res.json({
            success: true,
            message: 'Staff login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get current user
router.get('/auth/me', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                studentId: req.user.studentId,
                role: req.user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================
// FACILITY ROUTES
// ================================================================

// Get all facilities
router.get('/facilities', async (req, res) => {
    try {
        const facilities = await Facility.find({ isAvailable: true }).sort({ name: 1 });
        res.json({ success: true, facilities });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get facility by ID
router.get('/facilities/:id', async (req, res) => {
    try {
        const facility = await Facility.findById(req.params.id);
        if (!facility) {
            return res.status(404).json({ success: false, message: 'Facility not found' });
        }
        res.json({ success: true, facility });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================
// BOOKING ROUTES
// ================================================================

// Create booking
router.post('/bookings', authenticate, async (req, res) => {
    try {
        const { facilityId, bookingDate, timeSlot, duration, totalPrice } = req.body;

        const facility = await Facility.findById(facilityId);
        if (!facility) {
            return res.status(404).json({ success: false, message: 'Facility not found' });
        }

        // Calculate expiry date
        const expiryDate = new Date(bookingDate);
        if (duration === 'day') expiryDate.setDate(expiryDate.getDate() + 1);
        else if (duration === 'week') expiryDate.setDate(expiryDate.getDate() + 7);
        else if (duration === 'month') expiryDate.setMonth(expiryDate.getMonth() + 1);

        // Create booking
        const booking = new Booking({
            userId: req.user._id,
            facilityId,
            bookingDate,
            timeSlot,
            duration,
            totalPrice,
            expiresAt: expiryDate,
            status: 'confirmed'
        });

        await booking.save();

        res.status(201).json({
            success: true,
            message: 'Booking confirmed!',
            booking
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get my bookings
router.get('/bookings/my', authenticate, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user._id })
            .populate('facilityId', 'name imageUrl')
            .sort({ bookingDate: -1 });
        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Cancel booking
router.put('/bookings/:id/cancel', authenticate, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'staff') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        if (booking.isCheckedIn) {
            return res.status(400).json({ success: false, message: 'Already checked in, cannot cancel' });
        }

        booking.status = 'cancelled';
        await booking.save();

        res.json({ success: true, message: 'Booking cancelled', booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================
// NOTIFICATION ROUTES (Public)
// ================================================================

// Get notifications for login page
router.get('/notifications/login', async (req, res) => {
    try {
        const notifications = await Notification.find({
            isActive: true,
            showOnLogin: true,
            expiresAt: { $gt: new Date() }
        }).sort({ priority: -1, createdAt: -1 });
        res.json({ success: true, notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get notifications for dashboard
router.get('/notifications/dashboard', authenticate, async (req, res) => {
    try {
        const notifications = await Notification.find({
            isActive: true,
            showOnDashboard: true,
            expiresAt: { $gt: new Date() }
        }).sort({ priority: -1, createdAt: -1 });
        res.json({ success: true, notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================
// STAFF ROUTES
// ================================================================

// Staff dashboard - get today's stats
router.get('/staff/dashboard', authenticate, staffOnly, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const facilities = await Facility.find({ isAvailable: true });
        const stats = [];

        for (const facility of facilities) {
            const bookings = await Booking.find({
                facilityId: facility._id,
                bookingDate: { $gte: today, $lt: tomorrow },
                status: 'confirmed'
            });

            const checkedIn = bookings.filter(b => b.isCheckedIn).length;

            stats.push({
                facilityId: facility._id,
                name: facility.name,
                totalBookings: bookings.length,
                checkedInCount: checkedIn
            });
        }

        // Recent check-ins today
        const recentCheckIns = await Booking.find({
            isCheckedIn: true,
            checkInTime: { $gte: today, $lt: tomorrow }
        })
            .populate('userId', 'name studentId')
            .populate('facilityId', 'name')
            .populate('checkedInBy', 'name')
            .sort({ checkInTime: -1 });

        res.json({
            success: true,
            stats,
            recentCheckIns
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all bookings (staff)
router.get('/staff/bookings', authenticate, staffOnly, async (req, res) => {
    try {
        const { date, status, facility } = req.query;
        const filter = {};

        if (date) filter.bookingDate = new Date(date);
        if (status) filter.status = status;
        if (facility) filter.facilityId = facility;

        const bookings = await Booking.find(filter)
            .populate('userId', 'name studentId')
            .populate('facilityId', 'name')
            .sort({ bookingDate: -1 });

        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================
// NOTIFICATION MANAGEMENT (Staff Only)
// ================================================================

// Get all notifications (staff)
router.get('/staff/notifications', authenticate, staffOnly, async (req, res) => {
    try {
        const notifications = await Notification.find()
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create notification
router.post('/staff/notifications', authenticate, staffOnly, async (req, res) => {
    try {
        const { title, message, type, priority, showOnLogin, showOnDashboard, expiresAt } = req.body;

        const notification = new Notification({
            title,
            message,
            type,
            priority: priority || 'medium',
            showOnLogin: showOnLogin !== undefined ? showOnLogin : true,
            showOnDashboard: showOnDashboard !== undefined ? showOnDashboard : true,
            expiresAt,
            createdBy: req.user._id
        });

        await notification.save();
        res.status(201).json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update notification
router.put('/staff/notifications/:id', authenticate, staffOnly, async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete notification
router.delete('/staff/notifications/:id', authenticate, staffOnly, async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Toggle notification visibility
router.put('/staff/notifications/:id/toggle', authenticate, staffOnly, async (req, res) => {
    try {
        const { field } = req.query;
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        if (field === 'showOnLogin') {
            notification.showOnLogin = !notification.showOnLogin;
        } else if (field === 'showOnDashboard') {
            notification.showOnDashboard = !notification.showOnDashboard;
        }

        await notification.save();
        res.json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================
// PRICE MANAGEMENT (Staff Only)
// ================================================================

// Get facility prices
router.get('/staff/prices', authenticate, staffOnly, async (req, res) => {
    try {
        const prices = await PriceSettings.find().populate('facilityId', 'name');
        res.json({ success: true, prices });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update facility prices
router.put('/staff/prices/:facilityId', authenticate, staffOnly, async (req, res) => {
    try {
        const { dailyPrice, weeklyPrice, monthlyPrice } = req.body;

        const priceSetting = await PriceSettings.findOneAndUpdate(
            { facilityId: req.params.facilityId },
            {
                dailyPrice,
                weeklyPrice,
                monthlyPrice,
                updatedBy: req.user._id
            },
            { new: true, upsert: true }
        );

        // Update the facility itself too
        await Facility.findByIdAndUpdate(req.params.facilityId, {
            dailyPrice,
            weeklyPrice,
            monthlyPrice
        });

        res.json({ success: true, priceSetting });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================
// ADD FACILITY (Staff Only)
// ================================================================

// Add new facility (Staff only)
router.post('/staff/facilities', authenticate, staffOnly, async (req, res) => {
    try {
        const { name, description, dailyPrice, weeklyPrice, monthlyPrice, capacity, isAvailable } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({ success: false, message: 'Facility name is required' });
        }

        // Create new facility
        const facility = new Facility({
            name,
            description: description || '',
            dailyPrice: dailyPrice || 50,
            weeklyPrice: weeklyPrice || 120,
            monthlyPrice: monthlyPrice || 400,
            capacity: capacity || 30,
            isAvailable: isAvailable !== undefined ? isAvailable : true
        });

        await facility.save();

        // Also create price settings for this facility
        const priceSetting = new PriceSettings({
            facilityId: facility._id,
            dailyPrice: facility.dailyPrice,
            weeklyPrice: facility.weeklyPrice,
            monthlyPrice: facility.monthlyPrice,
            updatedBy: req.user._id
        });

        await priceSetting.save();

        res.status(201).json({
            success: true,
            message: 'Facility added successfully!',
            facility
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================
// QR ROUTES (REMOVED - Not needed)
// ================================================================

// ================================================================
// EXPORT
// ================================================================

module.exports = router;