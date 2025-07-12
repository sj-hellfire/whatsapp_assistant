// Chat Manager Module
class ChatManager {
    constructor() {
        this.chatMessages = document.getElementById('chat-messages');
        this.chatHistory = [];
        this.userMap = new Map(); // Map to track users and their colors
        this.activeContacts = new Set(); // Track active contacts
        this.autoScroll = true;
        this.init();
    }

    init() {
        this.setupAutoScroll();
    }

    setupAutoScroll() {
        // Auto-scroll when user scrolls to bottom
        this.chatMessages.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = this.chatMessages;
            this.autoScroll = scrollTop + clientHeight >= scrollHeight - 10;
        });
    }

    addChatMessage(sender, message, timestamp, isUser = false, userId = null) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${isUser ? 'user-message' : 'ai-message'}`;
        
        // Get user color
        const userColor = Utils.getUserColor(userId || sender);
        
        // Format message content
        const formattedMessage = this.formatMessageContent(message);
        
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-sender" style="color: ${userColor};">${Utils.escapeHtml(sender)}</span>
                <span class="message-time">${timestamp}</span>
            </div>
            <div class="message-content">${formattedMessage}</div>
        `;
        
        this.chatMessages.appendChild(messageElement);
        
        // Store in history
        this.chatHistory.push({
            sender,
            message,
            timestamp,
            isUser,
            userId,
            element: messageElement
        });
        
        // Update chat status to show active chat
        if (isUser && userId) {
            this.addActiveContact(userId, sender);
        }
        
        // Auto-scroll if enabled
        if (this.autoScroll) {
            Utils.scrollToBottom(this.chatMessages);
        }
    }

    formatMessageContent(message) {
        if (!message) return '';
        
        // Convert URLs to links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        let formattedMessage = Utils.escapeHtml(message).replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Convert line breaks to <br> tags
        formattedMessage = formattedMessage.replace(/\n/g, '<br>');
        
        // Highlight media indicators
        formattedMessage = formattedMessage.replace(/\[([A-Z]+)\]/g, '<span class="media-indicator">[$1]</span>');
        
        return formattedMessage;
    }

    clearChat() {
        this.chatMessages.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">🤖</div>
                <h3>Welcome to WhatsApp AI Assistant</h3>
                <p>Start chatting with your allowed contacts to see messages here</p>
            </div>
        `;
        this.chatHistory = [];
        this.activeContacts.clear();
        this.updateChatStatus('No Active Chat');
    }

    refreshContactNamesInChat(whatsappId, newName) {
        this.chatHistory.forEach(chatItem => {
            if (chatItem.userId === whatsappId) {
                const senderElement = chatItem.element.querySelector('.message-sender');
                if (senderElement) {
                    senderElement.textContent = newName;
                    // Update color if needed
                    const userColor = Utils.getUserColor(whatsappId);
                    senderElement.style.color = userColor;
                }
            }
        });
    }

    removeContactFromChat(whatsappId) {
        this.chatHistory = this.chatHistory.filter(chatItem => {
            if (chatItem.userId === whatsappId) {
                if (chatItem.element.parentNode) {
                    chatItem.element.parentNode.removeChild(chatItem.element);
                }
                return false;
            }
            return true;
        });
        
        // Remove from active contacts
        this.removeActiveContact(whatsappId);
    }

    getChatHistory() {
        return this.chatHistory;
    }

    getActiveContacts() {
        return Array.from(this.activeContacts);
    }

    getActiveContactCount() {
        return this.activeContacts.size;
    }

    // Method for testing multiple contacts
    addTestContact(userId, contactName) {
        this.addActiveContact(userId, contactName);
    }

    updateChatStatus(status) {
        // Update the chat status in the main app if available
        if (window.app && window.app.updateChatStatus) {
            window.app.updateChatStatus(status);
        }
    }

    addActiveContact(userId, contactName) {
        this.activeContacts.add(userId);
        this.updateChatStatusFromActiveContacts();
    }

    removeActiveContact(userId) {
        this.activeContacts.delete(userId);
        this.updateChatStatusFromActiveContacts();
    }

    updateChatStatusFromActiveContacts() {
        const contactCount = this.activeContacts.size;
        
        if (contactCount === 0) {
            this.updateChatStatus('No Active Chat');
        } else if (contactCount === 1) {
            // Get the single active contact name
            const activeContactIds = Array.from(this.activeContacts);
            const contactId = activeContactIds[0];
            const contactName = this.getContactNameById(contactId);
            this.updateChatStatus(`Chat with ${contactName || 'Contact'}`);
        } else {
            // Multiple active contacts
            this.updateChatStatus(`${contactCount} Active Chats`);
        }
    }

    getContactNameById(userId) {
        // Try to get contact name from contact manager if available
        if (window.contactManager && window.contactManager.getContactNameById) {
            return window.contactManager.getContactNameById(userId);
        }
        
        // Fallback: look in chat history for the most recent name
        const recentMessage = this.chatHistory
            .filter(item => item.userId === userId)
            .pop();
        
        return recentMessage ? recentMessage.sender : null;
    }

    exportChat() {
        const chatText = this.chatHistory.map(item => 
            `[${item.timestamp}] ${item.sender}: ${item.message}`
        ).join('\n');
        
        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    processLogForChat(logEntry) {
        // Extract user messages and AI responses from logs
        const messageMatch = logEntry.message.match(/📨 Message from (.+?) \(([^)]+)\): "([^"]*)"(.*)/);
        const responseMatch = logEntry.message.match(/🤖 AI response to (.+?): "([^"]*)"(.*)/);
        
        if (messageMatch) {
            const [, contactName, contactId, message, mediaInfo] = messageMatch;
            let displayMessage = message;
            
            // Handle media information
            if (mediaInfo && mediaInfo.includes('[')) {
                const mediaMatch = mediaInfo.match(/\[([A-Z]+)\]/);
                if (mediaMatch) {
                    displayMessage += `\n[${mediaMatch[1]}]`;
                }
            }
            
            this.addChatMessage(contactName, displayMessage, logEntry.timestamp, true, contactId);
        } else if (responseMatch) {
            const [, contactName, response] = responseMatch;
            this.addChatMessage('AI Assistant', response, logEntry.timestamp, false);
        }
    }

    processExistingLogsForChat(logs) {
        logs.forEach(log => {
            this.processLogForChat(log);
        });
    }
}

// Export for global use
window.ChatManager = ChatManager; 