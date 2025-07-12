# Supabase Setup Guide for WhatsApp AI Assistant

## 🗄️ Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Note down your project URL and anon key

### 2. Create Database Table

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

-- Create index for faster queries
CREATE INDEX idx_contacts_whatsapp_id ON contacts(whatsapp_id);
CREATE INDEX idx_contacts_allowed ON contacts(is_allowed) WHERE is_allowed = true;

-- Enable Row Level Security (RLS)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for now)
CREATE POLICY "Allow all operations" ON contacts FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON contacts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to increment message count
CREATE OR REPLACE FUNCTION increment_message_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.message_count = COALESCE(OLD.message_count, 0) + 1;
    NEW.last_message_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to increment message count on update
CREATE TRIGGER increment_contacts_message_count
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    WHEN (OLD.last_message_at IS DISTINCT FROM NEW.last_message_at)
    EXECUTE FUNCTION increment_message_count();
```

### 3. Environment Variables

Add these to your `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

## 🔧 Integration Steps

### 1. Update server.js

The server.js file has been updated to use Supabase for contact management.

### 2. Initialize Contacts

Run the initialization script to migrate your existing contacts:

```bash
node setup-supabase.js
```

### 3. Test the Integration

Start your server and check the logs for Supabase connection status.

## 📊 Database Schema

### Contacts Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `whatsapp_id` | TEXT | WhatsApp ID (e.g., "1234567890@c.us") |
| `phone_number` | TEXT | Phone number without @c.us |
| `name` | TEXT | Contact name (updates from WhatsApp) |
| `is_allowed` | BOOLEAN | Whether contact is allowed to message |
| `last_message_at` | TIMESTAMP | Last message timestamp |
| `message_count` | INTEGER | Total messages received |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

## 🚀 Features

### Automatic Contact Management
- ✅ Contacts are automatically created when they send messages
- ✅ Contact names are updated from WhatsApp metadata
- ✅ Message counts and timestamps are tracked
- ✅ Allowed contacts are marked in database

### API Endpoints
- `GET /api/allowed-contacts` - Returns allowed contacts with latest names
- `GET /api/contacts` - Returns all contacts (for admin panel)
- `PUT /api/contacts/:id` - Update contact details

### Real-time Updates
- Contact names update automatically when messages are received
- Dropdown and chat display use latest names from database
- Log statements show contact names instead of numbers

## 🔒 Security

### Row Level Security (RLS)
- RLS is enabled on the contacts table
- Currently allows all operations (you can restrict this later)

### Environment Variables
- Never commit your Supabase keys to Git
- Use environment variables for all sensitive data

## 📈 Monitoring

### Supabase Dashboard
- Monitor database usage in Supabase dashboard
- Check query performance and logs
- Set up alerts for high usage

### Application Logs
- Check server logs for Supabase connection status
- Monitor contact update operations
- Track any database errors

## 🛠️ Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check SUPABASE_URL and SUPABASE_ANON_KEY
   - Verify project is active in Supabase dashboard

2. **Table Not Found**
   - Run the SQL setup script in Supabase SQL Editor
   - Check table name matches exactly

3. **Permission Denied**
   - Verify RLS policies are set correctly
   - Check if anon key has proper permissions

### Debug Commands

```bash
# Test Supabase connection
node -e "const { contactOperations } = require('./supabase.js'); contactOperations.getAllContacts().then(console.log)"

# Initialize contacts from config
node -e "const { contactOperations } = require('./supabase.js'); const config = require('./config.js'); contactOperations.initializeContactsFromConfig(config.allowedContacts).then(console.log)"
```

## 🔄 Migration from In-Memory

The system now uses Supabase instead of in-memory contact storage:

- **Before**: Contacts stored in `contactNames` object
- **After**: Contacts stored in Supabase database
- **Benefits**: Persistence, better querying, scalability

## 📝 Next Steps

1. **Add Admin Panel**: Create web interface to manage contacts
2. **Analytics**: Track message patterns and usage
3. **Backup**: Set up automated database backups
4. **Monitoring**: Add alerts for system health

---

**Note**: Make sure to test thoroughly in development before deploying to production! 