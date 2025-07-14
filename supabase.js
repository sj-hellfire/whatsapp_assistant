const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Contact operations
const contactOperations = {
    // Get all contacts
    async getAllContacts() {
        try {
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .order('name', { ascending: true });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching contacts:', error);
            return [];
        }
    },

    // Get contact by WhatsApp ID
    async getContactById(whatsappId) {
        try {
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .eq('whatsapp_id', whatsappId)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching contact:', error);
            return null;
        }
    },

    // Create or update contact
    async upsertContact(contactData) {
        try {
            const { data, error } = await supabase
                .from('contacts')
                .upsert(contactData, { 
                    onConflict: 'whatsapp_id',
                    ignoreDuplicates: false 
                })
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error upserting contact:', error);
            return null;
        }
    },

    // Update contact name
    async updateContactName(whatsappId, name) {
        try {
            const { data, error } = await supabase
                .from('contacts')
                .update({ 
                    name: name,
                    updated_at: new Date().toISOString()
                })
                .eq('whatsapp_id', whatsappId)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating contact name:', error);
            return null;
        }
    },

    // Get allowed contacts for API
    async getAllowedContacts() {
        try {
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .eq('is_allowed', true)
                .order('name', { ascending: true });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching allowed contacts:', error);
            return [];
        }
    },

    // Initialize contacts from config (run once)
    async initializeContactsFromConfig(allowedContacts) {
        try {
            const contacts = allowedContacts.map(whatsappId => ({
                whatsapp_id: whatsappId,
                phone_number: whatsappId.replace('@c.us', ''),
                name: whatsappId.replace('@c.us', ''),
                is_allowed: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            const { data, error } = await supabase
                .from('contacts')
                .upsert(contacts, { 
                    onConflict: 'whatsapp_id',
                    ignoreDuplicates: false 
                })
                .select();
            
            if (error) throw error;
            console.log(`✅ Initialized ${data.length} contacts in Supabase`);
            return data;
        } catch (error) {
            console.error('Error initializing contacts:', error);
            return [];
        }
    },

    // Get gemini chat history for a contact
    async getGeminiChatHistory(whatsappId) {
        try {
            const { data, error } = await supabase
                .from('contacts')
                .select('gemini_chat_history')
                .eq('whatsapp_id', whatsappId)
                .single();
            if (error) throw error;
            return data ? data.gemini_chat_history : null;
        } catch (error) {
            console.error('Error fetching gemini chat history:', error);
            return null;
        }
    },

    // Set gemini chat history for a contact
    async setGeminiChatHistory(whatsappId, history) {
        try {
            const { data, error } = await supabase
                .from('contacts')
                .update({ gemini_chat_history: history, updated_at: new Date().toISOString() })
                .eq('whatsapp_id', whatsappId)
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error setting gemini chat history:', error);
            return null;
        }
    }
};

module.exports = { supabase, contactOperations }; 