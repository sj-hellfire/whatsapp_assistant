# WhatsApp AI Assistant

A powerful AI assistant for WhatsApp that uses Google's Gemini AI to provide intelligent responses to messages. The assistant runs in the background and responds to messages from authorized contacts automatically.

## Features

- 🤖 **AI-Powered Responses**: Uses Google Gemini AI for intelligent conversations
- 📱 **WhatsApp Integration**: Seamless integration with WhatsApp Web
- 🔒 **Secure Web Interface**: Protected by login authentication
- 📊 **Real-time Logs**: Live activity monitoring and chat history
- 🖼️ **Media Support**: Handles images, videos, and other media files
- 👥 **Contact Management**: Only responds to authorized contacts
- 💬 **Chat Sessions**: Maintains conversation context for each user
- 🎨 **Modern UI**: Clean, responsive web interface

## Security Features

- **Login Protection**: Web interface is protected behind a secure login system
- **Session Management**: Secure session handling with configurable timeouts
- **Environment Variables**: Credentials stored securely in environment variables
- **Access Control**: Only authorized users can access the web interface

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd whatsapp_assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ADMIN_USERNAME=your_username
   ADMIN_PASSWORD=your_secure_password
   SESSION_SECRET=your_session_secret_key
   ```

4. **Configure allowed contacts**
   Edit `config.js` and add your allowed contact numbers:
   ```javascript
   allowedContacts: [
       '1234567890@c.us',  // Include country code, no spaces
   ]
   ```

5. **Start the assistant**
   ```bash
   npm start
   ```

6. **Access the web interface**
   - Open your browser and go to `http://localhost:3000`
   - You'll be redirected to the login page
   - Enter your credentials (default: admin/password123)
   - Scan the QR code with WhatsApp to authenticate

## Login System

The web interface is protected by a secure login system:

- **Default Credentials**: 
  - Username: `admin`
  - Password: `password123`
- **Customization**: Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in your `.env` file
- **Session Duration**: 24 hours (configurable)
- **Security**: Sessions are managed securely with express-session

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Required |
| `ADMIN_USERNAME` | Login username | `admin` |
| `ADMIN_PASSWORD` | Login password | `password123` |
| `SESSION_SECRET` | Session encryption key | `your-secret-key-change-this` |
| `PORT` | Server port | `3000` |

### Allowed Contacts

Add phone numbers to `config.js` in the format: `'countrycode_number@c.us'`

Example:
```javascript
allowedContacts: [
    '1234567890@c.us',  // US number (123) 456-7890
    '919876543210@c.us' // Indian number +91 98765 43210
]
```

## Usage

### Web Interface

1. **Login**: Enter your credentials to access the interface
2. **Monitor Logs**: View real-time activity logs on the left panel
3. **Chat History**: See conversation history on the right panel
4. **Status Monitoring**: Check WhatsApp and web connection status
5. **Logout**: Click the logout button when done

### WhatsApp Integration

1. **Authentication**: Scan QR code with WhatsApp mobile app
2. **Automatic Responses**: AI responds to messages from allowed contacts
3. **Media Support**: Handles images, videos, and other media
4. **Context Awareness**: Maintains conversation context per user

## API Endpoints

- `GET /` - Main interface (requires authentication)
- `GET /login` - Login page
- `POST /login` - Login form submission
- `GET /logout` - Logout and clear session

## Troubleshooting

### Common Issues

1. **Login Issues**
   - Check your credentials in `.env` file
   - Clear browser cookies if session issues occur

2. **WhatsApp Connection**
   - Ensure WhatsApp mobile app is connected to internet
   - Try refreshing the QR code if authentication fails

3. **AI Responses**
   - Verify your Gemini API key is valid
   - Check API usage limits in Google AI Studio

### Status Indicators

- **Web: Online/Offline** - Browser connection to server
- **WhatsApp: Ready/Authenticating/Offline** - WhatsApp client status

## Security Considerations

- Change default credentials immediately
- Use strong passwords
- Keep your `.env` file secure and never commit it to version control
- Consider using HTTPS in production
- Regularly update dependencies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## File Structure

```
whatsapp_assistant/
├── public/                 # Web interface files
│   ├── index.html         # Main HTML page
│   ├── styles.css         # CSS styles
│   └── script.js          # Frontend JavaScript
├── server.js              # Express server and WhatsApp client
├── config.js              # Configuration settings
├── setup.js               # Interactive setup script
├── check-status.js        # Status checking utility
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (create this)
└── README.md              # This file
```

## Dependencies

- **whatsapp-web.js**: WhatsApp Web API client
- **@google/generative-ai**: Google Gemini API client
- **express**: Web server framework
- **socket.io**: Real-time communication
- **qrcode**: QR code generation
- **dotenv**: Environment variable management

## Development

### Running in Development Mode
```bash
npm run dev
```

### Checking Status
```bash
npm run status
```

### Updating Configuration
```bash
npm run setup
```

## Security Notes

- Keep your Google Gemini API key secure
- Only add trusted contacts to the allowlist
- The WhatsApp session is stored locally
- Logs may contain sensitive information

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs in the web interface
3. Check the terminal output for errors
4. Ensure all dependencies are up to date

# WhatsApp AI Assistant Demo

This is a static demo of the WhatsApp AI Assistant interface, designed to be hosted on GitHub Pages.

## Live Demo

Visit the live demo: [https://sj-hellfire.github.io/whatsapp_assistant_demo/](https://sj-hellfire.github.io/whatsapp_assistant_demo/)

## Features

- **Real-time Interface Simulation**: Shows how the actual WhatsApp AI Assistant interface looks and feels
- **Animated Messages**: Messages appear one by one with realistic timing
- **Interactive Elements**: All buttons and controls are functional (demo mode)
- **Responsive Design**: Works on desktop and mobile devices
- **No Backend Required**: Completely static website

## Demo Features Shown

- ✅ Real-time logs with timestamps
- ✅ Live chat history
- ✅ Status indicators
- ✅ Interactive buttons
- ✅ Export functionality

## GitHub Pages Deployment

This demo is designed to be hosted on GitHub Pages. To deploy:

1. **Create a new repository** on GitHub named `whatsapp_assistant_demo`
2. **Upload these files** to the repository:
   - `index.html`
   - `styles.css`
   - `README.md`
3. **Enable GitHub Pages**:
   - Go to repository Settings
   - Scroll to "Pages" section
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click "Save"
4. **Wait for deployment** (usually takes a few minutes)
5. **Access your demo** at: `https://sj-hellfire.github.io/whatsapp_assistant_demo/`

## File Structure

```
demo/
├── index.html      # Main demo page
├── styles.css      # Styling for the demo
└── README.md       # This file
```

## How It Works

The demo simulates the WhatsApp AI Assistant interface with:

- **Static Data**: All messages and logs are pre-defined
- **JavaScript Animation**: Messages appear with realistic timing
- **CSS Styling**: Identical appearance to the real application
- **No Backend**: Completely client-side for easy hosting

## Customization

You can customize the demo by:

- Editing `index.html` to change messages or timing
- Modifying `styles.css` to adjust appearance
- Adding more interactive elements
- Changing the demo content

## Local Testing

To test locally before deploying:

1. Open `index.html` in a web browser
2. Or use a local server: `python -m http.server 8000`
3. Visit `http://localhost:8000`

## Repository Setup Commands

If you prefer command line setup:

```bash
# Create new repository locally
mkdir whatsapp_assistant_demo
cd whatsapp_assistant_demo

# Copy demo files
cp -r ../demo/* .

# Initialize git and push
git init
git add .
git commit -m "Initial demo commit"
git branch -M main
git remote add origin https://github.com/sj-hellfire/whatsapp_assistant_demo.git
git push -u origin main
```

Then enable GitHub Pages in the repository settings as described above.

## Support

This demo is part of the WhatsApp AI Assistant project. For the full application with actual WhatsApp integration, see the main repository. 