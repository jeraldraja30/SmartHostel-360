# SmartHostel 360 - Complete Setup & Run Guide

## 📋 Prerequisites

### Required Software

- **Python 3.8+** (https://www.python.org/downloads/)
- **Node.js 14+** (https://nodejs.org/) - for frontend
- **MySQL/MariaDB** (https://dev.mysql.com/downloads/) - or use SQLite for development
- **Git** (https://git-scm.com/)
- **ngrok** (https://ngrok.com/download) - for Twilio webhook testing
- **Code Editor** - VS Code recommended

### Twilio Setup

- Twilio account (https://www.twilio.com/console)
- WhatsApp sandbox configured
- Account SID and Auth Token

---

## 🚀 QUICK START (20 minutes)

### Step 1: Clone & Navigate

```bash
cd "c:\Users\Raja jerald\OneDrive\Desktop\SmartHostel 360"
git pull origin main
```

### Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment (Windows)
python -m venv venv
venv\Scripts\activate

# Or (Mac/Linux)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Twilio SDK (if not in requirements.txt)
pip install twilio
```

### Step 3: Configure Environment

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env file with your credentials
# Windows: notepad .env
# Mac/Linux: nano .env
```

**Required .env variables:**

```env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_NAME=hostel_db
DATABASE_USER=root
DATABASE_PASSWORD=your-password
DATABASE_HOST=localhost
DATABASE_PORT=3306

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token-here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_TEST_PHONE=919876543210
```

### Step 4: Database Setup

```bash
# Run migrations
python manage.py migrate

# Create superuser (admin account)
python manage.py createsuperuser
# Follow prompts to create admin

# Optional: Load sample data
python manage.py loaddata initial_data  # if available
```

### Step 5: Start Django Backend

```bash
# Terminal 1: Run Django server
python manage.py runserver 0.0.0.0:8000

# Expected output:
# Starting development server at http://0.0.0.0:8000/
```

### Step 6: Start Frontend

```bash
# Terminal 2: Navigate to project root
cd "SmartHostel 360"

# Open index.html in browser or use:
python -m http.server 5500
# Then visit: http://localhost:5500
```

### Step 7: Setup Twilio Webhook (For WhatsApp)

```bash
# Terminal 3: Start ngrok
ngrok http 8000

# Copy the HTTPS URL shown (e.g., https://abc123.ngrok.io)

# Go to Twilio Console:
# 1. https://console.twilio.com
# 2. Messaging > Services > WhatsApp Sandbox
# 3. Integrations > Webhook Configuration
# 4. Paste: https://YOUR_NGROK_URL/api/webhook/whatsapp/
# 5. Method: POST
# 6. Save
```

---

## 📡 Full Architecture

```
Frontend (Static Files)
├── index.html              ← Main web interface
├── css/
│   ├── style.css
│   └── notifications.css
└── assets/js/
    └── app.js              ← API calls to backend

↓↓↓ HTTP/AJAX ↓↓↓

Backend (Django) - Port 8000
├── API Endpoints
│   ├── /api/auth/          ← Login/Register
│   ├── /api/outpasses/     ← Outpass management
│   ├── /api/hosteler/      ← Student info
│   ├── /api/rooms/         ← Room management
│   ├── /api/payments/      ← Payment tracking
│   └── /api/test-whatsapp/ ← Test WhatsApp sender
│
├── Webhook Endpoints
│   └── /api/webhook/whatsapp/  ← Twilio incoming messages
│
└── Admin Panel
    └── /admin/             ← Django admin interface

↓↓↓ HTTP ↓↓↓

Database (MySQL/SQLite)
├── Django Auth (Users, Tokens)
├── Hosteler (Student info)
├── Outpass (Request data + parent_status)
├── Room (Room allocation)
├── Payment (Payment records)
└── Feedback (Student feedback)

↓↓↓ HTTPS (Twilio) ↓↓↓

External APIs
├── Twilio WhatsApp API   ← Parent messages
└── ngrok Tunnel         ← Public webhook URL
```

---

## 🎯 Complete File Structure

```
SmartHostel 360/
│
├── backend/                          ← Django project
│   ├── venv/                         ← Virtual environment
│   ├── manage.py                     ← Django management
│   ├── requirements.txt              ← Python dependencies
│   ├── .env                          ← Configuration (CREATE THIS!)
│   ├── .env.example                  ← Template
│   │
│   ├── hostel_management/            ← Main Django app
│   │   ├── settings.py               ← Configuration
│   │   ├── urls.py                   ← URL routing
│   │   ├── wsgi.py                   ← Production server
│   │   └── views.py                  ← Views
│   │
│   ├── accounts/                     ← User authentication
│   │   ├── models.py                 ← User model
│   │   ├── views.py                  ← Login/Register
│   │   ├── serializers.py            ← API serializers
│   │   ├── urls.py                   ← Auth endpoints
│   │   └── migrations/               ← DB migrations
│   │
│   ├── outpass/                      ← Outpass feature
│   │   ├── models.py                 ← Outpass model
│   │   ├── views.py                  ← API views
│   │   ├── webhook_views.py          ← Twilio webhook handler (NEW)
│   │   ├── webhook_processor.py      ← Parent reply processor (NEW)
│   │   ├── whatsapp_service.py       ← Twilio integration (NEW)
│   │   ├── serializers.py            ← API serializers
│   │   ├── urls.py                   ← Outpass endpoints
│   │   └── migrations/               ← DB migrations
│   │
│   ├── hostel/                       ← Hostel data
│   ├── rooms/                        ← Room allocation
│   ├── payments/                     ← Payment tracking
│   ├── feedback/                     ← Student feedback
│   ├── notifications/                ← Push notifications
│   │
│   ├── whatsapp.log                  ← WhatsApp debug log
│   └── db.sqlite3                    ← SQLite database (dev only)
│
├── Frontend Files (Root)
│   ├── index.html                    ← Main page
│   ├── favicon.ico                   ← Browser favicon
│   │
│   ├── css/
│   │   ├── style.css                 ← Main styles
│   │   └── notifications.css         ← Notification styles
│   │
│   ├── assets/js/
│   │   └── app.js                    ← Frontend logic
│   │
│   └── (Other static files)
│
├── Documentation (NEW)
│   ├── WEBHOOK_DEBUGGING_GUIDE.md    ← Testing guide
│   ├── ROOT_CAUSE_ANALYSIS.md        ← Technical analysis
│   ├── ARCHITECTURE.md               ← System design
│   ├── IMPLEMENTATION_REFERENCE.md   ← Quick reference
│   ├── FINAL_SUMMARY.md              ← Summary
│   ├── DEPLOYMENT_COMPLETE.md        ← Deployment checklist
│   └── implementation_plan.md        ← Original plan
│
├── .git/                             ← Git repository
├── .gitignore                        ← Git ignore rules
└── README.md                         ← Project readme
```

---

## 🛠️ Detailed Setup Instructions

### Backend Database Setup

#### Option A: SQLite (Development - No setup needed!)

```bash
# SQLite is default - just run migrations
python manage.py migrate
```

#### Option B: MySQL (Recommended for production)

**1. Create MySQL database:**

```sql
CREATE DATABASE hostel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hostel_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON hostel_db.* TO 'hostel_user'@'localhost';
FLUSH PRIVILEGES;
```

**2. Update .env:**

```env
DATABASE_NAME=hostel_db
DATABASE_USER=hostel_user
DATABASE_PASSWORD=your_password
DATABASE_HOST=localhost
DATABASE_PORT=3306
```

**3. Run migrations:**

```bash
python manage.py migrate
```

### Create Admin Account

```bash
python manage.py createsuperuser

# Follow prompts:
# Username: admin
# Email: admin@example.com
# Password: (create strong password)
```

Access admin at: http://localhost:8000/admin/

---

## 🚀 Running the Complete Project

### Terminal Setup (3 terminals needed)

#### Terminal 1: Django Backend

```bash
cd backend
source venv/bin/activate      # or venv\Scripts\activate on Windows
python manage.py runserver 0.0.0.0:8000
```

Expected output:

```
Starting development server at http://0.0.0.0:8000/
Quit the server with CTRL-BREAK.
```

#### Terminal 2: Frontend Server

```bash
# Stay in project root directory
# Option A: Python HTTP server on port 5500
python -m http.server 5500

# Option B: VS Code Live Server
# Right-click index.html → Open with Live Server

# Option C: SimpleHTTPServer (Python 2)
# python -m SimpleHTTPServer 5500
```

Expected output:

```
Serving HTTP on 0.0.0.0 port 5500
```

#### Terminal 3: ngrok Tunnel (For Twilio)

```bash
ngrok http 8000

# Expected output:
# Forwarding     https://abc123.ngrok.io -> http://localhost:8000
```

**Copy the HTTPS URL** - you'll need it for Twilio configuration.

---

## ✅ Verify Everything is Running

### Check Backend

```bash
curl http://localhost:8000/api/auth/login/
# Should get: 405 Method Not Allowed (POST required)
```

### Check Frontend

Open browser and navigate to:

- **Local:** http://localhost:5500
- **Or:** http://127.0.0.1:5500

### Check Webhook

```bash
curl -X POST http://localhost:8000/api/webhook/whatsapp/ \
  -d "From=whatsapp:+919876543210&Body=YES&MessageSid=SM1234"

# Expected response:
# <Response></Response>
```

---

## 🔑 API Endpoints Reference

### Authentication

```
POST   /api/auth/login/              Login
POST   /api/auth/register/           Register
POST   /api/auth/logout/             Logout
POST   /api/auth/token/refresh/      Refresh token
GET    /api/auth/profile/            Get profile
```

### Outpass Management

```
GET    /api/outpasses/               List all
POST   /api/outpasses/               Create new
GET    /api/outpasses/{id}/          Get details
PATCH  /api/outpasses/{id}/          Update
DELETE /api/outpasses/{id}/          Delete
POST   /api/outpasses/{id}/set_status/ Approve/Reject
GET    /api/test-whatsapp/           Test WhatsApp send
```

### Other Endpoints

```
GET    /api/hostels/                 Hostel info
GET    /api/rooms/                   Room allocation
GET    /api/payments/                Payment records
POST   /api/feedback/                Submit feedback
```

---

## 🔧 Common Issues & Solutions

### Issue: "Module not found" errors

```bash
# Solution: Ensure virtual environment is activated
venv\Scripts\activate              # Windows
source venv/bin/activate           # Mac/Linux
```

### Issue: Database migration errors

```bash
# Solution: Clear old migrations and start fresh
python manage.py migrate --run-syncdb
# Or for production issues:
python manage.py makemigrations
python manage.py migrate
```

### Issue: Port 8000 already in use

```bash
# Use different port
python manage.py runserver 0.0.0.0:8001
```

### Issue: CORS errors in browser console

**Already configured in settings.py**, but if issues persist:

```python
# Check CORS_ALLOWED_ORIGINS in settings.py
CORS_ALLOWED_ORIGINS = ['http://127.0.0.1:5500', 'http://localhost:5500']
```

### Issue: Static files not loading

```bash
# Collect static files for production
python manage.py collectstatic --noinput
```

---

## 🧪 Test the Twilio WhatsApp Integration

### Step 1: Configure Twilio Webhook

[See WEBHOOK_DEBUGGING_GUIDE.md - Phase 5]

### Step 2: Test Sending Message

```bash
# Test endpoint creates a sample outpass and sends WhatsApp
curl -X GET "http://localhost:8000/api/test-whatsapp/?phone=919876543210"
```

### Step 3: Test Receiving Message

Parent sends "YES" or "NO" in WhatsApp → Webhook receives it → Database updates

### Step 4: Monitor Logs

```bash
# Watch WhatsApp logs in real-time
tail -f backend/whatsapp.log
```

---

## 📊 Database Reset (Development Only)

```bash
# Delete all data and migrations
python manage.py flush

# Or for SQLite:
rm db.sqlite3

# Then re-run migrations
python manage.py migrate
python manage.py createsuperuser
```

---

## 🚀 Production Deployment Checklist

### Before Going Live

```bash
# 1. Update settings.py
DEBUG = False
ALLOWED_HOSTS = ['your-domain.com']
SECURE_SSL_REDIRECT = True

# 2. Collect static files
python manage.py collectstatic

# 3. Use production database (MySQL)
# Update .env with MySQL credentials

# 4. Use production WSGI server
# Install: pip install gunicorn
# Run: gunicorn hostel_management.wsgi:application

# 5. Update Twilio webhook URL
# Use real domain instead of ngrok:
https://your-domain.com/api/webhook/whatsapp/

# 6. Setup HTTPS (Let's Encrypt)
# Use certbot or your hosting provider

# 7. Enable monitoring
# Setup logging to CloudWatch or Sentry
```

---

## 📱 User Roles & Default Accounts

### User Types

- **Student:** File outpass requests, view approval status
- **Parent:** Receive WhatsApp, reply with YES/NO
- **Warden:** Approve/reject based on parent approval
- **Admin:** Manage everything via /admin/

### Create Test Users

```bash
python manage.py createsuperuser
# Username: admin
# Password: (strong password)

# Then create in admin panel:
# 1. Parent user
# 2. Student user
# 3. Warden user
```

---

## 🔒 Security Checklist

- [ ] Change `SECRET_KEY` in settings
- [ ] Set `DEBUG = False` in production
- [ ] Update `ALLOWED_HOSTS` with your domain
- [ ] Enable HTTPS/SSL certificate
- [ ] Store credentials in environment variables
- [ ] Never commit `.env` file to git
- [ ] Use strong database passwords
- [ ] Enable Django security middleware
- [ ] Setup regular backups
- [ ] Monitor logs for errors

---

## 📚 Documentation & Guides

**For Twilio WhatsApp Integration:**

1. `ROOT_CAUSE_ANALYSIS.md` — Understand the architecture
2. `WEBHOOK_DEBUGGING_GUIDE.md` — Step-by-step testing
3. `IMPLEMENTATION_REFERENCE.md` — Quick reference
4. `ARCHITECTURE.md` — System design

**For General Setup:**

- Django docs: https://docs.djangoproject.com/
- DRF docs: https://www.django-rest-framework.org/
- Twilio docs: https://www.twilio.com/docs/

---

## ✨ Quick Reference Commands

```bash
# Virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# Pip commands
pip install -r requirements.txt
pip freeze > requirements.txt

# Django commands
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
python manage.py shell
python manage.py test
python manage.py collectstatic

# Database
python manage.py dbshell
python manage.py flush

# Git commands
git pull origin main
git status
git add .
git commit -m "message"
git push origin main
```

---

## 🎯 Next Steps After Setup

1. ✅ Create admin account
2. ✅ Create test users (student, parent, warden)
3. ✅ Test API endpoints with Postman/curl
4. ✅ Configure Twilio WhatsApp
5. ✅ Test WhatsApp send/receive
6. ✅ Setup frontend UI
7. ✅ Test full flow: create outpass → send WhatsApp → parent replies → status updates

---

**Status:** ✅ Ready to Run
**Last Updated:** 2025-04-08
**All Systems:** Go!
