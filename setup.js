const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🤖 WhatsApp AI Assistant Setup\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
    console.log('📝 Creating .env file...');
    
    rl.question('Enter your Google Gemini API key: ', (apiKey) => {
        if (!apiKey.trim()) {
            console.log('❌ API key is required!');
            rl.close();
            return;
        }

        const envContent = `GEMINI_API_KEY=${apiKey.trim()}`;
        fs.writeFileSync('.env', envContent);
        console.log('✅ .env file created successfully!');
        
        setupContacts();
    });
} else {
    console.log('✅ .env file already exists');
    setupContacts();
}

function setupContacts() {
    console.log('\n📱 Contact Configuration');
    console.log('You can add allowed contacts now or later by editing config.js');
    
    rl.question('Do you want to add contacts now? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            addContacts();
        } else {
            console.log('\n🎉 Setup complete!');
            console.log('\nNext steps:');
            console.log('1. Add contact numbers to config.js');
            console.log('2. Run: npm start');
            console.log('3. Scan the QR code with your WhatsApp app');
            rl.close();
        }
    });
}

function addContacts() {
    const contacts = [];
    
    function addContact() {
        rl.question('\nEnter phone number (with country code, no spaces): ', (phone) => {
            if (!phone.trim()) {
                finishSetup(contacts);
                return;
            }
            
            // Format the phone number
            let formattedPhone = phone.trim().replace(/[^0-9]/g, '');
            if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
                formattedPhone = '1' + formattedPhone; // Add US country code if missing
            }
            
            const contactId = `${formattedPhone}@c.us`;
            contacts.push(contactId);
            console.log(`✅ Added: ${contactId}`);
            
            addContact();
        });
    }
    
    addContact();
}

function finishSetup(contacts) {
    console.log('\n📝 Updating config.js...');
    
    // Read current config
    let configContent = fs.readFileSync('config.js', 'utf8');
    
    // Update allowed contacts
    const contactsString = contacts.map(c => `        '${c}'`).join(',\n');
    configContent = configContent.replace(
        /allowedContacts: \[\s*\],/,
        `allowedContacts: [\n${contactsString}\n    ],`
    );
    
    fs.writeFileSync('config.js', configContent);
    
    console.log('✅ Configuration updated!');
    console.log('\n🎉 Setup complete!');
    console.log('\nNext steps:');
    console.log('1. Run: npm start');
    console.log('2. Scan the QR code with your WhatsApp app');
    console.log('3. Start chatting with your AI assistant!');
    
    rl.close();
} 