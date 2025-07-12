// Main application script - uses modular structure
class WhatsAppAssistant {
    constructor() {
        this.socket = io();
        this.chatManager = null;
        this.contactManager = null;
        this.allLogs = [];
        this.logsLoaded = false;
        this.currentQR = null;
        this.init();
    }

    init() {
        this.initializeManagers();
        this.setupSocketHandlers();
        this.setupEventListeners();
        this.startTimestampUpdates();
    }

    initializeManagers() {
        // Initialize managers
        this.chatManager = new ChatManager();
        this.contactManager = new ContactManager();
        
        // Make managers globally accessible for backward compatibility
        window.chatManager = this.chatManager;
        window.contactManager = this.contactManager;
    }

    setupSocketHandlers() {
        // Connection events
        this.socket.on('connect', () => {
            this.updateConnectionStatus('online');
            this.addLogEntry('Web interface connected', 'success');
            
            // Set initial status while waiting for server response
            this.updateWhatsAppStatus({ isReady: false, isAuthenticated: false });
            this.updateChatStatus('No Active Chat');
            
            // Request status after a short delay if not received
            setTimeout(() => {
                const whatsappStatus = document.getElementById('whatsapp-status');
                if (whatsappStatus.textContent === 'WhatsApp: Offline') {
                    this.socket.emit('request-status');
                }
            }, 3000);
        });

        this.socket.on('disconnect', () => {
            this.updateConnectionStatus('offline');
            this.updateWhatsAppStatus({ isReady: false, isAuthenticated: false });
            this.updateChatStatus('Disconnected');
            this.addLogEntry('Web interface disconnected', 'warning');
        });

        // Log events
        this.socket.on('logs', (logs) => {
            this.allLogs = logs;
            logs.forEach(log => {
                if (!this.logsLoaded) {
                    this.chatManager.processLogForChat(log);
                }
            });
            this.chatManager.processExistingLogsForChat(logs);
            Utils.scrollToBottom(document.getElementById('logs'));
            this.logsLoaded = true;
        });

        this.socket.on('log', (logEntry) => {
            this.allLogs.push(logEntry);
            this.addLogEntry(logEntry.message, logEntry.type, logEntry.timestamp);
            if (!this.logsLoaded) {
                this.chatManager.processLogForChat(logEntry);
            }
            Utils.scrollToBottom(document.getElementById('logs'));
        });

        // Status events
        this.socket.on('status', (status) => {
            this.updateWhatsAppStatus(status);
        });

        // Message events
        this.socket.on('ai-response', (data) => {
            this.chatManager.addChatMessage('AI Assistant', data.response, data.timestamp, false);
            
            // Also add to logs for consistency
            this.allLogs.push({
                timestamp: data.timestamp,
                message: `🤖 AI response to ${data.contactName}: "${data.response}"`,
                type: 'response'
            });
        });

        this.socket.on('user-message', (data) => {
            // Format the message content
            let displayMessage = data.message;
            if (data.hasMedia && data.mediaType) {
                displayMessage = `${data.message}${data.message ? '\n' : ''}📷 [${data.mediaType.toUpperCase()}]`;
            }
            
            // Get the latest contact name from contact manager
            const displayName = this.contactManager.getContactNameById(data.contactId) || data.contactName;
            
            this.chatManager.addChatMessage(displayName, displayMessage, data.timestamp, true, data.contactId);
            
            // Also add to logs for consistency
            this.allLogs.push({
                timestamp: data.timestamp,
                message: `📨 Message from ${data.contactName} (${data.contactId}): "${data.message}"${data.hasMedia ? ` + [${data.mediaType.toUpperCase()}]` : ''}`,
                type: 'message'
            });
        });

        this.socket.on('admin-message', (data) => {
            // Get the latest contact name from contact manager
            const displayName = this.contactManager.getContactNameById(data.contactId) || data.contactName;
            
            this.chatManager.addChatMessage(`Admin → ${displayName}`, data.message, data.timestamp, false);
            
            // Also add to logs for consistency
            this.allLogs.push({
                timestamp: data.timestamp,
                message: `📤 Admin sent message to ${data.contactName} (${data.contactId}): "${data.message}"`,
                type: 'message'
            });
        });

        // QR code events
        this.socket.on('qr', (qrDataUrl) => {
            this.currentQR = qrDataUrl;
            this.renderQRPanel();
            this.updateChatStatus('Scan QR Code');
        });
    }

    setupEventListeners() {
        // Log management
        document.getElementById('clear-logs').addEventListener('click', () => {
            this.clearLogs();
        });

        document.getElementById('export-logs').addEventListener('click', () => {
            this.exportLogs();
        });

        // Contact management
        document.getElementById('manage-contacts').addEventListener('click', () => {
            this.contactManager.openContactModal();
        });

        // WhatsApp management
        document.getElementById('refresh-status').addEventListener('click', () => {
            // This button handles both refresh and restart functionality
            this.socket.emit('refresh-whatsapp-client');
        });

        document.getElementById('logout-whatsapp').addEventListener('click', () => {
            this.socket.emit('logout-whatsapp');
        });

        // Admin chat form
        document.getElementById('admin-chat-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAdminMessage();
        });

        // Auto-resize textarea
        const adminChatMessage = document.getElementById('admin-chat-message');
        adminChatMessage.addEventListener('input', () => {
            adminChatMessage.style.height = 'auto';
            adminChatMessage.style.height = Math.min(adminChatMessage.scrollHeight, 120) + 'px';
        });
    }

    startTimestampUpdates() {
        // Live timestamp update
        function updateTimestamp() {
            const now = new Date();
            const timeString = now.toLocaleTimeString();
            const dateString = now.toLocaleDateString();
            document.getElementById('current-time').textContent = `${dateString} ${timeString}`;
        }

        // Update timestamp every second
        setInterval(updateTimestamp, 1000);
        updateTimestamp(); // Initial update
    }

    // UI Functions
    addLogEntry(message, type = 'info', timestamp = null) {
        const logsContainer = document.getElementById('logs');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        
        const time = timestamp || new Date().toLocaleTimeString();
        const label = Utils.getLogLabel(type);
        
        logEntry.innerHTML = `
            <span class="log-timestamp">[${time}]</span>
            <span class="log-label">${label}</span>
            <span class="log-message">${Utils.escapeHtml(message)}</span>
        `;
        
        logsContainer.appendChild(logEntry);
    }

    updateConnectionStatus(status) {
        const connectionStatus = document.getElementById('connection-status');
        connectionStatus.textContent = `Web: ${status === 'online' ? 'Online' : 'Offline'}`;
        connectionStatus.className = `status-badge ${status}`;
    }

    updateWhatsAppStatus(status) {
        const whatsappStatus = document.getElementById('whatsapp-status');
        const logoutBtn = document.getElementById('logout-whatsapp');
        const adminChatForm = document.getElementById('admin-chat-form');
        
        if (status.isReady && status.isAuthenticated) {
            whatsappStatus.textContent = 'WhatsApp: Online';
            whatsappStatus.className = 'status-badge online';
            logoutBtn.disabled = false;
            logoutBtn.textContent = 'Logout WhatsApp';
            logoutBtn.style.opacity = '1';
            logoutBtn.style.background = '#dc3545';
            adminChatForm.style.display = 'flex';
            this.hideQRPanel();
            // Update chat status to show ready state
            this.updateChatStatus('Ready for Chat');
        } else {
            whatsappStatus.textContent = 'WhatsApp: Offline';
            whatsappStatus.className = 'status-badge offline';
            logoutBtn.disabled = true;
            logoutBtn.textContent = 'Logged Out';
            logoutBtn.style.opacity = '0.7';
            logoutBtn.style.background = '#6c757d';
            adminChatForm.style.display = 'none';
            // Update chat status to show offline state
            this.updateChatStatus('WhatsApp Offline');
        }
    }

    updateChatStatus(status) {
        const chatStatus = document.getElementById('chat-status');
        chatStatus.textContent = status;
    }

    async handleAdminMessage() {
        const to = document.getElementById('admin-chat-to').value;
        const message = Utils.sanitizeInput(document.getElementById('admin-chat-message').value);
        
        if (!to || !message) {
            Utils.showNotification('Please select a recipient and enter a message', 'warning');
            return;
        }
        
        this.socket.emit('admin-send-message', { to, message });
        document.getElementById('admin-chat-message').value = '';
        document.getElementById('admin-chat-message').style.height = 'auto';
    }

    clearLogs() {
        document.getElementById('logs').innerHTML = '';
        this.allLogs = [];
        Utils.showNotification('Logs cleared', 'success');
    }

    exportLogs() {
        const logText = this.allLogs.map(log => 
            `[${log.timestamp}] ${Utils.getLogLabel(log.type)}: ${log.message}`
        ).join('\n');
        
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `whatsapp-assistant-logs-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Utils.showNotification('Logs exported successfully', 'success');
    }

    renderQRPanel() {
        const chatMessages = document.getElementById('chat-messages');
        const rightPanelHeader = document.querySelector('.right-panel .panel-header h2');
        const adminChatForm = document.getElementById('admin-chat-form');
        
        rightPanelHeader.textContent = 'WhatsApp Authentication Login';
        adminChatForm.style.display = 'none';
        
        chatMessages.innerHTML = `
            <div class="qr-panel" style="text-align: center; padding: 40px 20px;">
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #333; margin-bottom: 10px;">📱 Scan QR Code</h3>
                    <p style="color: #666; margin-bottom: 20px;">
                        Open WhatsApp on your phone and scan this QR code to authenticate
                    </p>
                </div>
                <div style="margin-bottom: 20px;">
                    <img src="${this.currentQR}" alt="QR Code" style="max-width: 300px; border: 2px solid #ddd; border-radius: 8px;">
                </div>
                <div style="color: #666; font-size: 14px;">
                    <p>1. Open WhatsApp on your phone</p>
                    <p>2. Go to Settings > Linked Devices</p>
                    <p>3. Tap "Link a Device"</p>
                    <p>4. Point your phone camera at this QR code</p>
                </div>
            </div>
        `;
    }

    hideQRPanel() {
        const rightPanelHeader = document.querySelector('.right-panel .panel-header h2');
        const adminChatForm = document.getElementById('admin-chat-form');
        
        rightPanelHeader.textContent = '💬 Chat History';
        adminChatForm.style.display = 'flex';
        
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages.querySelector('.qr-panel')) {
            chatMessages.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">🤖</div>
                    <h3>Welcome to WhatsApp AI Assistant</h3>
                    <p>Start chatting with your allowed contacts to see messages here</p>
                </div>
            `;
            // Clear active contacts when hiding QR panel
            if (this.chatManager) {
                this.chatManager.activeContacts.clear();
                this.chatManager.updateChatStatusFromActiveContacts();
            }
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WhatsAppAssistant();
}); 