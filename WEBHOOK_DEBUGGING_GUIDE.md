# Twilio WhatsApp Webhook Integration - Production Debugging Guide

## 🔴 ROOT CAUSE ANALYSIS: Why You Get 404 Errors

### The Most Common Issues (In Order of Likelihood):

```
1. ❌ Webhook URL Mismatch (Most Common - 70% of cases)
   Problem: You configured one URL in Twilio, but Django listens on a different URL

   Twilio Console shows:  https://ngrok-url/webhook/whatsapp/
   Django actually has:   https://ngrok-url/api/webhook/whatsapp/
   Result: 404 Not Found!

2. ❌ ngrok URL Changed (30% of cases)
   Problem: Free ngrok URL expires every 2 hours or when you restart

   Your config has:  https://abc123.ngrok.io/api/webhook/whatsapp/
   ngrok restarted:  https://xyz789.ngrok.io/api/webhook/whatsapp/
   Result: Twilio can't reach your server → 404 or timeout

3. ❌ CSRF Token Required (Rare but catches beginners)
   Problem: Django's CSRF middleware blocks POST requests without token

   Fix: We use @csrf_exempt on the webhook view ✅ (Already done in your code)

4. ❌ URL Routing Order (Django specific)
   Problem: Django processes URLs in order - a catch-all pattern can block your webhook

   Bad: path('api/', include('outpass.urls'))  # This could conflict!
   Good: Webhook at project level (hostel_management/urls.py) ✅ (Already done!)

5. ❌ Twilio Credentials Wrong (Prevents sending, not receiving)
   Problem: Invalid SID or Token means Twilio can't talk to YOUR server

   Fix: Verify in your .env file
```

---

## 🔧 STEP-BY-STEP VERIFICATION CHECKLIST

### Phase 1: Verify Django URL Routing (2 minutes)

```bash
# Terminal - Test that Django can access the webhook endpoint

# Start Django shell
cd backend
python manage.py shell

# Inside Django shell:
from django.urls import reverse
print(reverse('twilio-whatsapp-webhook'))  # Should print: api/webhook/whatsapp/
```

**Expected Output:**

```
api/webhook/whatsapp/
```

If you get a `NoReverseMatch` error, the URL is not registered correctly.

---

### Phase 2: Test Webhook Locally (Before ngrok) - 3 minutes

```bash
# Terminal 1: Start Django dev server
cd backend
python manage.py runserver 0.0.0.0:8000

# Terminal 2: Send a test POST request
curl -X POST http://localhost:8000/api/webhook/whatsapp/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+919876543210&Body=YES&MessageSid=SM1234567890&NumMedia=0"
```

**Expected Response:**

```xml
<Response></Response>
```

**Check Django logs for:**

```
[INFO] Received Twilio WhatsApp message from whatsapp:+919876543210: 'YES' (SID: SM1234567890)
```

If you see this, your view works correctly! ✅

---

### Phase 3: Verify ngrok Setup (The Critical Step) - 5 minutes

**⚠️ This is where 80% of webhook issues originate!**

```bash
# Step 1: Install ngrok (if not already)
# Download from: https://ngrok.com/download
# Or use Homebrew (Mac): brew install ngrok
# Or use Chocolatey (Windows): choco install ngrok

# Step 2: Authenticate ngrok with your auth token
ngrok config add-authtoken YOUR_AUTH_TOKEN_FROM_NGROK_SITE

# Step 3: Start ngrok pointing to Django
ngrok http 8000

# You should see output like:
```

**Correct ngrok Output:**

```
ngrok                                                        (Ctrl+C to quit)

Session Status                online
Account                       your-email@example.com (Plan: Free)
Version                       3.3.5
Region                        us-california
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://a1b2c3d4e5f6.ngrok.io -> http://localhost:8000

Connections                   ttl    opn    rt1    rt5    p50     p95
                              0      0      0.00   0.00   0.00   0.00
```

**Extract the HTTPS URL:**

```
https://a1b2c3d4e5f6.ngrok.io
```

**⚠️ IMPORTANT NOTES:**

1. **Use HTTPS, not HTTP** — Twilio requires HTTPS
2. **The URL changes every time** you restart ngrok (unless you have a paid plan)
3. **Copy the exact URL** — Don't modify it
4. **Keep ngrok running** — Don't close the terminal

---

### Phase 4: Test ngrok Connection - 2 minutes

**Before going to Twilio, verify ngrok actually forwards to Django:**

```bash
# Open a NEW terminal (keep ngrok running in first terminal)

# Replace YOUR_NGROK_URL with your actual ngrok URL
curl -X POST https://YOUR_NGROK_URL/api/webhook/whatsapp/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+919876543210&Body=YES&MessageSid=SM1234567890&NumMedia=0"
```

**Expected Response:**

```xml
<Response></Response>
```

**Also check:**

1. **ngrok web interface** (http://127.0.0.1:4040)
   - You should see a POST request appear
   - If nothing appears here, ngrok never received the request

2. **Django logs should show:**
   ```
   [INFO] Received Twilio WhatsApp message from whatsapp:+919876543210: 'YES'
   ```

---

### Phase 5: Configure Twilio Webhook - 3 minutes

**Step-by-step in Twilio Console:**

1. Go to: https://console.twilio.com
2. Navigate to: **Messaging** → **Services** → Find your WhatsApp sandbox
3. Click on **Integrations**
4. Find **Webhook URL**
5. Select **Webhook Configuration**
6. In "When a message comes in" field, enter:

   ```
   https://YOUR_NGROK_URL/api/webhook/whatsapp/
   ```

   **Example:**

   ```
   https://a1b2c3d4e5f6.ngrok.io/api/webhook/whatsapp/
   ```

7. **Method:** POST (the default)
8. **Click Save**

---

### Phase 6: Verify Parent is in Sandbox - 2 minutes

**This is critical! Without this, Twilio won't forward messages to you.**

1. Parent must send a message to: **+14155238886**
2. Message must be: **join SANDBOX-WORD**
   - Replace SANDBOX-WORD with the actual word shown in Twilio console
   - Example: `join clever-banana`

3. Once parent receives "You are in the sandbox", they can receive your messages

**Check in Twilio Console:**

- Go to **Messaging** → **Services** → **Sandbox Participants**
- You should see the parent phone number listed

---

### Phase 7: Test End-to-End Message Send - 3 minutes

**Use the test endpoint we built:**

```bash
curl -X GET "http://localhost:8000/api/test-whatsapp/?phone=919876543210"
```

**Or with POST:**

```bash
curl -X POST http://localhost:8000/api/test-whatsapp/ \
  -H "Content-Type: application/json" \
  -d '{"phone": "919876543210", "message": "Test message"}'
```

**Expected Response:**

```json
{
  "success": true,
  "config": {
    "TWILIO_ACCOUNT_SID": "✅ Set",
    "TWILIO_AUTH_TOKEN": "✅ Set",
    "TWILIO_WHATSAPP_FROM": "whatsapp:+14155238886"
  },
  "message": "Message sent successfully! ✅",
  "message_sid": "SM1234567890abcdef1234567890abcd"
}
```

**If it fails:**

```json
{
  "success": false,
  "error": "The recipient has NOT joined the Twilio sandbox!",
  "troubleshooting": { ... }
}
```

---

### Phase 8: Monitor Webhook Receipt - Ongoing

**When parent sends a message, check these locations:**

1. **Django logs (console):**

   ```
   [INFO] Received Twilio WhatsApp message from whatsapp:+919876543210: 'YES'
   [INFO] Outpass OP1001 parent_status updated to 'approved'
   ```

2. **whatsapp.log file:**

   ```bash
   tail -f backend/whatsapp.log
   ```

3. **ngrok Web Interface (http://127.0.0.1:4040):**
   - Click on the POST request
   - Check **Request Body** tab
   - You should see:
     ```
     From=whatsapp:+919876543210
     Body=YES
     MessageSid=SM...
     ```

---

## 🚨 COMMON ERRORS & SOLUTIONS

### Error: `404 Not Found` from Twilio

**Cause:** URL mismatch between Twilio config and Django routing

**Solution:**

1. Check your Twilio Console webhook URL
2. Run: `python manage.py show_urls | grep webhook`
3. Ensure they match exactly (including `/api/` prefix)

---

### Error: `Webhook timed out`

**Cause:** ngrok not running or URL expired

**Solution:**

1. Verify ngrok is still running: you should see it in the terminal
2. Copy the LATEST ngrok URL (it may have changed)
3. Update Twilio console with new URL
4. Test with curl again

---

### Error: Parent sends message, but webhook not called

**Cause:**

- Parent not in sandbox (most likely)
- Twilio configuration incorrect
- Webhook URL wrong in Twilio

**Solution:**

1. Verify parent sent "join SANDBOX-WORD" to +14155238886
2. Check Twilio **Sandbox Participants** list
3. Check webhook URL in Twilio console matches ngrok URL
4. Test webhook locally first (Phase 2)

---

### Error: Webhook called, but `parent_status` not updated

**Cause:** Wrong phone number format or no matching pending outpass

**Solution:**

Check `whatsapp.log`:

```
logger.warning(f"No pending outpass found for parent phone: {from_number}")
```

**Fix:**

1. Verify `outpass.parent_phone` is saved in correct format
2. Verify `outpass.parent_status` is 'pending'
3. Check database:
   ```bash
   python manage.py dbshell
   SELECT id, parent_phone, parent_status FROM outpass_outpass LIMIT 5;
   ```

---

## 📋 COMPLETE VERIFICATION CHECKLIST

Use this before deploying:

```
☐ Phase 1: Django URL routing works
  ☐ python manage.py shell → reverse('twilio-whatsapp-webhook') returns correct URL

☐ Phase 2: Webhook view handles POST
  ☐ curl localhost:8000/api/webhook/whatsapp/ returns <Response></Response>

☐ Phase 3: ngrok is running and forwarding
  ☐ ngrok http 8000 shows "Forwarding https://..."
  ☐ ngrok web interface (4040) shows requests

☐ Phase 4: ngrok → Django connection works
  ☐ curl https://YOUR_NGROK_URL/api/webhook/whatsapp/ succeeds
  ☐ Django logs show message received

☐ Phase 5: Twilio knows about your webhook
  ☐ Twilio console has correct webhook URL
  ☐ URL exactly matches ngrok forwarding URL with /api/webhook/whatsapp/

☐ Phase 6: Parent is in Twilio sandbox
  ☐ Parent sent "join SANDBOX-WORD"
  ☐ Parent appears in Sandbox Participants list
  ☐ Parent can receive your test messages

☐ Phase 7: End-to-end test works
  ☐ /api/test-whatsapp/ successfully sends message
  ☐ Parent receives test message on WhatsApp
  ☐ You can monitor in Twilio Console

☐ Phase 8: Parent reply flows through webhook
  ☐ Parent sends YES/NO
  ☐ Webhook receives it (check logs)
  ☐ parent_status updates in database
```

---

## 🎯 PRODUCTION DEPLOYMENT CHANGES

When moving from ngrok to production:

1. **Get a real domain** (e.g., `smarthostel.example.com`)
2. **Update Twilio webhook URL:**

   ```
   https://smarthostel.example.com/api/webhook/whatsapp/
   ```

3. **Ensure HTTPS** is enabled on your server

4. **Update Django settings** (if needed):

   ```python
   ALLOWED_HOSTS = ['smarthostel.example.com']
   DEBUG = False  # Production safety
   ```

5. **Keep logging enabled** — maintain the `whatsapp.log` file for debugging

---

## 📞 TWILIO SUPPORT RESOURCES

- **Console:** https://console.twilio.com
- **Webhook Docs:** https://www.twilio.com/docs/messaging/webhooks/incoming-message-webhooks
- **WhatsApp Sandbox:** https://www.twilio.com/docs/whatsapp/quickstart/python
- **Error Codes:** https://www.twilio.com/docs/api/errors

---

## 🔐 SECURITY CHECKLIST

```
☐ Use @csrf_exempt only on webhook (already done) ✅
☐ Validate 'From' number format ✅
☐ Validate message body is not empty ✅
☐ Log all webhook calls for audit trail ✅
☐ Return 200 even on errors (prevent Twilio retries) ✅
☐ Never log sensitive data (credentials, tokens) ✅
```

---

## 🎬 QUICK START CHEAT SHEET

```bash
# Terminal 1: Start Django
cd backend && python manage.py runserver 0.0.0.0:8000

# Terminal 2: Start ngrok
ngrok http 8000

# Terminal 3: Test locally
curl -X POST http://localhost:8000/api/webhook/whatsapp/ \
  -d "From=whatsapp:+919876543210&Body=YES&MessageSid=SM1234"

# Monitor logs
tail -f backend/whatsapp.log

# Copy ngrok URL → Update Twilio console
# Parent joins sandbox → Send message
# Check logs for webhook receipt
```

---

**Last Updated:** 2025-04-08
**Author:** Senior Backend Engineer
**Status:** Production Ready ✅
