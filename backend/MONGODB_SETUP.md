# MongoDB Connection Guide

## Overview

The backend uses MongoDB as the database. You have two options:

### Option 1: Local MongoDB (Easy for Development)
### Option 2: MongoDB Atlas (Cloud - Easier for Sharing)

---

## Option 1: Local MongoDB Setup

### macOS

```bash
# Install MongoDB Community
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify it's running
mongosh

# You should see: test>
# Type: exit
```

**Connection String for .env:**
```
MONGODB_URI=mongodb://localhost:27017/interview-assistant
```

### Linux (Ubuntu/Debian)

```bash
# Download GPG key
sudo apt-get install gnupg curl

# Import GPG key
curl https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod

# Verify it's running
mongosh

# Enable on startup
sudo systemctl enable mongod
```

**Connection String for .env:**
```
MONGODB_URI=mongodb://localhost:27017/interview-assistant
```

### Windows

1. Download MongoDB Community from: https://www.mongodb.com/try/download/community
2. Run the installer
3. Choose "Install MongoDB as a Service" (recommended)
4. Follow the installation wizard
5. MongoDB will start automatically

**Verify MongoDB is running:**
```bash
mongosh
```

**Connection String for .env:**
```
MONGODB_URI=mongodb://localhost:27017/interview-assistant
```

---

## Option 2: MongoDB Atlas (Cloud - Recommended)

MongoDB Atlas is easier to use and doesn't require local installation.

### Step 1: Create Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free"
3. Sign up with email or Google/GitHub
4. Verify email

### Step 2: Create Organization
1. Create organization name (e.g., "Interview Assistant")
2. Create project name (e.g., "Development")

### Step 3: Create Cluster
1. Select M0 (Free tier)
2. Choose region closest to you
3. Click "Create Cluster" (takes 1-3 minutes)

### Step 4: Setup Security
1. Go to "Database Access"
2. Click "Add New Database User"
3. Use Username: `interview_user`
4. Use Password: Generate strong password (save it!)
5. Set Database User Privileges to "Read and write to any database"
6. Click "Add User"

### Step 5: Allow Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP
4. Click "Confirm"

### Step 6: Get Connection String
1. Go to "Clusters"
2. Click "Connect"
3. Choose "Drivers" (not Shell)
4. Select "Node.js" and version "4.x or later"
5. Copy the connection string

**Example:**
```
mongodb+srv://interview_user:password@cluster.mongodb.net/interview-assistant?retryWrites=true&w=majority
```

### Step 7: Add to .env
Replace `password` with your actual password:

```env
MONGODB_URI=mongodb+srv://interview_user:YOUR_PASSWORD@cluster.mongodb.net/interview-assistant?retryWrites=true&w=majority
```

---

## How to Update .env

### Step 1: Open .env file
```bash
cd backend
nano .env
# or
vim .env
# or use VS Code
```

### Step 2: Update MONGODB_URI
Find the line:
```
MONGODB_URI=mongodb://localhost:27017/interview-assistant
```

Replace with your connection string.

### Step 3: Save and Test

Test connection:
```bash
npm run dev
```

Look for:
```
MongoDB Connected: <hostname>
```

---

## Troubleshooting MongoDB Connection

### "MongoDB Connection Error"

**Check 1: MongoDB is running**
```bash
# For local MongoDB
mongosh

# For cloud, skip this
```

**Check 2: Connection string is correct**
- Extra spaces? Remove them
- Password has special characters? URL encode them
- MongoDB Atlas password changed? Update .env

**Check 3: Network access (Atlas)**
- Go to Network Access
- Verify IP is whitelisted
- Try "Allow Access from Anywhere"

**Check 4: Database exists**
- MongoDB will create it automatically on first write

### "Authentication failed"

For MongoDB Atlas:
- Check username in connection string
- Check password is URL encoded
- For special chars in password:
  ```
  @ = %40
  ! = %21
  # = %23
  $ = %24
  % = %25
  & = %26
  ```

---

## Testing MongoDB Connection

Create `test-db.js`:

```javascript
require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected Successfully!');

    // Check database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map((c) => c.name));

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
  }
}

testConnection();
```

Run it:
```bash
node test-db.js
```

---

## Which Option Should I Use?

### Use Local MongoDB if:
- ✅ You're developing locally
- ✅ You want offline functionality
- ✅ You don't want cloud charges
- ✅ You want full control

### Use MongoDB Atlas if:
- ✅ You want cloud backup
- ✅ You're sharing with team
- ✅ You want managed database
- ✅ You want to test production setup
- ✅ You don't want to manage infrastructure

---

## Quick Reference

### Local MongoDB
```env
MONGODB_URI=mongodb://localhost:27017/interview-assistant
```

### MongoDB Atlas
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/interview-assistant?retryWrites=true&w=majority
```

### Check Connection
```bash
# After starting server
curl http://localhost:5000/api/health
# Should return: {"success": true, "message": "Server is running"}
```

---

## When You Have MongoDB URI

Once you have your MongoDB URI (from local or Atlas):

1. Open `.env` file in backend folder
2. Replace `MONGODB_URI` value
3. Save file
4. Run `npm run dev`
5. Check logs for "MongoDB Connected"

✅ You're ready to go!

---

## MongoDB Basics Commands

Once connected, you can verify data:

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use interview-assistant

# Show all collections
show collections

# Count documents
db.users.countDocuments()
db.resumes.countDocuments()
db.interviews.countDocuments()

# View a user
db.users.findOne()

# View all users
db.users.find().pretty()

# Exit
exit
```

---

## Production Recommendations

For production, use:
- ✅ MongoDB Atlas (managed service)
- ✅ Create dedicated user (not admin)
- ✅ Use strong password (minimum 24 characters)
- ✅ Whitelist specific IP addresses
- ✅ Enable automatic backups
- ✅ Use read replicas for redundancy
- ✅ Monitor database usage
- ✅ Set up alerts

---

## Database Design

Your backend creates 3 collections automatically:

1. **users** - User accounts
2. **resumes** - Resume documents
3. **interviews** - Interview sessions & answers

All with proper indexing and relationships.

---

Ready! Paste your MongoDB URI and we're good to go! 🚀
