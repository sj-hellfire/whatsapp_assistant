const session = require('express-session');
const path = require('path');

// Session configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
};

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Login route handler
function handleLogin(req, res) {
    if (req.session.authenticated) {
        res.redirect('/');
    } else {
        res.sendFile(path.join(__dirname, '..', '..', 'public', 'login.html'));
    }
}

// Login POST handler
function handleLoginPost(req, res) {
    const { username, password } = req.body;
    
    // Check credentials (you should change these to your preferred credentials)
    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'password123';
    
    if (username === validUsername && password === validPassword) {
        req.session.authenticated = true;
        res.redirect('/');
    } else {
        res.redirect('/login?error=invalid');
    }
}

// Logout route handler
function handleLogout(req, res) {
    req.session.destroy();
    res.redirect('/login');
}

module.exports = {
    sessionConfig,
    requireAuth,
    handleLogin,
    handleLoginPost,
    handleLogout
}; 