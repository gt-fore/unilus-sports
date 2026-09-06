import React, { useState, useEffect, useRef } from 'react';
import { authAPI, facilityAPI, bookingAPI, notificationAPI, staffAPI } from './api';
const API_BASE =window.location.hostname==='localhost'
? 'https://localhost:5000'
: 'https://unilus-sports.onrender.com/';

function App() {
    // ============================================================
    // STATE
    // ============================================================

    const [user, setUser] = useState(null);
    const [page, setPage] = useState('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const [facilities, setFacilities] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [staffStats, setStaffStats] = useState([]);
    const [allNotifs, setAllNotifs] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('08:00-10:00');
    const [bookingDuration, setBookingDuration] = useState('day');

    const [loginData, setLoginData] = useState({ studentId: '', password: '' });
    const [registerData, setRegisterData] = useState({ name: '', studentId: '', password: '', confirmPassword: '' });
    const [staffLoginData, setStaffLoginData] = useState({ email: '', password: '' });

    const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'general', priority: 'medium', showOnLogin: true, showOnDashboard: true, expiresAt: '' });
    const [editingNotifId, setEditingNotifId] = useState(null);
    const [editingPriceId, setEditingPriceId] = useState(null);
    const [priceForm, setPriceForm] = useState({ dailyPrice: '', weeklyPrice: '', monthlyPrice: '' });
    const [facilityForm, setFacilityForm] = useState({ name: '', description: '', dailyPrice: 50, weeklyPrice: 120, monthlyPrice: 400, capacity: 30, isAvailable: true });

    const dataLoadedRef = useRef(false);

    // ============================================================
    // EFFECTS
    // ============================================================

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser && !dataLoadedRef.current) {
            try {
                const u = JSON.parse(savedUser);
                setUser(u);
                setPage(u.role === 'staff' ? 'staff-dashboard' : 'dashboard');
                dataLoadedRef.current = true;
                if (u.role === 'staff') {
                    loadStaffData();
                } else {
                    loadStudentData();
                }
            } catch (e) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }

        loadNotifications();

        let timer;
        const resetTimer = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                if (user) {
                    handleLogout();
                    alert('Session expired. Please login again.');
                }
            }, 30 * 60 * 1000);
        };

        if (user) {
            resetTimer();
            ['click', 'keypress', 'scroll', 'mousemove'].forEach(ev => {
                document.addEventListener(ev, resetTimer);
            });
        }

        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            clearTimeout(timer);
            ['click', 'keypress', 'scroll', 'mousemove'].forEach(ev => {
                document.removeEventListener(ev, resetTimer);
            });
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // ============================================================
    // DATA LOADING
    // ============================================================

    async function loadNotifications() {
        try {
            const res = await notificationAPI.getForLogin();
            setNotifications(res.notifications || []);
        } catch (e) {
            console.error('Error loading notifications:', e);
            setNotifications([]);
        }
    }

    async function loadStudentData() {
        try {
            setLoading(true);
            const [facRes, bookRes, notifRes] = await Promise.all([
                facilityAPI.getAll(),
                bookingAPI.getMy(),
                notificationAPI.getForDashboard()
            ]);
            setFacilities(facRes.facilities || []);
            setBookings(bookRes.bookings || []);
            setNotifications(notifRes.notifications || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    async function loadStaffData() {
        try {
            setLoading(true);
            const [dashRes, notifRes, bookRes] = await Promise.all([
                staffAPI.getDashboard(),
                staffAPI.getNotifications(),
                staffAPI.getAllBookings()
            ]);
            setStaffStats(dashRes.stats || []);
            setAllNotifs(notifRes.notifications || []);
            setBookings(bookRes.bookings || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    // ============================================================
    // AUTH
    // ============================================================

    async function handleLogin(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await authAPI.login(loginData);
            if (res.success) {
                setUser(res.user);
                localStorage.setItem('token', res.token);
                localStorage.setItem('user', JSON.stringify(res.user));
                dataLoadedRef.current = true;
                setPage('dashboard');
                loadStudentData();
                setLoginData({ studentId: '', password: '' });
            }
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }

    async function handleRegister(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        if (registerData.password !== registerData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }
        try {
            const res = await authAPI.register({
                name: registerData.name,
                studentId: registerData.studentId,
                password: registerData.password
            });
            if (res.success) {
                setUser(res.user);
                localStorage.setItem('token', res.token);
                localStorage.setItem('user', JSON.stringify(res.user));
                dataLoadedRef.current = true;
                setPage('dashboard');
                loadStudentData();
                setRegisterData({ name: '', studentId: '', password: '', confirmPassword: '' });
                alert('✅ Registration successful!');
            }
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }

    async function handleStaffLogin(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await authAPI.staffLogin(staffLoginData);
            if (res.success) {
                setUser(res.user);
                localStorage.setItem('token', res.token);
                localStorage.setItem('user', JSON.stringify(res.user));
                dataLoadedRef.current = true;
                setPage('staff-dashboard');
                loadStaffData();
                setStaffLoginData({ email: '', password: '' });
            }
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }

    function handleLogout() {
        authAPI.logout();
        setUser(null);
        setPage('login');
        setSelectedFacility(null);
        setShowModal(false);
        dataLoadedRef.current = false;
    }

    // ============================================================
    // NAVIGATION
    // ============================================================

    const goToPage = (pageName) => {
        console.log('🔄 Changing page to:', pageName);
        setPage(pageName);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // ============================================================
    // BOOKING FUNCTIONS
    // ============================================================

    function openBookingModal(facility) {
        setSelectedFacility(facility);
        setBookingDate(new Date().toISOString().split('T')[0]);
        setBookingDuration('day');
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setSelectedFacility(null);
    }

    async function handleBooking(e) {
        e.preventDefault();
        if (!selectedFacility) return;
        let price = selectedFacility.dailyPrice;
        if (bookingDuration === 'week') price = selectedFacility.weeklyPrice;
        if (bookingDuration === 'month') price = selectedFacility.monthlyPrice;
        try {
            const res = await bookingAPI.create({
                facilityId: selectedFacility._id,
                bookingDate,
                timeSlot: bookingTime,
                duration: bookingDuration,
                totalPrice: price
            });
            if (res.success) {
                closeModal();
                loadStudentData();
                alert('✅ Booking confirmed!');
            }
        } catch (e) { alert('❌ ' + e.message); }
    }

    async function cancelBooking(id) {
        if (!window.confirm('Cancel this booking?')) return;
        try {
            const res = await bookingAPI.cancel(id);
            if (res.success) {
                loadStudentData();
                alert('❌ Booking cancelled.');
            }
        } catch (e) { alert('❌ ' + e.message); }
    }

    // ============================================================
    // STAFF FUNCTIONS
    // ============================================================

    async function handleCreateNotification(e) {
        e.preventDefault();

        if (!notifForm.title || !notifForm.message) {
            alert('Please fill in both title and message');
            return;
        }

        try {
            const res = await staffAPI.createNotification(notifForm);
            if (res.success) {
                loadStaffData();
                setNotifForm({
                    title: '',
                    message: '',
                    type: 'general',
                    priority: 'medium',
                    showOnLogin: true,
                    showOnDashboard: true,
                    expiresAt: ''
                });
                alert('✅ Notification created!');
            } else {
                alert('❌ ' + (res.message || 'Unknown error'));
            }
        } catch (e) {
            alert('❌ Error: ' + e.message);
        }
    }

    async function handleDeleteNotification(id) {
        if (!window.confirm('Delete this notification?')) return;
        try {
            const res = await staffAPI.deleteNotification(id);
            if (res.success) {
                loadStaffData();
                alert('✅ Notification deleted.');
            }
        } catch (e) {
            alert('❌ ' + e.message);
        }
    }

    function editNotification(notif) {
        setEditingNotifId(notif._id);
        setNotifForm({
            title: notif.title,
            message: notif.message,
            type: notif.type,
            priority: notif.priority,
            showOnLogin: notif.showOnLogin,
            showOnDashboard: notif.showOnDashboard,
            expiresAt: notif.expiresAt ? notif.expiresAt.split('T')[0] : ''
        });
    }

    async function handleUpdateNotification(e) {
        e.preventDefault();
        try {
            const res = await staffAPI.updateNotification(editingNotifId, notifForm);
            if (res.success) {
                loadStaffData();
                setEditingNotifId(null);
                setNotifForm({
                    title: '',
                    message: '',
                    type: 'general',
                    priority: 'medium',
                    showOnLogin: true,
                    showOnDashboard: true,
                    expiresAt: ''
                });
                alert('✅ Notification updated!');
            }
        } catch (e) {
            alert('❌ ' + e.message);
        }
    }

    function cancelEditNotification() {
        setEditingNotifId(null);
        setNotifForm({ title: '', message: '', type: 'general', priority: 'medium', showOnLogin: true, showOnDashboard: true, expiresAt: '' });
    }

    async function handleUpdatePrice(facilityId) {
        try {
            const res = await staffAPI.updatePrices(facilityId, {
                dailyPrice: parseFloat(priceForm.dailyPrice),
                weeklyPrice: parseFloat(priceForm.weeklyPrice),
                monthlyPrice: parseFloat(priceForm.monthlyPrice)
            });
            if (res.success) {
                loadStaffData();
                setEditingPriceId(null);
                setPriceForm({ dailyPrice: '', weeklyPrice: '', monthlyPrice: '' });
                alert('✅ Prices updated!');
            }
        } catch (e) { alert('❌ ' + e.message); }
    }

    async function handleAddFacility(e) {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/staff/facilities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(facilityForm)
            });
            const result = await res.json();
            if (result.success) {
                alert('✅ Facility added successfully!');
                setFacilityForm({ name: '', description: '', dailyPrice: 50, weeklyPrice: 120, monthlyPrice: 400, capacity: 30, isAvailable: true });
                loadStaffData();
                loadStudentData();
            } else {
                alert('❌ ' + result.message);
            }
        } catch (e) { alert('❌ ' + e.message); }
        finally { setLoading(false); }
    }

    // ============================================================
    // FILTER FACILITIES
    // ============================================================

    const filteredFacilities = facilities.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(search.toLowerCase()))
    );

    // ============================================================
    // RENDER FUNCTIONS - LOGIN PAGES
    // ============================================================

    function renderLogin() {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-icon">🏟️</div>
                    <h1>Welcome Back</h1>
                    <p className="auth-subtitle">Sign in to book your favourite sports facilities</p>
                    <form className="auth-form" onSubmit={handleLogin}>
                        <div className="error-message show">{error}</div>
                        <div className="form-group">
                            <label>Student ID</label>
                            <input type="text" placeholder="e.g., BIT24100001" value={loginData.studentId} onChange={(e) => setLoginData({ ...loginData, studentId: e.target.value.toUpperCase() })} required />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" placeholder="Enter your password" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} required />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Loading...' : 'Sign In'}</button>
                    </form>
                    <p className="auth-footer">
                        <button className="auth-link" onClick={() => goToPage('register')} style={{ background: 'none', border: 'none', color: '#4FC3F7', fontSize: 'inherit', cursor: 'pointer', fontWeight: 600 }}>Don't have an account? Register</button>
                    </p>
                    <p className="auth-footer">
                        <button className="auth-link" onClick={() => goToPage('staff-login')} style={{ background: 'none', border: 'none', color: '#4FC3F7', fontSize: 'inherit', cursor: 'pointer', fontWeight: 600 }}>Staff login? Staff Portal</button>
                    </p>
                    {notifications.length > 0 && (
                        <div style={{ marginTop: 20, textAlign: 'left' }}>
                            {notifications.map((n) => (
                                <div key={n._id} className={`notification-item ${n.type}`}>
                                    <div className="notif-title">🔔 {n.title}</div>
                                    <div className="notif-message">{n.message}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    function renderRegister() {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-icon">📝</div>
                    <h1>Student Registration</h1>
                    <p className="auth-subtitle">Create your account to start booking</p>
                    <form className="auth-form" onSubmit={handleRegister}>
                        <div className="error-message show">{error}</div>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" placeholder="e.g., Alex Johnson" value={registerData.name} onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Student ID</label>
                            <input type="text" placeholder="e.g., BIT24100001" value={registerData.studentId} onChange={(e) => setRegisterData({ ...registerData, studentId: e.target.value.toUpperCase() })} required />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" placeholder="Create a password" value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input type="password" placeholder="Confirm your password" value={registerData.confirmPassword} onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })} required />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
                    </form>
                    <p className="auth-footer">
                        <button className="auth-link" onClick={() => goToPage('login')} style={{ background: 'none', border: 'none', color: '#4FC3F7', fontSize: 'inherit', cursor: 'pointer', fontWeight: 600 }}>Already have an account? Sign In</button>
                    </p>
                </div>
            </div>
        );
    }

    function renderStaffLogin() {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-icon">👨‍💼</div>
                    <h1>Staff Portal</h1>
                    <p className="auth-subtitle">Authorized personnel only</p>
                    <form className="auth-form" onSubmit={handleStaffLogin}>
                        <div className="error-message show">{error}</div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" placeholder="staff@unilus.ac.zm" value={staffLoginData.email} onChange={(e) => setStaffLoginData({ ...staffLoginData, email: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" placeholder="Enter your password" value={staffLoginData.password} onChange={(e) => setStaffLoginData({ ...staffLoginData, password: e.target.value })} required />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Loading...' : 'Staff Sign In'}</button>
                    </form>
                    <p className="auth-footer">
                        <button className="auth-link" onClick={() => goToPage('login')} style={{ background: 'none', border: 'none', color: '#4FC3F7', fontSize: 'inherit', cursor: 'pointer', fontWeight: 600 }}>← Back to Student Login</button>
                    </p>
                </div>
            </div>
        );
    }

    // ============================================================
    // SIDEBAR
    // ============================================================

    function renderSidebar() {
        const isStaff = user?.role === 'staff';

        const items = isStaff ? [
            { id: 'staff-dashboard', icon: '📊', label: 'Dashboard' },
            { id: 'staff-notifications', icon: '🔔', label: 'Notifs' },
            { id: 'staff-prices', icon: '💰', label: 'Prices' },
            { id: 'staff-add-facility', icon: '➕', label: 'Add Facility' },
        ] : [
            { id: 'dashboard', icon: '🏠', label: 'Home' },
            { id: 'my-bookings', icon: '📅', label: 'Bookings' },
            { id: 'profile', icon: '👤', label: 'Profile' },
        ];

        return (
            <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span className="logo-icon">🏟️</span>
                        {sidebarOpen && (
                            <div className="logo-text">
                                <span className="unilus">UNILUS</span>
                                <span className="sports">Sports</span>
                            </div>
                        )}
                    </div>
                    <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                </div>

                <div className="sidebar-user">
                    <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
                    {sidebarOpen && (
                        <div className="user-info">
                            <div className="user-name">{user?.name}</div>
                            <div className="user-role">{isStaff ? '👨‍💼 Staff' : '🎓 Student'}</div>
                        </div>
                    )}
                </div>

                <nav className="sidebar-nav">
                    {items.map((item) => (
                        <button
                            key={item.id}
                            className={`nav-link ${page === item.id ? 'active' : ''}`}
                            onClick={() => goToPage(item.id)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {sidebarOpen && <span className="nav-label">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-link" onClick={handleLogout}>
                        <span className="nav-icon">🚪</span>
                        {sidebarOpen && <span className="nav-label">Logout</span>}
                    </button>
                </div>
            </div>
        );
    }

    // ============================================================
    // STUDENT PAGES
    // ============================================================

    function renderDashboard() {
        const activeBookings = bookings.filter(b => b.status === 'confirmed').length;
        return (
            <div className="page-content">
                <div className="page-header">
                    <h2>🏠 Dashboard</h2>
                    <span className="header-badge">🎓 {user?.studentId}</span>
                </div>
                <div className="stats-row">
                    <div className="stat-card"><div className="stat-number">{bookings.length}</div><div className="stat-label">Total Bookings</div></div>
                    <div className="stat-card"><div className="stat-number">{activeBookings}</div><div className="stat-label">Active Bookings</div></div>
                    <div className="stat-card"><div className="stat-number">{facilities.length}</div><div className="stat-label">Facilities</div></div>
                </div>
                {notifications.length > 0 && (
                    <div className="notifications-row">
                        {notifications.map((n) => (
                            <div key={n._id} className={`notification-item ${n.type}`}>
                                <div className="notif-title">🔔 {n.title}</div>
                                <div className="notif-message">{n.message}</div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="search-container">
                    <input type="text" className="search-input" placeholder="🔍 Search facilities..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="facility-tiles">
                    {filteredFacilities.length === 0 ? (
                        <div className="empty-state"><div className="empty-icon">🔍</div><h4>No facilities found</h4><p>Try a different search term</p></div>
                    ) : (
                        filteredFacilities.map((f) => {
                            const isBooked = bookings.some(b => b.facilityId?._id === f._id && b.status === 'confirmed');
                            return (
                                <div key={f._id} className={`facility-tile ${isBooked ? 'booked' : 'available'}`} onClick={() => !isBooked && openBookingModal(f)}>
                                    <div className="tile-icon">{f.name.split(' ')[0]}</div>
                                    <div className="tile-name">{f.name}</div>
                                    <div className="tile-price">🇿🇲 K{f.monthlyPrice}/month</div>
                                    <div className={`tile-status ${isBooked ? 'booked' : 'available'}`}>{isBooked ? '❌ Booked' : '✅ Available'}</div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    function renderMyBookings() {
        return (
            <div className="page-content">
                <div className="page-header"><h2>📅 My Bookings</h2><span className="header-badge">🎓 {user?.studentId}</span></div>
                {bookings.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">📭</div><h4>No Bookings Yet</h4><p>Book a facility from the dashboard!</p></div>
                ) : (
                    <div className="bookings-list">
                        {bookings.map((b) => (
                            <div key={b._id} className="booking-card">
                                <div className="booking-header">
                                    <h4>{b.facilityId?.name || 'Unknown'}</h4>
                                    <span className={`status-badge ${b.status === 'confirmed' ? 'active' : 'cancelled'}`}>{b.status}</span>
                                </div>
                                <div className="booking-details">📅 {new Date(b.bookingDate).toLocaleDateString()} · 🕐 {b.timeSlot} · ⏳ {b.duration} · 💰 K{b.totalPrice}</div>
                                {b.isCheckedIn && <div style={{ color: '#4CAF50', fontSize: 13, marginTop: 4 }}>✅ Checked in</div>}
                                {b.status === 'confirmed' && !b.isCheckedIn && (
                                    <div className="booking-actions"><button className="btn btn-yellow btn-sm" onClick={() => cancelBooking(b._id)}>Cancel</button></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    function renderProfile() {
        return (
            <div className="page-content">
                <div className="page-header"><h2>👤 My Profile</h2><span className="header-badge">🎓 {user?.studentId}</span></div>
                <div className="profile-card">
                    <div className="profile-avatar">{user?.name?.charAt(0) || 'U'}</div>
                    <div className="profile-name">{user?.name}</div>
                    <div className="profile-detail">🆔 {user?.studentId}</div>
                    <div className="profile-detail">📧 {user?.email}</div>
                    <div className="profile-detail">🎓 {user?.role === 'staff' ? 'Staff' : 'Student'}</div>
                    <div className="profile-detail">📚 {user?.program || 'N/A'}</div>
                </div>
            </div>
        );
    }

    // ============================================================
    // STAFF PAGES
    // ============================================================

    function renderStaffDashboard() {
        return (
            <div className="page-content">
                <div className="page-header"><h2>📊 Staff Dashboard</h2><span className="header-badge">👨‍💼 {user?.name}</span></div>
                <div className="stats-row">
                    <div className="stat-card"><div className="stat-number">{staffStats.length}</div><div className="stat-label">Facilities Today</div></div>
                </div>
                <div className="staff-stats-list">
                    <h4>📊 Facility Bookings Today</h4>
                    {staffStats.map((s) => (
                        <div key={s.facilityId} className="staff-stat-row"><span>{s.name}</span><span>{s.totalBookings} booked</span></div>
                    ))}
                </div>
            </div>
        );
    }

    function renderStaffNotifications() {
        return (
            <div className="page-content">
                <div className="page-header"><h2>🔔 Manage Notifications</h2><span className="header-badge">👨‍💼 {user?.name}</span></div>
                <div className="notif-form">
                    <h4>{editingNotifId ? '✏️ Edit Notification' : '➕ Create Notification'}</h4>
                    <form onSubmit={editingNotifId ? handleUpdateNotification : handleCreateNotification}>
                        <input type="text" placeholder="Title" value={notifForm.title} onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })} required />
                        <textarea placeholder="Message" value={notifForm.message} onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })} required />
                        <div className="notif-form-row">
                            <select value={notifForm.type} onChange={(e) => setNotifForm({ ...notifForm, type: e.target.value })}>
                                <option value="general">General</option><option value="emergency">Emergency</option><option value="price_update">Price Update</option>
                            </select>
                            <select value={notifForm.priority} onChange={(e) => setNotifForm({ ...notifForm, priority: e.target.value })}>
                                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                            </select>
                        </div>
                        <div className="notif-form-row">
                            <label><input type="checkbox" checked={notifForm.showOnLogin} onChange={(e) => setNotifForm({ ...notifForm, showOnLogin: e.target.checked })} /> Show on Login</label>
                            <label><input type="checkbox" checked={notifForm.showOnDashboard} onChange={(e) => setNotifForm({ ...notifForm, showOnDashboard: e.target.checked })} /> Show on Dashboard</label>
                        </div>
                        <input type="date" value={notifForm.expiresAt} onChange={(e) => setNotifForm({ ...notifForm, expiresAt: e.target.value })} />
                        <div className="notif-form-actions">
                            <button type="submit" className="btn btn-primary">{editingNotifId ? 'Update' : 'Create'}</button>
                            {editingNotifId && <button type="button" className="btn btn-outline" onClick={cancelEditNotification}>Cancel</button>}
                        </div>
                    </form>
                </div>
                <h4 style={{ marginTop: 16, marginBottom: 8 }}>Current Notifications</h4>
                {allNotifs.length === 0 ? (
                    <p style={{ color: '#6B6B8A' }}>No notifications yet.</p>
                ) : (
                    allNotifs.map((n) => (
                        <div key={n._id} className="notif-item">
                            <div className="notif-info">
                                <div className="notif-title">📌 {n.title}</div>
                                <div className="notif-message">{n.message}</div>
                                <div style={{ fontSize: 11, color: '#6B6B8A', marginTop: 2 }}>{n.type} · {n.priority} · {n.isActive ? 'Active' : 'Inactive'}</div>
                            </div>
                            <div className="notif-actions">
                                <button className="edit-btn" onClick={() => editNotification(n)}>✏️</button>
                                <button className="delete-btn" onClick={() => handleDeleteNotification(n._id)}>🗑️</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    }

    function renderStaffPrices() {
        return (
            <div className="page-content">
                <div className="page-header"><h2>💰 Manage Prices</h2><span className="header-badge">👨‍💼 {user?.name}</span></div>
                <p style={{ color: '#B0B0C8', fontSize: 14, marginBottom: 16 }}>Update facility prices without touching code!</p>
                {facilities.length === 0 ? (
                    <p style={{ color: '#6B6B8A' }}>No facilities found.</p>
                ) : (
                    facilities.map((f) => (
                        <div key={f._id} className="price-item">
                            <div className="price-info">
                                <div className="price-name">{f.name}</div>
                                <div className="price-values">Daily: K{f.dailyPrice} · Weekly: K{f.weeklyPrice} · Monthly: K{f.monthlyPrice}</div>
                            </div>
                            <div className="price-actions">
                                <button onClick={() => { setEditingPriceId(f._id); setPriceForm({ dailyPrice: f.dailyPrice, weeklyPrice: f.weeklyPrice, monthlyPrice: f.monthlyPrice }); }}>Edit</button>
                            </div>
                        </div>
                    ))
                )}
                {editingPriceId && (
                    <div className="price-edit-form">
                        <h4>✏️ Update Prices</h4>
                        <div className="price-edit-row">
                            <div><label>Daily</label><input type="number" value={priceForm.dailyPrice} onChange={(e) => setPriceForm({ ...priceForm, dailyPrice: e.target.value })} /></div>
                            <div><label>Weekly</label><input type="number" value={priceForm.weeklyPrice} onChange={(e) => setPriceForm({ ...priceForm, weeklyPrice: e.target.value })} /></div>
                            <div><label>Monthly</label><input type="number" value={priceForm.monthlyPrice} onChange={(e) => setPriceForm({ ...priceForm, monthlyPrice: e.target.value })} /></div>
                        </div>
                        <div className="price-edit-actions">
                            <button className="btn btn-primary" onClick={() => handleUpdatePrice(editingPriceId)}>Save Changes</button>
                            <button className="btn btn-outline" onClick={() => { setEditingPriceId(null); setPriceForm({ dailyPrice: '', weeklyPrice: '', monthlyPrice: '' }); }}>Cancel</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    function renderStaffAddFacility() {
        return (
            <div className="page-content">
                <div className="page-header"><h2>➕ Add New Facility</h2><span className="header-badge">👨‍💼 {user?.name}</span></div>
                <div className="facility-form-container">
                    <form onSubmit={handleAddFacility}>
                        <div className="form-group">
                            <label>Facility Name *</label>
                            <input type="text" placeholder="e.g., 🏋️ Gym, 🏀 Basketball Court" value={facilityForm.name} onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea placeholder="Describe the facility..." value={facilityForm.description} onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })} rows="3" />
                        </div>
                        <div className="form-row">
                            <div className="form-group"><label>Daily Price (K)</label><input type="number" value={facilityForm.dailyPrice} onChange={(e) => setFacilityForm({ ...facilityForm, dailyPrice: parseFloat(e.target.value) })} min="0" step="5" /></div>
                            <div className="form-group"><label>Weekly Price (K)</label><input type="number" value={facilityForm.weeklyPrice} onChange={(e) => setFacilityForm({ ...facilityForm, weeklyPrice: parseFloat(e.target.value) })} min="0" step="5" /></div>
                            <div className="form-group"><label>Monthly Price (K)</label><input type="number" value={facilityForm.monthlyPrice} onChange={(e) => setFacilityForm({ ...facilityForm, monthlyPrice: parseFloat(e.target.value) })} min="0" step="10" /></div>
                        </div>
                        <div className="form-row">
                            <div className="form-group"><label>Capacity</label><input type="number" value={facilityForm.capacity} onChange={(e) => setFacilityForm({ ...facilityForm, capacity: parseInt(e.target.value) })} min="1" /></div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <label style={{ margin: 0 }}>Available</label>
                                <input type="checkbox" checked={facilityForm.isAvailable} onChange={(e) => setFacilityForm({ ...facilityForm, isAvailable: e.target.checked })} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Adding...' : '➕ Add Facility'}</button>
                            <button type="button" className="btn btn-outline" onClick={() => goToPage('staff-dashboard')}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ============================================================
    // MODAL
    // ============================================================

    function renderModal() {
        if (!showModal || !selectedFacility) return null;
        let price = selectedFacility.dailyPrice;
        if (bookingDuration === 'week') price = selectedFacility.weeklyPrice;
        if (bookingDuration === 'month') price = selectedFacility.monthlyPrice;
        return (
            <div className="modal-overlay show" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                <div className="modal">
                    <div className="modal-header"><h3>📅 Book {selectedFacility.name}</h3><button className="modal-close" onClick={closeModal}>✕</button></div>
                    <form onSubmit={handleBooking}>
                        <div className="form-group">
                            <label>Duration</label>
                            <div className="duration-options">
                                <button type="button" className={`duration-btn ${bookingDuration === 'day' ? 'selected' : ''}`} onClick={() => setBookingDuration('day')}>Daily<br />K{selectedFacility.dailyPrice}</button>
                                <button type="button" className={`duration-btn ${bookingDuration === 'week' ? 'selected' : ''}`} onClick={() => setBookingDuration('week')}>Weekly<br />K{selectedFacility.weeklyPrice}</button>
                                <button type="button" className={`duration-btn ${bookingDuration === 'month' ? 'selected' : ''}`} onClick={() => setBookingDuration('month')}>Monthly<br />K{selectedFacility.monthlyPrice}</button>
                            </div>
                        </div>
                        <div className="form-group"><label>Date</label><input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} required /></div>
                        <div className="form-group"><label>Time Slot</label>
                            <select value={bookingTime} onChange={(e) => setBookingTime(e.target.value)}>
                                <option value="06:00-08:00">06:00 - 08:00</option><option value="08:00-10:00">08:00 - 10:00</option>
                                <option value="10:00-12:00">10:00 - 12:00</option><option value="12:00-14:00">12:00 - 14:00</option>
                                <option value="14:00-16:00">14:00 - 16:00</option><option value="16:00-18:00">16:00 - 18:00</option>
                                <option value="18:00-20:00">18:00 - 20:00</option>
                            </select>
                        </div>
                        <div style={{ background: '#1A1A2E', padding: 12, borderRadius: 8, marginBottom: 16 }}><strong>Total: K{price}</strong> <span style={{ color: '#B0B0C8' }}>({bookingDuration})</span></div>
                        <div className="modal-footer"><button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button><button type="submit" className="btn btn-primary">Confirm Booking</button></div>
                    </form>
                </div>
            </div>
        );
    }

    // ============================================================
    // MAIN RENDER
    // ============================================================

    if (page === 'login' || page === 'register' || page === 'staff-login') {
        return (
            <div className="app-fullscreen">
                {page === 'login' && renderLogin()}
                {page === 'register' && renderRegister()}
                {page === 'staff-login' && renderStaffLogin()}
            </div>
        );
    }

    return (
        <div className="app-fullscreen">
            <div className="app-layout">
                {renderSidebar()}
                <div className="app-content">
                    <div className="app-content-inner">
                        <div className="mobile-header">
                            <button className="sidebar-toggle-btn-mobile" onClick={toggleSidebar}>☰</button>
                            <span className="mobile-title">UNILUS Sports</span>
                            <span className="mobile-badge">{user?.role === 'staff' ? '👨‍💼 Staff' : '🎓 Student'}</span>
                        </div>

                        {page === 'dashboard' && renderDashboard()}
                        {page === 'my-bookings' && renderMyBookings()}
                        {page === 'profile' && renderProfile()}
                        {page === 'staff-dashboard' && renderStaffDashboard()}
                        {page === 'staff-notifications' && renderStaffNotifications()}
                        {page === 'staff-prices' && renderStaffPrices()}
                        {page === 'staff-add-facility' && renderStaffAddFacility()}
                    </div>
                </div>
            </div>
            {renderModal()}
        </div>
    );
}

export default App;
