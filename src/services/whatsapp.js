const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const config = require('../../config');

class WhatsAppService {
    constructor(io, contactOperations) {
        this.io = io;
        this.contactOperations = contactOperations;
        this.client = null;
        this.state = {
            isReady: false,
            isAuthenticated: false,
            isInitialized: false
        };
        this.initializeClient();
        
        // Periodic health check to ensure client is active
        setInterval(() => {
            this.ensureClientActive();
        }, 60000); // Check every minute
    }

    initializeClient() {
        try {
            // Clean up existing client if it exists
            if (this.client) {
                try {
                    this.client.destroy();
                } catch (cleanupError) {
                    this.log('Error cleaning up existing client: ' + cleanupError.message, 'warning');
                }
                this.client = null;
            }

            this.client = new Client({
                authStrategy: new LocalAuth(),
                puppeteer: {
                    ...config.whatsapp.puppeteer,
                    headless: true,
                    defaultViewport: null,
                    args: [
                        ...config.whatsapp.puppeteer.args,
                        '--window-size=800,600',
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor',
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu'
                    ]
                }
            });

            this.setupEventHandlers();
            
            // Add error handling for initialization
            this.client.initialize().catch(error => {
                this.log('Error during client initialization: ' + error.message, 'error');
                // Retry initialization after delay
                setTimeout(() => {
                    try {
                        this.initializeClient();
                    } catch (retryError) {
                        this.log('Failed to retry initialization: ' + retryError.message, 'error');
                    }
                }, 10000);
            });
        } catch (error) {
            this.log('Error creating WhatsApp client: ' + error.message, 'error');
            // Retry after delay
            setTimeout(() => {
                try {
                    this.initializeClient();
                } catch (retryError) {
                    this.log('Failed to retry client creation: ' + retryError.message, 'error');
                }
            }, 10000);
        }
    }

    setupEventHandlers() {
        this.client.on('loading_screen', (percent, message) => {
            try {
                this.log(`WhatsApp loading: ${percent}%`, 'setup');
                this.updateState({ isInitialized: true, isAuthenticated: false, isReady: false });
            } catch (error) {
                this.log('Error in loading_screen handler: ' + error.message, 'error');
            }
        });

        this.client.on('qr', async (qr) => {
            try {
                this.log('QR Code received - scan with WhatsApp mobile app', 'setup');
                this.updateState({ isInitialized: true, isAuthenticated: false, isReady: false });
                
                const qrDataUrl = await QRCode.toDataURL(qr);
                this.io.emit('qr', qrDataUrl);
                this.log('QR Code displayed in browser', 'success');
            } catch (error) {
                this.log('Failed to generate QR code: ' + error.message, 'error');
            }
        });

        this.client.on('ready', () => {
            try {
                this.log('WhatsApp client ready', 'success');
                this.log('AI Assistant is now running', 'success');
                this.log(`Listening for messages from ${config.allowedContacts.length} contacts`, 'info');
                
                this.updateState({ isReady: true, isAuthenticated: true, isInitialized: true });
            } catch (error) {
                this.log('Error in ready handler: ' + error.message, 'error');
            }
        });

        this.client.on('authenticated', () => {
            try {
                this.log('WhatsApp authenticated', 'auth');
                this.updateState({ isAuthenticated: true, isInitialized: true });
            } catch (error) {
                this.log('Error in authenticated handler: ' + error.message, 'error');
            }
        });

        this.client.on('auth_failure', (msg) => {
            try {
                this.log('WhatsApp authentication failed: ' + msg, 'error');
                this.updateState({ isAuthenticated: false, isReady: false });
            } catch (error) {
                this.log('Error in auth_failure handler: ' + error.message, 'error');
            }
        });

        this.client.on('disconnected', (reason) => {
            try {
                this.log('WhatsApp disconnected: ' + reason, 'warning');
                this.updateState({ isReady: false, isAuthenticated: false });
                
                // Auto-restart client after a delay
                setTimeout(() => {
                    this.log('Auto-restarting WhatsApp client...', 'info');
                    this.initializeClient();
                }, 5000);
            } catch (error) {
                this.log('Error in disconnected handler: ' + error.message, 'error');
            }
        });

        this.client.on('message', this.handleMessage.bind(this));
    }

    async handleMessage(message) {
        try {
            // Check if message is from an allowed contact
            if (!config.allowedContacts.includes(message.from)) {
                this.log(`Message from unauthorized contact: (${message.from}): "${message.body}"`, 'unauthorized');
                return;
            }

            // Ignore messages from self
            if (message.fromMe) {
                return;
            }

            const contact = await message.getContact();
            const contactName = contact.pushname || contact.number || 'Unknown';
            
            // Update contact in Supabase if allowed
            if (config.allowedContacts.includes(message.from)) {
                try {
                    await this.contactOperations.upsertContact({
                        whatsapp_id: message.from,
                        phone_number: message.from.replace('@c.us', ''),
                        name: contactName,
                        is_allowed: true,
                        last_message_at: new Date().toISOString(),
                        message_count: 1
                    });
                } catch (error) {
                    this.log(`Error updating contact in database: ${error.message}`, 'error');
                }
            }
            
            // Process message content
            const { messageContent, hasMedia, mediaType } = await this.processMessageContent(message, contactName);
            
            // Send user message directly to frontend
            this.io.emit('user-message', {
                contactName: contactName,
                contactId: message.from,
                message: messageContent,
                hasMedia: hasMedia,
                mediaType: mediaType,
                timestamp: new Date().toLocaleTimeString()
            });

            // Send typing indicator
            await message.getChat().then(chat => chat.sendStateTyping());

            // Emit message for AI processing
            this.io.emit('message-received', {
                message,
                contactName,
                messageContent,
                hasMedia,
                mediaType
            });

        } catch (error) {
            this.log('Error processing message: ' + error.message, 'error');
            
            try {
                await message.reply(config.botConfig.errorMessage);
            } catch (replyError) {
                this.log('Error sending error message: ' + replyError.message, 'error');
            }
        }
    }

    async processMessageContent(message, contactName) {
        let messageContent = message.body || '';
        let hasMedia = false;
        let mediaType = '';
        
        if (message.hasMedia) {
            hasMedia = true;
            mediaType = message.type;
            
            try {
                const media = await message.downloadMedia();
                if (media) {
                    messageContent += `\n[${mediaType.toUpperCase()}] ${media.filename || 'media'}`;
                    this.log(`📨 Message from ${contactName} (${message.from}): "${message.body || ''}" + [${mediaType.toUpperCase()}]`, 'message');
                } else {
                    this.log(`📨 Message from ${contactName} (${message.from}): "${message.body || ''}" + [${mediaType.toUpperCase()} - download failed]`, 'message');
                }
            } catch (mediaError) {
                this.log(`Error downloading media: ${mediaError.message}`, 'error');
                messageContent += `\n[${mediaType.toUpperCase()} - download failed]`;
                this.log(`📨 Message from ${contactName} (${message.from}): "${message.body || ''}" + [${mediaType.toUpperCase()} - download failed]`, 'message');
            }
        } else {
            this.log(`📨 Message from ${contactName} (${message.from}): "${messageContent}"`, 'message');
        }

        return { messageContent, hasMedia, mediaType };
    }

    async sendMessage(to, message) {
        try {
            await this.client.sendMessage(to, message);
            return true;
        } catch (error) {
            this.log(`Failed to send message to ${to}: ${error.message}`, 'error');
            return false;
        }
    }

    async refreshClient() {
        try {
            this.log('Refreshing/restarting WhatsApp client...', 'info');
            
            this.updateState({ isReady: false, isAuthenticated: false, isInitialized: false });
            
            if (this.client) {
                try {
                    await this.client.destroy();
                } catch (destroyError) {
                    this.log('Warning: Error destroying client: ' + destroyError.message, 'warning');
                }
            }
            
            // Wait longer for cleanup
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            this.initializeClient();
            
            this.log('WhatsApp client refresh/restart completed', 'success');
        } catch (error) {
            this.log('Error refreshing WhatsApp client: ' + error.message, 'error');
            // Retry initialization with delay
            setTimeout(() => {
                try {
                    this.initializeClient();
                } catch (reinitError) {
                    this.log('Failed to reinitialize client: ' + reinitError.message, 'error');
                }
            }, 5000);
        }
    }

    async logout() {
        try {
            this.log('Logging out from WhatsApp...', 'info');
            
            this.updateState({ isReady: false, isAuthenticated: false, isInitialized: false });
            
            if (this.client) {
                try {
                    await this.client.logout();
                } catch (logoutError) {
                    this.log('Warning: Error during logout: ' + logoutError.message, 'warning');
                }
                
                try {
                    await this.client.destroy();
                } catch (destroyError) {
                    this.log('Warning: Error destroying client: ' + destroyError.message, 'warning');
                }
            }
            
            // Clear authentication cache
            const authDir = path.join(__dirname, '..', '..', '.wwebjs_auth');
            if (fs.existsSync(authDir)) {
                try {
                    fs.rmSync(authDir, { recursive: true, force: true });
                } catch (rmError) {
                    this.log('Warning: Error removing auth directory: ' + rmError.message, 'warning');
                }
            }
            
            // Clear .wwebjs_cache directory
            const cacheDir = path.join(__dirname, '..', '..', '.wwebjs_cache');
            if (fs.existsSync(cacheDir)) {
                try {
                    fs.rmSync(cacheDir, { recursive: true, force: true });
                } catch (rmError) {
                    this.log('Warning: Error removing cache directory: ' + rmError.message, 'warning');
                }
            }
            
            // Wait longer for cleanup
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            this.initializeClient();
            
            this.log('WhatsApp logout completed. Please scan the QR code to authenticate again.', 'success');
        } catch (error) {
            this.log('Error during WhatsApp logout: ' + error.message, 'error');
            // Retry initialization with delay
            setTimeout(() => {
                try {
                    this.initializeClient();
                } catch (reinitError) {
                    this.log('Failed to reinitialize client: ' + reinitError.message, 'error');
                }
            }, 5000);
        }
    }

    updateState(newState) {
        this.state = { ...this.state, ...newState };
        this.broadcastStatus();
    }

    getStatus() {
        return {
            isReady: this.state.isReady,
            isAuthenticated: this.state.isAuthenticated
        };
    }

    isClientActive() {
        return this.client && this.state.isInitialized;
    }

    ensureClientActive() {
        if (!this.isClientActive()) {
            this.log('No active WhatsApp client detected, initializing...', 'info');
            this.initializeClient();
        }
    }

    broadcastStatus() {
        this.io.emit('status', this.getStatus());
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = { timestamp, message, type };
        
        this.io.emit('log', logEntry);
        console.log(`[${timestamp}] ${message}`);
    }

    async destroy() {
        if (this.client) {
            await this.client.destroy();
        }
    }
}

module.exports = WhatsAppService; 