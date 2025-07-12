# WhatsApp AI Assistant

A powerful AI assistant for WhatsApp that uses Google's Gemini AI to provide intelligent responses to messages. The assistant runs in the background and responds to messages from authorized contacts automatically, with optional Supabase database integration for contact management.

## Features

- 🤖 **AI-Powered Responses**: Uses Google Gemini AI for intelligent conversations
- 📱 **WhatsApp Integration**: Seamless integration with WhatsApp Web
- 🔒 **Secure Web Interface**: Protected by login authentication
- 📊 **Real-time Logs**: Live activity monitoring and chat history
- 🖼️ **Media Support**: Handles images, videos, and other media files
- 👥 **Contact Management**: Only responds to authorized contacts
- 💬 **Chat Sessions**: Maintains conversation context for each user
- 🎨 **Modern UI**: Clean, responsive web interface
- 🗄️ **Database Integration**: Optional Supabase integration for contact persistence
- 📈 **Analytics**: Track message counts and contact activity

## Prerequisites

- Node.js (v16 or higher)
- A Google Gemini API key
- WhatsApp mobile app installed on your phone
- A modern web browser
- (Optional) Supabase account for database features

## Quick Start

### Step 1: Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd whatsapp_assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### Step 2: Environment Setup

Create a `.env` file in the root directory:

```env
# Required: Your Google Gemini API key
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Custom login credentials (default: admin/password123)
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_secure_password

# Optional: Session secret for security (change this!)
SESSION_SECRET=your_random_session_secret

# Optional: Custom port (default: 3000)
PORT=3000

# Optional: Supabase Configuration (for database features)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

#### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key to your `.env` file

### Step 3: Configure Allowed Contacts

Edit `config.js` and add the phone numbers of contacts who can interact with your AI:

```javascript
allowedContacts: [
    '1234567890@c.us',  // US number (123) 456-7890
    '919876543210@c.us' // Indian number +91 98765 43210
]
```

**Important:** 
- Include country code
- No spaces or special characters
- Add `@c.us` suffix
- Only these contacts will receive AI responses

### Step 4: Start the Assistant

```bash
npm start
```

You should see output like:
```
Web server started on http://localhost:3000
Starting WhatsApp client...
Make sure you have set your GEMINI_API_KEY in the .env file
Allowed contacts: 2
```

### Step 5: Access the Web Interface

1. **Open your browser** and go to `http://localhost:3000`
2. **You'll be redirected to the login page**
3. **Enter your credentials:**
   - Username: `admin` (or your custom username)
   - Password: `password123` (or your custom password)
4. **Click "Login"**

### Step 6: Authenticate WhatsApp

1. **Scan the QR code** with your WhatsApp mobile app:
   - Open WhatsApp on your phone
   - Go to Settings → Linked Devices
   - Tap "Link a Device"
   - Scan the QR code shown in the web interface

2. **Wait for authentication** - you'll see status updates in the logs

3. **Verify connection** - the status should show "WhatsApp: Ready"

### Step 7: Test the Assistant

1. **Send a message** from one of your allowed contacts to your WhatsApp number
2. **Check the web interface** - you should see:
   - The message logged in the left panel
   - The AI response in the chat history
   - Status updates showing the conversation

## Database Integration (Optional)

### Supabase Setup

For enhanced contact management and persistence, you can integrate with Supabase:

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Sign up/Login and create a new project
   - Note down your project URL and anon key

2. **Set up Database Table**
   Run this SQL in your Supabase SQL Editor:
   ```sql
   -- Create contacts table
   CREATE TABLE contacts (
       id BIGSERIAL PRIMARY KEY,
       whatsapp_id TEXT UNIQUE NOT NULL,
       phone_number TEXT NOT NULL,
       name TEXT NOT NULL,
       is_allowed BOOLEAN DEFAULT false,
       last_message_at TIMESTAMP WITH TIME ZONE,
       message_count INTEGER DEFAULT 0,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create indexes and triggers (see SUPABASE_SETUP.md for full SQL)
   ```

3. **Initialize Contacts**
   ```bash
   node setup-supabase.js
   ```

4. **Add Supabase credentials** to your `.env` file:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Required |
| `ADMIN_USERNAME` | Login username | `admin` |
| `ADMIN_PASSWORD` | Login password | `password123` |
| `SESSION_SECRET` | Session encryption key | `your-secret-key-change-this` |
| `PORT` | Server port | `3000` |
| `SUPABASE_URL` | Supabase project URL | Optional |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Optional |

### Allowed Contacts

Add phone numbers to `config.js` in the format: `'countrycode_number@c.us'`

Example:
```javascript
allowedContacts: [
    '1234567890@c.us',  // US number (123) 456-7890
    '919876543210@c.us' // Indian number +91 98765 43210
]
```

### AI Configuration

Customize the AI behavior in `config.js`:

```javascript
botConfig: {
    systemPrompt: `You are a helpful AI assistant...`,
    unauthorizedMessage: "Sorry, I'm not authorized to respond...",
    errorMessage: "Sorry, I am having trouble connecting...",
    timeoutMessage: "I'm taking a bit longer than usual..."
}
```

## Usage

### Web Interface

1. **Login**: Enter your credentials to access the interface
2. **Monitor Logs**: View real-time activity logs on the left panel
3. **Chat History**: See conversation history on the right panel
4. **Status Monitoring**: Check WhatsApp and web connection status
5. **Contact Management**: View and manage contacts (if using Supabase)
6. **Logout**: Click the logout button when done

### WhatsApp Integration

1. **Authentication**: Scan QR code with WhatsApp mobile app
2. **Automatic Responses**: AI responds to messages from allowed contacts
3. **Media Support**: Handles images, videos, and other media
4. **Context Awareness**: Maintains conversation context per user

### Available Scripts

```bash
npm start          # Start the assistant
npm run setup      # Interactive setup script
npm run status     # Check system status
```

## API Endpoints

- `GET /` - Main interface (requires authentication)
- `GET /login` - Login page
- `POST /login` - Login form submission
- `GET /logout` - Logout and clear session
- `GET /api/allowed-contacts` - Returns allowed contacts (with Supabase)
- `GET /api/contacts` - Returns all contacts (with Supabase)
- `PUT /api/contacts/:id` - Update contact details (with Supabase)

## Troubleshooting

### Common Issues

**Login Problems:**
- Check your credentials in `.env` file
- Clear browser cookies if session issues occur
- Ensure you're using the correct username/password

**WhatsApp Connection:**
- Make sure WhatsApp mobile app is connected to internet
- Try refreshing the QR code if authentication fails
- Check that WhatsApp Web isn't already logged in elsewhere

**AI Not Responding:**
- Verify your Gemini API key is correct
- Check API usage limits in Google AI Studio
- Ensure the contact is in the allowed list

**Web Interface Issues:**
- Check if port 3000 is available
- Ensure all dependencies are installed
- Check terminal for error messages

**Supabase Issues:**
- Check SUPABASE_URL and SUPABASE_ANON_KEY
- Verify project is active in Supabase dashboard
- Run the SQL setup script if tables are missing

### Status Indicators

- **Web: Online/Offline** - Your browser connection to the server
- **WhatsApp: Ready/Authenticating/Offline** - WhatsApp client status

### Getting Help

1. **Check the logs** in the web interface for error messages
2. **Verify your configuration** in `.env` and `config.js`
3. **Restart the application** if needed
4. **Check terminal output** for detailed error messages

## Security Features

### Login Protection
- The web interface is protected by a secure login system
- Default credentials: `admin` / `password123`
- Change these immediately in your `.env` file
- Sessions last 24 hours by default

### Access Control
- Only authorized contacts can interact with the AI
- Web interface requires authentication
- All activity is logged for monitoring

### Security Recommendations

- ✅ Change default login credentials immediately
- ✅ Use strong, unique passwords
- ✅ Keep your `.env` file secure
- ✅ Never commit credentials to version control
- ✅ Consider using HTTPS in production
- ✅ Regularly update dependencies
- ✅ Monitor logs for suspicious activity

## File Structure

```
whatsapp_assistant/
├── public/                 # Web interface files
│   ├── index.html         # Main HTML page
│   ├── styles.css         # CSS styles
│   └── js/                # Frontend JavaScript
├── src/                   # Source code
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
├── server.js              # Express server and WhatsApp client
├── config.js              # Configuration settings
├── setup.js               # Interactive setup script
├── setup-supabase.js      # Supabase initialization
├── supabase.js            # Supabase integration
├── check-status.js        # Status checking utility
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (create this)
├── README.md              # This file
└── SUPABASE_SETUP.md      # Supabase setup guide
```

## Dependencies

- **whatsapp-web.js**: WhatsApp Web API client
- **@google/generative-ai**: Google Gemini API client
- **@supabase/supabase-js**: Supabase database client
- **express**: Web server framework
- **socket.io**: Real-time communication
- **qrcode**: QR code generation
- **dotenv**: Environment variable management
- **express-session**: Session management

## Development

### Running in Development Mode
```bash
npm start
```

### Checking Status
```bash
npm run status
```

### Updating Configuration
```bash
npm run setup
```

### Testing Supabase Connection
```bash
node -e "const { contactOperations } = require('./supabase.js'); contactOperations.getAllContacts().then(console.log)"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the logs in the web interface
3. Check the terminal output for errors
4. Ensure all dependencies are up to date
5. Verify your configuration is correct

Happy chatting with your AI assistant! 🤖 