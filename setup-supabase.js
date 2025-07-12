const { contactOperations } = require('./supabase.js');
const config = require('./config.js');

async function setupSupabase() {
    console.log('🚀 Setting up Supabase database...');
    
    try {
        // Check if Supabase is configured
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            console.error('❌ Supabase credentials not found!');
            console.log('Please add to your .env file:');
            console.log('SUPABASE_URL=https://your-project-id.supabase.co');
            console.log('SUPABASE_ANON_KEY=your-anon-key-here');
            process.exit(1);
        }

        // Initialize contacts from config
        console.log('📞 Initializing contacts from config...');
        const contacts = await contactOperations.initializeContactsFromConfig(config.allowedContacts);
        
        if (contacts && contacts.length > 0) {
            console.log(`✅ Successfully initialized ${contacts.length} contacts:`);
            contacts.forEach(contact => {
                console.log(`   - ${contact.name} (${contact.phone_number})`);
            });
        } else {
            console.log('⚠️  No contacts were initialized. Check your config.js file.');
        }

        // Test fetching contacts
        console.log('\n🔍 Testing contact retrieval...');
        const allContacts = await contactOperations.getAllContacts();
        console.log(`📊 Total contacts in database: ${allContacts.length}`);
        
        const allowedContacts = await contactOperations.getAllowedContacts();
        console.log(`✅ Allowed contacts: ${allowedContacts.length}`);

        console.log('\n🎉 Supabase setup completed successfully!');
        console.log('You can now start your WhatsApp AI Assistant server.');
        
    } catch (error) {
        console.error('❌ Error setting up Supabase:', error.message);
        console.log('\nTroubleshooting:');
        console.log('1. Check your Supabase credentials in .env file');
        console.log('2. Make sure the contacts table exists in your Supabase database');
        console.log('3. Run the SQL setup script from SUPABASE_SETUP.md');
        process.exit(1);
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    setupSupabase();
}

module.exports = { setupSupabase }; 