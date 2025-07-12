const fs = require('fs');
const path = require('path');

console.log('🔍 WhatsApp AI Assistant - Status Check\n');

// Check if .env file exists
const envExists = fs.existsSync('.env');
console.log(`📄 .env file: ${envExists ? '✅ Found' : '❌ Missing'}`);

if (envExists) {
    const envContent = fs.readFileSync('.env', 'utf8');
    const hasApiKey = envContent.includes('GEMINI_API_KEY=');
    console.log(`🔑 Google Gemini API Key: ${hasApiKey ? '✅ Configured' : '❌ Missing'}`);
}

// Check if config.js exists
const configExists = fs.existsSync('config.js');
console.log(`⚙️  config.js: ${configExists ? '✅ Found' : '❌ Missing'}`);

if (configExists) {
    try {
        const config = require('./config');
        const contactCount = config.allowedContacts.length;
        console.log(`📱 Allowed contacts: ${contactCount} ${contactCount > 0 ? '✅' : '⚠️  None configured'}`);
    } catch (error) {
        console.log(`❌ Error reading config: ${error.message}`);
    }
}

// Check if public directory exists
const publicExists = fs.existsSync('public');
console.log(`🌐 Public directory: ${publicExists ? '✅ Found' : '❌ Missing'}`);

if (publicExists) {
    const files = ['index.html', 'styles.css', 'script.js'];
    files.forEach(file => {
        const fileExists = fs.existsSync(path.join('public', file));
        console.log(`   ${file}: ${fileExists ? '✅' : '❌'}`);
    });
}

// Check if node_modules exists
const nodeModulesExists = fs.existsSync('node_modules');
console.log(`📦 node_modules: ${nodeModulesExists ? '✅ Found' : '❌ Missing'}`);

// Check if package.json exists
const packageExists = fs.existsSync('package.json');
console.log(`📋 package.json: ${packageExists ? '✅ Found' : '❌ Missing'}`);

console.log('\n📋 Summary:');
console.log('1. Run "npm run setup" to configure the application');
console.log('2. Run "npm start" to start the web server');
console.log('3. Open http://localhost:3000 in your browser');
console.log('4. Scan the QR code with your WhatsApp mobile app');
console.log('\n🤖 Happy chatting!'); 