// Contact Manager Module
class ContactManager {
    constructor() {
        this.contacts = [];
        this.adminChatTo = document.getElementById('admin-chat-to');
        this.contactsList = document.getElementById('contacts-list');
        this.addContactForm = document.getElementById('add-contact-form');
        this.editContactForm = document.getElementById('edit-contact-form');
        this.contactModal = document.getElementById('contact-modal');
        this.editContactModal = document.getElementById('edit-contact-modal');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadContacts();
    }

    setupEventListeners() {
        // Add contact form
        this.addContactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddContact();
        });

        // Edit contact form
        this.editContactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleUpdateContact();
        });

        // Delete contact button
        document.getElementById('delete-contact-btn').addEventListener('click', async () => {
            await this.handleDeleteContact();
        });

        // Modal close buttons
        document.getElementById('close-contact-modal').addEventListener('click', () => {
            this.closeContactModal();
        });

        document.getElementById('close-edit-modal').addEventListener('click', () => {
            this.closeEditModal();
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.contactModal) {
                this.closeContactModal();
            }
            if (e.target === this.editContactModal) {
                this.closeEditModal();
            }
        });
    }

    async loadContacts() {
        try {
            const response = await fetch('/api/contacts');
            const data = await response.json();
            
            if (response.ok) {
                this.contacts = data.contacts;
                this.renderContactsList();
                this.populateAdminDropdown();
            } else {
                Utils.showNotification('Failed to load contacts', 'error');
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
            Utils.showNotification('Error loading contacts', 'error');
        }
    }

    async handleAddContact() {
        const phoneInput = document.getElementById('new-contact-phone');
        const nameInput = document.getElementById('new-contact-name');
        
        const phone = Utils.sanitizeInput(phoneInput.value);
        const name = Utils.sanitizeInput(nameInput.value);
        
        if (!phone || !name) {
            Utils.showNotification('Please fill in all fields', 'warning');
            return;
        }
        
        if (!Utils.isValidPhoneNumber(phone)) {
            Utils.showNotification('Please enter a valid phone number', 'warning');
            return;
        }
        
        try {
            const whatsappId = phone.replace(/\D/g, '') + '@c.us';
            
            const response = await fetch('/api/contacts/' + encodeURIComponent(whatsappId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    is_allowed: true
                })
            });
            
            if (response.ok) {
                Utils.showNotification('Contact added successfully', 'success');
                phoneInput.value = '';
                nameInput.value = '';
                await this.loadContacts();
            } else {
                const errorData = await response.json();
                Utils.showNotification(errorData.error?.message || 'Failed to add contact', 'error');
            }
        } catch (error) {
            console.error('Error adding contact:', error);
            Utils.showNotification('Error adding contact', 'error');
        }
    }

    async handleUpdateContact() {
        const contactId = document.getElementById('edit-contact-id').value;
        const name = Utils.sanitizeInput(document.getElementById('edit-contact-name').value);
        
        if (!name) {
            Utils.showNotification('Please enter a name', 'warning');
            return;
        }
        
        try {
            const response = await fetch('/api/contacts/' + encodeURIComponent(contactId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    is_allowed: true
                })
            });
            
            if (response.ok) {
                Utils.showNotification('Contact updated successfully', 'success');
                this.closeEditModal();
                await this.loadContacts();
                
                // Update contact name in chat if chat manager exists
                if (window.chatManager) {
                    window.chatManager.refreshContactNamesInChat(contactId, name);
                }
            } else {
                const errorData = await response.json();
                Utils.showNotification(errorData.error?.message || 'Failed to update contact', 'error');
            }
        } catch (error) {
            console.error('Error updating contact:', error);
            Utils.showNotification('Error updating contact', 'error');
        }
    }

    async handleDeleteContact() {
        const contactId = document.getElementById('edit-contact-id').value;
        
        if (!confirm('Are you sure you want to delete this contact?')) {
            return;
        }
        
        try {
            const response = await fetch('/api/contacts/' + encodeURIComponent(contactId), {
                method: 'DELETE'
            });
            
            if (response.ok) {
                Utils.showNotification('Contact deleted successfully', 'success');
                this.closeEditModal();
                await this.loadContacts();
                
                // Remove contact from chat if chat manager exists
                if (window.chatManager) {
                    window.chatManager.removeContactFromChat(contactId);
                }
            } else {
                const errorData = await response.json();
                Utils.showNotification(errorData.error?.message || 'Failed to delete contact', 'error');
            }
        } catch (error) {
            console.error('Error deleting contact:', error);
            Utils.showNotification('Error deleting contact', 'error');
        }
    }

    renderContactsList() {
        if (this.contacts.length === 0) {
            this.contactsList.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No contacts found</div>';
            return;
        }
        
        const contactsHtml = this.contacts
            .filter(contact => contact.is_allowed)
            .map(contact => `
                <div class="contact-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee;">
                    <div>
                        <div style="font-weight: 600; color: #333;">${Utils.escapeHtml(contact.name)}</div>
                        <div style="font-size: 12px; color: #666;">${contact.phone_number}</div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="contactManager.openEditModal('${contact.whatsapp_id}', '${contact.name}', '${contact.phone_number}')" 
                                class="btn" style="background: #007bff; color: white; padding: 6px 12px; font-size: 12px;">
                            Edit
                        </button>
                        <button onclick="contactManager.clearHistory('${contact.whatsapp_id}')"
                                class="btn" style="background: #dc3545; color: white; padding: 6px 12px; font-size: 12px;">
                            Clear History
                        </button>
                    </div>
                </div>
            `).join('');
        
        this.contactsList.innerHTML = contactsHtml;
    }

    populateAdminDropdown() {
        // Clear existing options except the first one
        while (this.adminChatTo.children.length > 1) {
            this.adminChatTo.removeChild(this.adminChatTo.lastChild);
        }
        
        // Add allowed contacts
        this.contacts
            .filter(contact => contact.is_allowed)
            .forEach(contact => {
                const option = document.createElement('option');
                option.value = contact.whatsapp_id;
                option.textContent = `${contact.name} (${contact.phone_number})`;
                this.adminChatTo.appendChild(option);
            });
    }

    openEditModal(whatsappId, name, phone) {
        document.getElementById('edit-contact-id').value = whatsappId;
        document.getElementById('edit-contact-phone').value = phone;
        document.getElementById('edit-contact-name').value = name;
        this.editContactModal.style.display = 'block';
    }

    closeEditModal() {
        this.editContactModal.style.display = 'none';
    }

    openContactModal() {
        this.contactModal.style.display = 'block';
    }

    closeContactModal() {
        this.contactModal.style.display = 'none';
    }

    getContactNameById(id) {
        const contact = this.contacts.find(c => c.whatsapp_id === id);
        return contact ? contact.name : null;
    }

    refreshContactNames() {
        this.populateAdminDropdown();
        // Update contact names in chat if chat manager exists
        if (window.chatManager) {
            this.contacts.forEach(contact => {
                if (contact.is_allowed) {
                    window.chatManager.refreshContactNamesInChat(contact.whatsapp_id, contact.name);
                }
            });
        }
    }

    // Add clearHistory method
    async clearHistory(whatsappId) {
        if (!confirm('Are you sure you want to clear this user\'s chat history?')) {
            return;
        }
        try {
            const response = await fetch(`/api/contacts/${encodeURIComponent(whatsappId)}/clear-history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                Utils.showNotification('Chat history cleared successfully', 'success');
            } else {
                const errorData = await response.json();
                Utils.showNotification(errorData.error?.message || 'Failed to clear chat history', 'error');
            }
        } catch (error) {
            console.error('Error clearing chat history:', error);
            Utils.showNotification('Error clearing chat history', 'error');
        }
    }
}

// Export for global use
window.ContactManager = ContactManager; 