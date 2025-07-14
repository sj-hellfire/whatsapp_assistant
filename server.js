const express = require('express');
const session = require('express-session');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

// Import modules
const { sessionConfig, requireAuth, handleLogin, handleLoginPost, handleLogout } = require('./src/middleware/auth');
const { errorHandler } = require('./src/middleware/errorHandler');
const { validateEnvironment, validateConfig, generateConfigReport, logConfigStatus } = require('./src/utils/configValidator');
const apiRoutes = require('./src/routes/api');
const WhatsAppService = require('./src/services/whatsapp');
const AIService = require('./src/services/ai');
const SocketService = require('./src/services/socket');
const { contactOperations } = require('./supabase');
const config = require('./config');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Session configuration
app.use(session(sessionConfig));

// Body parser for form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Demo route - serve static demo without authentication (must be before auth middleware)
app.use('/demo', express.static(path.join(__dirname, 'demo')));

// Authentication routes
app.get('/login', handleLogin);
app.post('/login', handleLoginPost);
app.get('/logout', handleLogout);

// API endpoints - must be before authentication middleware
app.use('/api', apiRoutes);

// Protected routes - require authentication
app.use('/', requireAuth);
app.use(express.static(path.join(__dirname, 'public')));

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize services
const whatsappService = new WhatsAppService(io, contactOperations);
const aiService = new AIService(io);
const socketService = new SocketService(io, whatsappService, aiService);

// Graceful shutdown
process.on('SIGINT', async () => {
    socketService.log('Shutting down WhatsApp AI Assistant...', 'warning');
    await whatsappService.destroy();
    process.exit(0);
});

// Validate configuration before starting
const envValidation = validateEnvironment();
const configValidation = validateConfig(config);
const configReport = generateConfigReport(envValidation, configValidation);

// Log configuration status
logConfigStatus(configReport);

// Check for critical errors
if (!configReport.environment.valid) {
    console.error('❌ Critical configuration errors found. Please fix the missing environment variables before starting the server.');
    process.exit(1);
}

if (!configReport.configuration.valid) {
    console.error('❌ Critical configuration errors found. Please fix the configuration issues before starting the server.');
    process.exit(1);
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    socketService.log(`Server started on http://0.0.0.0:${PORT}`, 'setup');
    socketService.log('Initializing WhatsApp client...', 'setup');
    socketService.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`, 'info');
    socketService.log(`Allowed contacts: ${config.allowedContacts.length}`, 'info');
    
    // Send initial status after a short delay to ensure client is initialized
    setTimeout(() => {
        whatsappService.broadcastStatus();
    }, 2000);
    
    // Periodic status check every 30 seconds to ensure status stays current
    setInterval(() => {
        whatsappService.broadcastStatus();
    }, 30000);
}); 