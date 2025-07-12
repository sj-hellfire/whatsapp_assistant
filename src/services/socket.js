const { contactOperations } = require('../../supabase');

class SocketService {
    constructor(io, whatsappService, aiService) {
        this.io = io;
        this.whatsappService = whatsappService;
        this.aiService = aiService;
        this.logs = [];
        this.maxLogs = 1000;
        this.setupSocketHandlers();
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            this.log('Web interface connected', 'success');
            
            // Send existing logs to new client
            socket.emit('logs', this.logs);
            
            // Send current status
            const currentStatus = this.whatsappService.getStatus();
            socket.emit('status', currentStatus);
            
            socket.on('disconnect', () => {
                this.log('Web interface disconnected', 'warning');
            });
            
            socket.on('request-status', () => {
                const currentStatus = this.whatsappService.getStatus();
                socket.emit('status', currentStatus);
            });

            // Client management handlers
            socket.on('refresh-whatsapp-client', async () => {
                await this.whatsappService.refreshClient();
            });

            socket.on('logout-whatsapp', async () => {
                await this.whatsappService.logout();
            });

            // Admin send message handler
            socket.on('admin-send-message', async ({ to, message }) => {
                await this.handleAdminMessage(socket, to, message);
            });

            // AI message processing
            socket.on('message-received', async (messageData) => {
                await this.aiService.processMessage(messageData);
            });
        });

        // Handle WhatsApp message events
        this.io.on('message-received', async (messageData) => {
            await this.aiService.processMessage(messageData);
        });
    }

    async handleAdminMessage(socket, to, message) {
        try {
            if (!to || !message) {
                this.log('Recipient and message are required to send a WhatsApp message.', 'error');
                return;
            }
            
            // Get contact name for display
            const contactName = await this.getContactNameById(to) || to.replace('@c.us', '');
            
            // Send message via WhatsApp client
            const success = await this.whatsappService.sendMessage(to, message);
            
            if (success) {
                // Send admin message directly to frontend for immediate display
                this.io.emit('admin-message', {
                    contactName: contactName,
                    contactId: to,
                    message: message,
                    timestamp: new Date().toLocaleTimeString()
                });
                
                this.log(`Admin sent message to ${contactName}: "${message}"`, 'success');
            }
        } catch (err) {
            this.log(`Failed to send message to ${to}: ${err.message}`, 'error');
        }
    }

    async getContactNameById(contactId) {
        try {
            const contact = await contactOperations.getContactById(contactId);
            return contact ? contact.name : null;
        } catch (error) {
            console.error('Error getting contact name:', error);
            return null;
        }
    }

    addLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = { timestamp, message, type };
        
        this.logs.push(logEntry);
        
        // Keep only the last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Emit to all connected clients
        this.io.emit('log', logEntry);
        console.log(`[${timestamp}] ${message}`);
    }

    log(message, type = 'info') {
        this.addLog(message, type);
    }

    getLogs() {
        return this.logs;
    }

    clearLogs() {
        this.logs = [];
    }
}

module.exports = SocketService; 