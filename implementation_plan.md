# Fix Twilio WhatsApp Integration

## Goal
Resolve 404 errors on Twilio webhook, ensure messages are sent to parents, and add comprehensive logging.

## User Review Required
- Confirm the desired webhook URL path (currently `/webhook/whatsapp/`).
- Approve adding `DEBUG` level logging to `whatsapp.log`.
- Approve any changes to environment variable names if needed.

## Proposed Changes
---
### Core URL Configuration
#### [MODIFY] [hostel_management/urls.py](file:///c:/Users/Raja%20jerald/OneDrive/Desktop/SmartHostel%20360/backend/hostel_management/urls.py)
- Ensure the webhook path matches the one configured in Twilio console.
- Add a dedicated namespace for Twilio webhook to avoid conflicts.

---
### Outpass App URLs
#### [MODIFY] [outpass/urls.py](file:///c:/Users/Raja%20jerald/OneDrive/Desktop/SmartHostel%20360/backend/outpass/urls.py)
- Keep existing webhook route but rename to `twilio/webhook/` for clarity.
- Add a test endpoint for sending WhatsApp messages.

---
### Webhook View
#### [MODIFY] [outpass/webhook_views.py](file:///c:/Users/Raja%20jerald/OneDrive/Desktop/SmartHostel%20360/backend/outpass/webhook_views.py)
- Add detailed logging of request headers and payload.
- Return proper TwiML XML response.
- Validate `From` number format and ensure it belongs to a registered parent.

---
### WhatsApp Service
#### [MODIFY] [outpass/whatsapp_service.py](file:///c:/Users/Raja%20jerald/OneDrive/Desktop/SmartHostel%20360/backend/outpass/whatsapp_service.py)
- Refactor `send_whatsapp` to raise clear exceptions on credential issues.
- Add logging of request/response details.
- Ensure environment variables are loaded using `django-environ` and provide fallback defaults.

---
### Settings
#### [MODIFY] [hostel_management/settings.py](file:///c:/Users/Raja%20jerald/OneDrive/Desktop/SmartHostel%20360/backend/hostel_management/settings.py)
- Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `TWILIO_TEST_PHONE` to `.env` loading.
- Configure logging handler for `whatsapp.log` with DEBUG level.

---
### Add Logging
#### [MODIFY] Add logger configuration in `settings.py` and ensure each module uses `logging.getLogger(__name__)`.

## Open Questions
> [!IMPORTANT] **Webhook URL Consistency**
> Do you want the webhook URL to be `/api/webhook/whatsapp/` (prefixed with `api/`) or keep the current `/webhook/whatsapp/`? The plan uses the latter but can be adjusted.

> [!IMPORTANT] **Test Phone Number**
> Should the test endpoint use a hard‑coded sandbox number or read from `TWILIO_TEST_PHONE` in `.env`?

## Verification Plan
### Automated Tests
- Run `python manage.py test outpass` to ensure views respond with 200.
- Use Django test client to POST a mock Twilio payload to the webhook and assert a 200 response.
- Verify `send_whatsapp` returns a dict with `message_sid` when called with valid data.

### Manual Verification
- Start the dev server (`python manage.py runserver`).
- Expose via ngrok (`ngrok http 8000`).
- Update Twilio console webhook URL to the ngrok URL + `/webhook/whatsapp/`.
- Send a test message using the new test endpoint and confirm receipt on the sandbox phone.
- Check `whatsapp.log` for detailed logs.
