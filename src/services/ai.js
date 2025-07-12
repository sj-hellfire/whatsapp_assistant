const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config');

class AIService {
    constructor(io) {
        this.io = io;
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.userChatSessions = new Map();
    }

    async getResponse(userMessage, contactName, userId, hasMedia = false, mediaType = '') {
        try {
            // Get or create chat session for this user
            let chatSession = this.userChatSessions.get(userId);
            
            if (!chatSession) {
                // Create new chat session for this user
                const model = this.genAI.getGenerativeModel({ 
                    model: config.gemini.model,
                    generationConfig: {
                        maxOutputTokens: config.gemini.maxTokens,
                        temperature: config.gemini.temperature,
                    }
                });
                
                // Initialize chat session with proper structure
                chatSession = model.startChat({
                    history: []
                });
                
                // Send the system prompt as the first message
                await chatSession.sendMessage(`${config.botConfig.systemPrompt} The user's name is ${contactName}.`);
                
                this.userChatSessions.set(userId, chatSession);
                this.log(`Created new chat session for ${contactName}`, 'info');
            }

            // Prepare the message content
            let messageContent = userMessage;
            
            // If there's media, enhance the prompt to acknowledge it
            if (hasMedia && mediaType) {
                messageContent = `User sent a ${mediaType} along with this message: "${userMessage}". Please analyze both the text and the ${mediaType} content.`;
            }

            // Send message to the chat session
            const result = await chatSession.sendMessage(messageContent);
            const response = await result.response;
            
            return response.text();
        } catch (error) {
            this.log('Gemini API Error: ' + error.message, 'error');
            return config.botConfig.errorMessage;
        }
    }

    async processMessage(messageData) {
        const { message, contactName, messageContent, hasMedia, mediaType } = messageData;
        
        try {
            // Get AI response
            const aiResponse = await this.getResponse(messageContent, contactName, message.from, hasMedia, mediaType);

            // Stop typing indicator
            await message.getChat().then(chat => chat.clearState());

            // Send the response to WhatsApp
            await message.reply(aiResponse);

            // Send the AI response directly to frontend
            this.io.emit('ai-response', {
                contactName: contactName,
                contactId: message.from,
                response: aiResponse,
                timestamp: new Date().toLocaleTimeString()
            });

            // Log the AI response
            this.log(`🤖 AI response to ${contactName}: "${aiResponse}"`, 'response');

        } catch (error) {
            this.log('Error processing AI response: ' + error.message, 'error');
            
            // Send error message to user
            try {
                await message.reply(config.botConfig.errorMessage);
            } catch (replyError) {
                this.log('Error sending error message: ' + replyError.message, 'error');
            }
        }
    }

    clearUserSession(userId) {
        this.userChatSessions.delete(userId);
    }

    clearAllSessions() {
        this.userChatSessions.clear();
    }

    getSessionCount() {
        return this.userChatSessions.size;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = { timestamp, message, type };
        
        this.io.emit('log', logEntry);
        console.log(`[${timestamp}] ${message}`);
    }
}

module.exports = AIService; 