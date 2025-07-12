const express = require('express');
const { contactOperations, supabase } = require('../../supabase');
const { asyncHandler, validateRequired, sanitizeAndValidate, ValidationError } = require('../middleware/errorHandler');

const router = express.Router();

// API endpoint to get allowed contacts for the admin dropdown
router.get('/allowed-contacts', asyncHandler(async (req, res) => {
    const contacts = await contactOperations.getAllowedContacts();
    // Return as array of objects: [{id, number, name}]
    const formattedContacts = contacts.map(contact => ({
        id: contact.whatsapp_id,
        number: contact.phone_number,
        name: contact.name
    }));
    res.json({ contacts: formattedContacts });
}));

// API endpoint to get all contacts for admin management
router.get('/contacts', asyncHandler(async (req, res) => {
    const contacts = await contactOperations.getAllContacts();
    res.json({ contacts });
}));

// API endpoint to update contact details
router.put('/contacts/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, is_allowed } = req.body;
    
    // Validate input
    validateRequired(['name'], req.body);
    
    const sanitizedData = sanitizeAndValidate(req.body, {
        name: { type: 'string', required: true, maxLength: 100 },
        is_allowed: { type: 'boolean' }
    });
    
    const updatedContact = await contactOperations.upsertContact({
        whatsapp_id: id,
        phone_number: id.replace('@c.us', ''),
        name: sanitizedData.name,
        is_allowed: sanitizedData.is_allowed !== undefined ? sanitizedData.is_allowed : true
    });
    
    res.json({ contact: updatedContact });
}));

// API endpoint to delete contact
router.delete('/contacts/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        throw new ValidationError('Contact ID is required');
    }
    
    const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('whatsapp_id', id);
    
    if (error) throw error;
    
    res.json({ success: true, message: 'Contact deleted successfully' });
}));

module.exports = router; 