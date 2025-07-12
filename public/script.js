// Initialize Socket.IO connection
const socket = io();

// DOM elements
const logsContainer = document.getElementById('logs');
const connectionStatus = document.getElementById('connection-status');
const whatsappStatus = document.getElementById('whatsapp-status');
const currentTime = document.getElementById('current-time');
const chatMessages = document.getElementById('chat-messages');
const chatStatus = document.getElementById('chat-status');
const clearLogsBtn = document.getElementById('clear-logs');
const exportLogsBtn = document.getElementById('export-logs');
const refreshStatusBtn = document.getElementById('refresh-status');
const logoutWhatsappBtn = document.getElementById('logout-whatsapp');
const adminChatForm = document.getElementById('admin-chat-form');
const adminChatTo = document.getElementById('admin-chat-to');
const adminChatMessage = document.getElementById('admin-chat-message');

// Contact Manager Modal Elements
const manageContactsBtn = document.getElementById('manage-contacts');
const contactModal = document.getElementById('contact-modal');
const closeContactModalBtn = document.getElementById('close-contact-modal');
const contactsList = document.getElementById('contacts-list');
const addContactForm = document.getElementById('add-contact-form');
const newContactPhone = document.getElementById('new-contact-phone');
const newContactName = document.getElementById('new-contact-name');

// Edit Contact Modal Elements
const editContactModal = document.getElementById('edit-contact-modal');
const closeEditModalBtn = document.getElementById('close-edit-modal');
const editContactForm = document.getElementById('edit-contact-form');
const editContactId = document.getElementById('edit-contact-id');
const editContactPhone = document.getElementById('edit-contact-phone');
const editContactName = document.getElementById('edit-contact-name');
const deleteContactBtn = document.getElementById('delete-contact-btn');

// Store logs and chat messages
let allLogs = [];
let chatHistory = [];
let userMap = new Map(); // Map to track users and their colors
let logsLoaded = false; // Flag to prevent duplicate rendering
let currentQR = null;

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getLogLabel(type) {
    const labels = {
        'info': 'INFO',
        'success': 'SUCCESS',
        'warning': 'WARNING',
        'error': 'ERROR',
        'message': 'MESSAGE',
        'response': 'RESPONSE',
        'setup': 'SETUP',
        'auth': 'AUTH',
        'unauthorized': 'UNAUTHORIZED'
    };
    return labels[type] || 'INFO';
}

// Function to add log entries to the UI
function addLogEntry(message, type = 'info', timestamp = null, shouldScroll = true) {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    
    const time = timestamp || new Date().toLocaleTimeString();
    const label = getLogLabel(type);
    
    logEntry.innerHTML = `
        <span class="log-timestamp">[${time}]</span>
        <span class="log-label">${label}</span>
        <span class="log-message">${escapeHtml(message)}</span>
    `;
    
    logsContainer.appendChild(logEntry);
    
    if (shouldScroll && autoScroll) {
        scrollToBottom();
    }
}

// Live timestamp update
function updateTimestamp() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();
    currentTime.textContent = `${dateString} ${timeString}`;
}

// Update timestamp every second
setInterval(updateTimestamp, 1000);
updateTimestamp(); // Initial update

// Socket.IO event handlers
socket.on('connect', () => {
    updateConnectionStatus('online');
    addLogEntry('Web interface connected', 'success');
    
    // Set initial status while waiting for server response
    updateWhatsAppStatus({ isReady: false, isAuthenticated: false });
    updateChatStatus('Connecting...');
    
    // Request status after a short delay if not received
    setTimeout(() => {
        if (whatsappStatus.textContent === 'WhatsApp: Offline') {
            socket.emit('request-status');
        }
    }, 3000);
});

socket.on('disconnect', () => {
    updateConnectionStatus('offline');
    updateWhatsAppStatus({ isReady: false, isAuthenticated: false });
    updateChatStatus('Disconnected');
    addLogEntry('Web interface disconnected', 'warning');
});

socket.on('logs', (logs) => {
    allLogs = logs;
    logs.forEach(log => {
        if (!logsLoaded) processLogForChat(log);
    });
    // Process logs for chat after they're loaded
    processExistingLogsForChat();
    scrollToBottom();
    logsLoaded = true; // Set flag after initial load
});

socket.on('log', (logEntry) => {
    allLogs.push(logEntry);
    addLogEntry(logEntry.message, logEntry.type, logEntry.timestamp);
    if (!logsLoaded) processLogForChat(logEntry);
    scrollToBottom();
});

socket.on('status', (status) => {
    updateWhatsAppStatus(status);
});

// Handle AI responses sent directly from server
socket.on('ai-response', (data) => {
    addChatMessage('AI Assistant', data.response, data.timestamp, false);
    
    // Also add to logs for consistency
    allLogs.push({
        timestamp: data.timestamp,
        message: `🤖 AI response to ${data.contactName}: "${data.response}"`,
        type: 'response'
    });
});

// Handle user messages sent directly from server
socket.on('user-message', (data) => {
    // Format the message content
    let displayMessage = data.message;
    if (data.hasMedia && data.mediaType) {
        displayMessage = `${data.message}${data.message ? '\n' : ''}📷 [${data.mediaType.toUpperCase()}]`;
    }
    
    // Get the latest contact name from dropdown
    const displayName = getContactNameById(data.contactId) || data.contactName;
    
    addChatMessage(displayName, displayMessage, data.timestamp, true, data.contactId);
    
    // Also add to logs for consistency
    allLogs.push({
        timestamp: data.timestamp,
        message: `📨 Message from ${data.contactName} (${data.contactId}): "${data.message}"${data.hasMedia ? ` + [${data.mediaType.toUpperCase()}]` : ''}`,
        type: 'message'
    });
});

// Handle admin messages sent directly from server
socket.on('admin-message', (data) => {
    // Get the latest contact name from dropdown
    const displayName = getContactNameById(data.contactId) || data.contactName;
    
    addChatMessage(`Admin → ${displayName}`, data.message, data.timestamp, false);
    
    // Also add to logs for consistency
    allLogs.push({
        timestamp: data.timestamp,
        message: `📤 Admin sent message to ${data.contactName} (${data.contactId}): "${data.message}"`,
        type: 'message'
    });
});

// QR code handler
socket.on('qr', (qrDataUrl) => {
    currentQR = qrDataUrl;
    renderQRPanel();
});

// UI Functions
const originalAddLogEntry = addLogEntry;
addLogEntry = function(message, type = 'info', timestamp = null, shouldScroll = true) {
    // Replace occurrences of allowed contact numbers with their names
    if (type === 'message' || type === 'response' || type === 'unauthorized') {
        // Find all allowed contacts
        if (window.adminChatTo) {
            for (const opt of adminChatTo.options) {
                if (opt.value && opt.value.endsWith('@c.us')) {
                    const number = opt.value.replace('@c.us', '');
                    const name = getContactNameById(opt.value);
                    if (name && name !== number) {
                        // Replace both id and number in message
                        message = message.replaceAll(opt.value, name).replaceAll(number, name);
                    }
                }
            }
        }
    }
    originalAddLogEntry(message, type, timestamp, shouldScroll);
}

function scrollToBottom() {
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

function updateConnectionStatus(status) {
    connectionStatus.textContent = status === 'online' ? 'Web: Online' : 'Web: Offline';
    connectionStatus.className = `status-badge ${status}`;
}

function updateWhatsAppStatus(status) {
    let statusText = 'WhatsApp: Offline';
    let statusClass = 'offline';
    let isAuthenticated = false;
    if (status.isReady) {
        statusText = 'WhatsApp: Ready';
        statusClass = 'online';
        updateChatStatus('Ready for Chat');
        isAuthenticated = true;
    } else if (status.isAuthenticated) {
        statusText = 'WhatsApp: Authenticating';
        statusClass = 'warning';
        updateChatStatus('Authenticating...');
    } else {
        updateChatStatus('No Active Chat');
    }
    whatsappStatus.textContent = statusText;
    whatsappStatus.className = `status-badge ${statusClass}`;

    // Update logout button
    if (!status.isAuthenticated) {
        logoutWhatsappBtn.disabled = true;
        logoutWhatsappBtn.textContent = 'WhatsApp Logged Out';
        logoutWhatsappBtn.style.background = '#aaa';
        logoutWhatsappBtn.style.cursor = 'not-allowed';
    } else {
        logoutWhatsappBtn.disabled = false;
        logoutWhatsappBtn.textContent = 'Logout WhatsApp';
        logoutWhatsappBtn.style.background = '#dc3545';
        logoutWhatsappBtn.style.cursor = '';
    }

    // Show/hide chat or QR panel
    if (!status.isAuthenticated) {
        if (currentQR) {
            renderQRPanel();
        }
    } else {
        hideQRPanel();
    }
}

function updateChatStatus(status) {
    chatStatus.textContent = status;
    chatStatus.className = `status-badge ${status === 'Ready for Chat' ? 'online' : 'warning'}`;
}

// Get or assign user color
function getUserColor(userId) {
    if (!userMap.has(userId)) {
        const userCount = userMap.size + 1;
        userMap.set(userId, userCount);
    }
    return userMap.get(userId);
}

// Helper to get contact name by id
function getContactNameById(id) {
    const option = adminChatTo && adminChatTo.querySelector(`option[value='${id}']`);
    if (option) {
        // Extract name from option text (format: name (number))
        return option.textContent.split(' (')[0];
    }
    return id.replace('@c.us', '');
}

// Chat Functions
function addChatMessage(sender, message, timestamp, isUser = false, userId = null) {
    // If userId is present, use the latest name
    if (isUser && userId) {
        sender = getContactNameById(userId);
    }
    const chatMessage = document.createElement('div');
    chatMessage.className = `chat-message ${isUser ? 'user' : 'bot'}`;
    
    // Store userId as data attribute for future updates
    if (userId) {
        chatMessage.dataset.userId = userId;
    }
    
    const time = timestamp || new Date().toLocaleTimeString();
    
    // Add user label if it's a user message
    let userLabel = '';
    if (isUser && userId) {
        const userColor = getUserColor(userId);
        userLabel = `<div class="user-label user-${userColor}">${sender}</div>`;
    }
    
    chatMessage.innerHTML = `
        <div class="message-bubble ${isUser ? 'user' : 'bot'}">
            ${userLabel}
            <div class="message-content">${escapeHtml(message)}</div>
            <div class="message-timestamp">${time}</div>
        </div>
    `;
    
    chatMessages.appendChild(chatMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Store in chat history
    chatHistory.push({
        sender,
        message,
        timestamp: time,
        isUser,
        userId
    });
}

function clearChat() {
    chatMessages.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">🤖</div>
            <h3>Welcome to WhatsApp AI Assistant</h3>
            <p>Start chatting with your allowed contacts to see messages here</p>
        </div>
    `;
    chatHistory = [];
    userMap.clear(); // Reset user colors
}

// Process log entries to extract chat messages (for existing logs only)
function processLogForChat(logEntry) {
    if (logsLoaded) return; // Prevent duplicate rendering after initial load
    const { message, type, timestamp } = logEntry;
    
    // Only process logs that don't have corresponding Socket.IO events
    // This is mainly for existing logs when the page loads
    if (type === 'message') {
        // Extract user message from log - handle both text-only and media messages
        let match = message.match(/📨 Message from (.+?) \(([^)]+)\): "(.+?)"/);
        if (!match) {
            // Try format with media content
            match = message.match(/📨 Message from (.+?) \(([^)]+)\): "(.+?)" \+ \[(.+?)\]/);
        }
        if (!match) {
            // Try format with media only (no text)
            match = message.match(/📨 Message from (.+?) \(([^)]+)\): "" \+ \[(.+?)\]/);
        }
        
        if (match) {
            const [, contactName, phoneNumber, userMessage, mediaType] = match;
            // Use latest name for display
            const displayName = getContactNameById(phoneNumber);
            // If there's media, show it in the message
            const displayMessage = mediaType ? 
                `${userMessage || ''}${userMessage ? '\n' : ''}📷 [${mediaType}]` : 
                userMessage;
            addChatMessage(displayName, displayMessage, timestamp, true, phoneNumber);
        }
    } else if (type === 'response') {
        // Extract bot response from log - handle both formats
        let botResponse = null;
        
        // Try to extract the response using a more precise approach
        const responseMatch = message.match(/🤖 AI response to .+?: "(.+)"/);
        if (responseMatch) {
            botResponse = responseMatch[1];
        } else {
            // Fallback: try to extract everything after the colon and space
            const fallbackMatch = message.match(/🤖 AI response to .+?: (.+)/);
            if (fallbackMatch) {
                botResponse = fallbackMatch[1];
            }
        }
        
        if (botResponse) {
            addChatMessage('AI Assistant', botResponse, timestamp, false);
        }
    }
}

// Button event handlers
clearLogsBtn.addEventListener('click', () => {
    logsContainer.innerHTML = '';
    allLogs = [];
    addLogEntry('Logs cleared', 'info');
});

exportLogsBtn.addEventListener('click', () => {
    exportLogs();
});

refreshStatusBtn.addEventListener('click', () => {
    // Trigger WhatsApp client refresh
    socket.emit('refresh-whatsapp-client');
    addLogEntry('WhatsApp client refresh requested', 'info');
});

logoutWhatsappBtn.addEventListener('click', () => {
    // Confirm before logging out
    if (confirm('Are you sure you want to logout from WhatsApp? This will clear all authentication and require you to scan the QR code again.')) {
        socket.emit('logout-whatsapp');
        addLogEntry('WhatsApp logout requested', 'info');
    }
});

// Utility functions
function exportLogs() {
    const logText = allLogs.map(log => 
        `[${log.timestamp}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp-ai-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLogEntry('Logs exported successfully', 'success');
}

// Auto-scroll to bottom when new logs arrive
let autoScroll = true;
logsContainer.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = logsContainer;
    autoScroll = scrollTop + clientHeight >= scrollHeight - 10;
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + L to clear logs
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        clearLogsBtn.click();
    }
    
    // Ctrl/Cmd + E to export logs
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportLogsBtn.click();
    }
    
    // Ctrl/Cmd + End to scroll to bottom
    if ((e.ctrlKey || e.metaKey) && e.key === 'End') {
        e.preventDefault();
        scrollToBottom();
    }
});

// Initial setup
addLogEntry('WhatsApp AI Assistant Web Interface loaded', 'setup');

// Process existing logs for chat display
function processExistingLogsForChat() {
    allLogs.forEach(log => {
        processLogForChat(log);
    });
}

if (adminChatForm) {
    adminChatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const to = adminChatTo.value.trim();
        const message = adminChatMessage.value.trim();
        if (!to || !message) {
            addLogEntry('Recipient and message are required to send a WhatsApp message.', 'error');
            return;
        }
        socket.emit('admin-send-message', { to, message });
        addLogEntry(`Admin sent message to ${to}: "${message}"`, 'success');
        adminChatMessage.value = '';
    });
}

// Populate allowlisted contacts dropdown
async function populateAllowedContactsDropdown() {
    if (!adminChatTo) return;
    try {
        const res = await fetch('/api/allowed-contacts');
        const data = await res.json();
        adminChatTo.innerHTML = '<option value="">Select recipient...</option>';
        data.contacts.forEach(contact => {
            const opt = document.createElement('option');
            opt.value = contact.id;
            opt.textContent = `${contact.name} (${contact.number})`;
            adminChatTo.appendChild(opt);
        });
        // If only one contact, select it by default
        if (data.contacts.length === 1) {
            adminChatTo.value = data.contacts[0].id;
        }
    } catch (err) {
        addLogEntry('Failed to load allowlisted contacts for dropdown', 'error');
    }
}

window.addEventListener('DOMContentLoaded', populateAllowedContactsDropdown);

// Contact Manager Functions
function openContactModal() {
    if (contactModal) {
        contactModal.style.display = 'block';
        loadContacts();
    }
}

function closeContactModal() {
    contactModal.style.display = 'none';
    addContactForm.reset();
}

function openEditModal(contact) {
    editContactId.value = contact.whatsapp_id;
    editContactPhone.value = contact.phone_number;
    editContactName.value = contact.name;
    editContactModal.style.display = 'block';
}

function closeEditModal() {
    editContactModal.style.display = 'none';
    editContactForm.reset();
}

async function loadContacts() {
    try {
        const response = await fetch('/api/contacts');
        const data = await response.json();
        
        if (data.contacts && data.contacts.length > 0) {
            contactsList.innerHTML = data.contacts.map(contact => `
                <div class="contact-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; background: white;">
                    <div>
                        <div style="font-weight: 600; color: #333;">${contact.name}</div>
                        <div style="font-size: 12px; color: #666;">${contact.phone_number}</div>
                        <div style="font-size: 11px; color: #999;">Messages: ${contact.message_count || 0} | Last: ${contact.last_message_at ? new Date(contact.last_message_at).toLocaleDateString() : 'Never'}</div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="openEditModal(${JSON.stringify(contact).replace(/"/g, '&quot;')})" class="btn" style="padding: 6px 12px; font-size: 12px; background: #007bff; color: white;">Edit</button>
                        <span style="padding: 4px 8px; font-size: 10px; background: ${contact.is_allowed ? '#28a745' : '#dc3545'}; color: white; border-radius: 12px;">${contact.is_allowed ? 'Allowed' : 'Blocked'}</span>
                    </div>
                </div>
            `).join('');
        } else {
            contactsList.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No contacts found</div>';
        }
    } catch (error) {
        contactsList.innerHTML = '<div style="padding: 20px; text-align: center; color: #dc3545;">Error loading contacts</div>';
    }
}

async function addContact(phone, name) {
    try {
        const whatsappId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
        const response = await fetch(`/api/contacts/${encodeURIComponent(whatsappId)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                is_allowed: true
            })
        });

        if (response.ok) {
            addLogEntry(`Contact ${name} (${phone}) added successfully`, 'success');
            loadContacts();
            populateAllowedContactsDropdown(); // Refresh dropdown
            refreshContactNamesInChat(whatsappId, name); // Refresh chat messages
            addContactForm.reset();
        } else {
            const error = await response.json();
            addLogEntry(`Failed to add contact: ${error.error}`, 'error');
        }
    } catch (error) {
        addLogEntry('Error adding contact', 'error');
    }
}

async function updateContact(whatsappId, name) {
    try {
        const response = await fetch(`/api/contacts/${encodeURIComponent(whatsappId)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                is_allowed: true
            })
        });

        if (response.ok) {
            addLogEntry(`Contact ${name} updated successfully`, 'success');
            loadContacts();
            populateAllowedContactsDropdown(); // Refresh dropdown
            refreshContactNamesInChat(whatsappId, name); // Refresh chat messages
            closeEditModal();
        } else {
            const error = await response.json();
            addLogEntry(`Failed to update contact: ${error.error}`, 'error');
        }
    } catch (error) {
        addLogEntry('Error updating contact', 'error');
    }
}

// Function to refresh contact names in existing chat messages
function refreshContactNamesInChat(whatsappId, newName) {
    const phoneNumber = whatsappId.replace('@c.us', '');
    
    // Update user labels in chat messages
    const userLabels = chatMessages.querySelectorAll('.user-label');
    userLabels.forEach(label => {
        // Check if this label corresponds to the updated contact
        const messageContainer = label.closest('.chat-message');
        if (messageContainer && messageContainer.dataset.userId === phoneNumber) {
            label.textContent = newName;
        }
    });
    
    // Update message content that might contain the old name
    const messageContents = chatMessages.querySelectorAll('.message-content');
    messageContents.forEach(content => {
        // Replace old phone number with new name in message content
        content.innerHTML = content.innerHTML.replace(
            new RegExp(phoneNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
            newName
        );
    });
    
    // Update userMap to use new name
    if (userMap.has(phoneNumber)) {
        const color = userMap.get(phoneNumber);
        userMap.delete(phoneNumber);
        userMap.set(newName, color);
    }
}

async function deleteContact(whatsappId) {
    if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/contacts/${encodeURIComponent(whatsappId)}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            addLogEntry('Contact deleted successfully', 'success');
            loadContacts();
            populateAllowedContactsDropdown(); // Refresh dropdown
            removeContactFromChat(whatsappId); // Remove from chat messages
            closeEditModal();
        } else {
            const error = await response.json();
            addLogEntry(`Failed to delete contact: ${error.error}`, 'error');
        }
    } catch (error) {
        addLogEntry('Error deleting contact', 'error');
    }
}

// Function to remove contact from chat messages when deleted
function removeContactFromChat(whatsappId) {
    const phoneNumber = whatsappId.replace('@c.us', '');
    
    // Remove messages from this contact
    const messagesToRemove = chatMessages.querySelectorAll(`[data-user-id="${phoneNumber}"]`);
    messagesToRemove.forEach(message => {
        message.remove();
    });
    
    // Remove from userMap
    userMap.delete(phoneNumber);
    
    // Remove from chat history
    chatHistory = chatHistory.filter(msg => msg.userId !== phoneNumber);
}

// Contact Manager Event Listeners
if (manageContactsBtn) {
    manageContactsBtn.addEventListener('click', openContactModal);
    // Also add onclick as backup
    manageContactsBtn.onclick = function() {
        openContactModal();
    };
}

if (closeContactModalBtn) {
    closeContactModalBtn.addEventListener('click', closeContactModal);
}

if (closeEditModalBtn) {
    closeEditModalBtn.addEventListener('click', closeEditModal);
}

if (addContactForm) {
    addContactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const phone = newContactPhone.value.trim();
        const name = newContactName.value.trim();
        
        if (!phone || !name) {
            addLogEntry('Phone number and name are required', 'error');
            return;
        }
        
        addContact(phone, name);
    });
}

if (editContactForm) {
    editContactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const whatsappId = editContactId.value;
        const name = editContactName.value.trim();
        
        if (!name) {
            addLogEntry('Name is required', 'error');
            return;
        }
        
        updateContact(whatsappId, name);
    });
}

if (deleteContactBtn) {
    deleteContactBtn.addEventListener('click', function() {
        const whatsappId = editContactId.value;
        deleteContact(whatsappId);
    });
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === contactModal) {
        closeContactModal();
    }
    if (event.target === editContactModal) {
        closeEditModal();
    }
});

function renderQRPanel() {
    // Hide chat messages and admin chat form
    chatMessages.style.display = 'none';
    if (adminChatForm) adminChatForm.style.display = 'none';
    // Update the right panel header
    const rightPanelHeader = document.querySelector('.right-panel .panel-header h2');
    if (rightPanelHeader) rightPanelHeader.textContent = 'WhatsApp Authentication Login';
    // Remove any existing QR panel
    let qrPanel = document.getElementById('qr-panel');
    if (qrPanel) qrPanel.remove();
    // Create QR panel
    qrPanel = document.createElement('div');
    qrPanel.id = 'qr-panel';
    qrPanel.style.display = 'flex';
    qrPanel.style.flexDirection = 'column';
    qrPanel.style.alignItems = 'center';
    qrPanel.style.justifyContent = 'center';
    qrPanel.style.height = '100%';
    qrPanel.style.padding = '40px 0';
    qrPanel.innerHTML = `
        <div style="font-size: 22px; color: #333; margin-bottom: 24px; text-align: center;">Scan this QR code with your WhatsApp mobile app to log in</div>
        <img src="${currentQR}" alt="WhatsApp QR Code" style="width: 280px; height: 280px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); margin-bottom: 16px; background: white;" />
        <div style="color: #888; font-size: 14px; text-align: center;">Open WhatsApp &gt; Menu &gt; Linked Devices &gt; Scan QR Code</div>
    `;
    chatMessages.parentElement.insertBefore(qrPanel, chatMessages);
}

function hideQRPanel() {
    let qrPanel = document.getElementById('qr-panel');
    if (qrPanel) qrPanel.remove();
    chatMessages.style.display = '';
    if (adminChatForm) adminChatForm.style.display = '';
    // Restore the right panel header
    const rightPanelHeader = document.querySelector('.right-panel .panel-header h2');
    if (rightPanelHeader) rightPanelHeader.textContent = 'Chat History';
} 