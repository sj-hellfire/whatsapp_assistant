// Configuration file for WhatsApp AI Assistant

module.exports = {
    // Google Gemini Configuration
    gemini: {
        model: "gemini-1.5-flash", // You can change to "gemini-1.5-pro" for better responses
        maxTokens: 500,
        temperature: 0.7,
    },

    // Allowed contacts - Add phone numbers here
    // Format: 'phone_number@c.us' (include country code, no spaces or special characters)
    allowedContacts: [
        // Example: '1234567890@c.us' for US number (123) 456-7890
        // Add your allowed contact numbers here
        '917057315245@c.us',
        '919354731519@c.us',
    ],

    // Bot personality and behavior
    botConfig: {
        // System prompt for the AI
        systemPrompt: `You are a helpful AI assistant responding to WhatsApp messages. 
        Keep your responses concise, friendly, and helpful. 
        If the message is not in English, respond in the same language as the user's message.
        Be conversational and engaging while maintaining professionalism.
        
        When users send images, videos, or other media along with text, analyze both the media content and the text message to provide a comprehensive response. If the user only sends media without text, describe what you see and ask relevant questions.
        
        IMPORTANT: Use WhatsApp text formatting only:
        - *text* for bold
        - _text_ for italics  
        - ~text~ for strikethrough
        - \`text\` for monospace/code
        
        Do NOT use markdown formatting like **bold** or __italics__. Only use WhatsApp's native text formatting.
        Keep responses natural and conversational while using WhatsApp formatting when appropriate.`,

        // Response when unauthorized contact messages
        unauthorizedMessage: "Sorry, I'm not authorized to respond to messages from this contact.",

        // Error message when AI service is unavailable
        errorMessage: "Sorry, I am having trouble connecting to my AI service right now. Please try again later.",

        // Message when processing takes too long
        timeoutMessage: "I'm taking a bit longer than usual to respond. Please wait...",
    },

    // WhatsApp Web.js Configuration
    whatsapp: {
        // Puppeteer options for better compatibility with cloud environments
        puppeteer: {
            headless: true,
            timeout: 60000, // 60 second timeout
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                // Additional flags for cloud environments
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--disable-default-apps',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-sync',
                '--disable-translate',
                '--hide-scrollbars',
                '--mute-audio',
                '--no-default-browser-check',
                '--safebrowsing-disable-auto-update',
                '--disable-client-side-phishing-detection',
                '--disable-component-update',
                '--disable-domain-reliability',
                '--disable-features=AudioServiceOutOfProcess',
                '--disable-hang-monitor',
                '--disable-prompt-on-repost',
                '--disable-background-networking',
                '--disable-background-downloads',
                '--disable-background-upload',
                '--disable-background-media-suspend',
                '--memory-pressure-off',
                '--max_old_space_size=4096'
            ]
        }
    }
}; 