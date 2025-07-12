/**
 * Configuration validation utilities
 */

const requiredEnvVars = [
    'GEMINI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
];

const optionalEnvVars = [
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
    'SESSION_SECRET',
    'PORT'
];

/**
 * Validate environment variables
 */
function validateEnvironment() {
    const missing = [];
    const warnings = [];
    
    // Check required environment variables
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }
    
    // Check optional environment variables
    for (const envVar of optionalEnvVars) {
        if (!process.env[envVar]) {
            warnings.push(`${envVar} not set, using default value`);
        }
    }
    
    return { missing, warnings };
}

/**
 * Validate configuration object
 */
function validateConfig(config) {
    const errors = [];
    const warnings = [];
    
    // Check required config sections
    if (!config.gemini) {
        errors.push('Gemini configuration is missing');
    } else {
        if (!config.gemini.model) {
            errors.push('Gemini model is not configured');
        }
        if (!config.gemini.maxTokens || config.gemini.maxTokens < 100) {
            warnings.push('Gemini maxTokens should be at least 100');
        }
    }
    
    if (!config.whatsapp) {
        errors.push('WhatsApp configuration is missing');
    } else {
        if (!config.whatsapp.puppeteer) {
            warnings.push('WhatsApp puppeteer configuration is missing, using defaults');
        }
    }
    
    if (!config.botConfig) {
        errors.push('Bot configuration is missing');
    } else {
        if (!config.botConfig.systemPrompt) {
            warnings.push('Bot system prompt is not configured');
        }
        if (!config.botConfig.errorMessage) {
            warnings.push('Bot error message is not configured');
        }
    }
    
    if (!config.allowedContacts || !Array.isArray(config.allowedContacts)) {
        warnings.push('Allowed contacts list is not configured or invalid');
    } else if (config.allowedContacts.length === 0) {
        warnings.push('No allowed contacts configured');
    }
    
    return { errors, warnings };
}

/**
 * Validate database connection
 */
async function validateDatabase(contactOperations) {
    try {
        // Try to get contacts to test database connection
        await contactOperations.getAllContacts();
        return { valid: true };
    } catch (error) {
        return { 
            valid: false, 
            error: error.message 
        };
    }
}

/**
 * Validate AI service connection
 */
async function validateAIService(genAI) {
    try {
        // Try to create a model instance
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        return { valid: true };
    } catch (error) {
        return { 
            valid: false, 
            error: error.message 
        };
    }
}

/**
 * Generate configuration report
 */
function generateConfigReport(envValidation, configValidation) {
    const report = {
        timestamp: new Date().toISOString(),
        environment: {
            valid: envValidation.missing.length === 0,
            missing: envValidation.missing,
            warnings: envValidation.warnings
        },
        configuration: {
            valid: configValidation.errors.length === 0,
            errors: configValidation.errors,
            warnings: configValidation.warnings
        }
    };
    
    return report;
}

/**
 * Log configuration status
 */
function logConfigStatus(report) {
    console.log('\n=== Configuration Status ===');
    
    // Environment status
    console.log('\nEnvironment Variables:');
    if (report.environment.valid) {
        console.log('✅ All required environment variables are set');
    } else {
        console.log('❌ Missing required environment variables:');
        report.environment.missing.forEach(envVar => {
            console.log(`   - ${envVar}`);
        });
    }
    
    if (report.environment.warnings.length > 0) {
        console.log('\n⚠️  Environment warnings:');
        report.environment.warnings.forEach(warning => {
            console.log(`   - ${warning}`);
        });
    }
    
    // Configuration status
    console.log('\nConfiguration:');
    if (report.configuration.valid) {
        console.log('✅ Configuration is valid');
    } else {
        console.log('❌ Configuration errors:');
        report.configuration.errors.forEach(error => {
            console.log(`   - ${error}`);
        });
    }
    
    if (report.configuration.warnings.length > 0) {
        console.log('\n⚠️  Configuration warnings:');
        report.configuration.warnings.forEach(warning => {
            console.log(`   - ${warning}`);
        });
    }
    
    console.log('\n===========================\n');
}

module.exports = {
    validateEnvironment,
    validateConfig,
    validateDatabase,
    validateAIService,
    generateConfigReport,
    logConfigStatus
}; 