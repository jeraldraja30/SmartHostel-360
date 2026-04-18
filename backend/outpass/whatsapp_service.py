"""
WhatsApp Messaging Service using Twilio WhatsApp Sandbox.

This module provides a production-ready WhatsApp messaging service
with full error handling, retry mechanism, phone number validation,
and detailed debug logging.

SETUP REQUIRED:
1. Create a Twilio account at https://www.twilio.com
2. Go to Messaging > Try it out > Send a WhatsApp message
3. Follow the sandbox instructions (send "join <word>" from parent's phone)
4. Copy Account SID, Auth Token from your Twilio Console
5. Add them to backend/.env file
"""
import re
import time
import logging
from django.conf import settings

logger = logging.getLogger('whatsapp')


# ═══════════════════════════════════════════════════════════════
# Phone Number Validation
# ═══════════════════════════════════════════════════════════════

def sanitize_phone_number(phone):
    """
    Clean and validate a phone number for WhatsApp.
    
    Accepts formats:
      - "9876543210"
      - "+919876543210"
      - "919876543210"
      - "+91 98765 43210"
      - "91-98765-43210"
    
    Returns:
      str: Cleaned number in format "+91XXXXXXXXXX" or None if invalid
    """
    if not phone:
        logger.error("[PHONE] Phone number is empty or None")
        return None

    # Remove all non-digit characters except leading +
    cleaned = re.sub(r'[^\d+]', '', str(phone).strip())
    
    # Remove leading + for processing
    if cleaned.startswith('+'):
        cleaned = cleaned[1:]
    
    # If it's a 10-digit Indian number, prepend 91
    if len(cleaned) == 10 and cleaned[0] in '6789':
        cleaned = '91' + cleaned
    
    # Validate: must be 12 digits starting with 91
    if len(cleaned) == 12 and cleaned.startswith('91'):
        result = f"+{cleaned}"
        logger.info(f"[PHONE] Sanitized phone: '{phone}' -> '{result}'")
        return result
    
    logger.error(f"[PHONE] Invalid phone number: '{phone}' -> cleaned to '{cleaned}' (expected 12 digits starting with 91)")
    return None


# ═══════════════════════════════════════════════════════════════
# Core WhatsApp Send Function (Reusable)
# ═══════════════════════════════════════════════════════════════

def send_whatsapp_message(phone, message, max_retries=2):
    """
    Send a WhatsApp message via Twilio Sandbox.
    
    This is the MAIN reusable function. All WhatsApp sends go through here.
    
    Args:
        phone (str): Recipient phone number (any format, will be sanitized)
        message (str): Message body text
        max_retries (int): Number of retry attempts on failure
        
    Returns:
        dict: {
            'success': True/False,
            'message_sid': 'SM...' (Twilio message ID),
            'error': 'error description' (only on failure),
            'error_code': 12345 (Twilio error code, only on failure)
        }
    """
    # ── Step 1: Validate credentials ─────────────────────────────
    account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
    auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
    from_number = getattr(settings, 'TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886')
    
    print("\n" + "=" * 60)
    print("[WHATSAPP] ── Starting WhatsApp Message Send ──")
    print(f"[WHATSAPP] Account SID: {account_sid[:10]}..." if account_sid else "[WHATSAPP] Account SID: MISSING!")
    print(f"[WHATSAPP] Auth Token: {'*' * 10}..." if auth_token else "[WHATSAPP] Auth Token: MISSING!")
    print(f"[WHATSAPP] From Number: {from_number}")
    print(f"[WHATSAPP] To Phone (raw): {phone}")
    print(f"[WHATSAPP] Message length: {len(message) if message else 0}")
    print("=" * 60)
    
    logger.info(f"[WHATSAPP] Starting send to {phone}")
    
    if not account_sid or not auth_token:
        error_msg = (
            "Twilio credentials missing! "
            "Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file. "
            "Get them from https://console.twilio.com"
        )
        print(f"[WHATSAPP] ❌ ERROR: {error_msg}")
        logger.error(f"[WHATSAPP] {error_msg}")
        return {'success': False, 'error': error_msg}
    
    # ── Step 2: Validate phone number ────────────────────────────
    clean_phone = sanitize_phone_number(phone)
    if not clean_phone:
        error_msg = f"Invalid phone number: '{phone}'. Expected Indian mobile number."
        print(f"[WHATSAPP] ❌ ERROR: {error_msg}")
        logger.error(f"[WHATSAPP] {error_msg}")
        return {'success': False, 'error': error_msg}
    
    to_whatsapp = f"whatsapp:{clean_phone}"
    print(f"[WHATSAPP] To WhatsApp: {to_whatsapp}")
    
    # ── Step 3: Validate message body ────────────────────────────
    if not message or not message.strip():
        error_msg = "Message body is empty!"
        print(f"[WHATSAPP] ❌ ERROR: {error_msg}")
        logger.error(f"[WHATSAPP] {error_msg}")
        return {'success': False, 'error': error_msg}
    
    # ── Step 4: Initialize Twilio client ─────────────────────────
    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        print("[WHATSAPP] ✅ Twilio client initialized successfully")
        logger.info("[WHATSAPP] Twilio client initialized")
    except ImportError:
        error_msg = (
            "Twilio package not installed! "
            "Run: pip install twilio"
        )
        print(f"[WHATSAPP] ❌ ERROR: {error_msg}")
        logger.error(f"[WHATSAPP] {error_msg}")
        return {'success': False, 'error': error_msg}
    except Exception as e:
        error_msg = f"Failed to initialize Twilio client: {str(e)}"
        print(f"[WHATSAPP] ❌ ERROR: {error_msg}")
        logger.error(f"[WHATSAPP] {error_msg}")
        return {'success': False, 'error': error_msg}
    
    # ── Step 5: Send with retry ──────────────────────────────────
    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            print(f"\n[WHATSAPP] 📤 Attempt {attempt}/{max_retries} — Sending message...")
            logger.info(f"[WHATSAPP] Attempt {attempt}/{max_retries}")
            
            twilio_message = client.messages.create(
                body=message,
                from_=from_number,
                to=to_whatsapp
            )
            
            # ── SUCCESS ──────────────────────────────────────────
            print(f"[WHATSAPP] ✅ MESSAGE SENT SUCCESSFULLY!")
            print(f"[WHATSAPP] Message SID: {twilio_message.sid}")
            print(f"[WHATSAPP] Status: {twilio_message.status}")
            print(f"[WHATSAPP] Date Sent: {twilio_message.date_created}")
            print(f"[WHATSAPP] To: {twilio_message.to}")
            print(f"[WHATSAPP] From: {twilio_message.from_}")
            print("=" * 60 + "\n")
            
            logger.info(f"[WHATSAPP] ✅ Sent! SID={twilio_message.sid}, status={twilio_message.status}")
            
            return {
                'success': True,
                'message_sid': twilio_message.sid,
                'message_id': twilio_message.sid,  # Alias for backward compat
                'status': twilio_message.status,
            }
            
        except ImportError:
            error_msg = "Twilio package not installed! Run: pip install twilio"
            print(f"[WHATSAPP] ❌ ERROR: {error_msg}")
            logger.error(f"[WHATSAPP] {error_msg}")
            return {'success': False, 'error': error_msg}
            
        except Exception as e:
            last_error = e
            error_msg = str(e)
            
            # Try to extract Twilio-specific error details
            error_code = getattr(e, 'code', None)
            error_status = getattr(e, 'status', None)
            
            print(f"[WHATSAPP] ❌ Attempt {attempt} FAILED!")
            print(f"[WHATSAPP] Error: {error_msg}")
            if error_code:
                print(f"[WHATSAPP] Twilio Error Code: {error_code}")
            if error_status:
                print(f"[WHATSAPP] HTTP Status: {error_status}")
            
            logger.error(f"[WHATSAPP] Attempt {attempt} failed: {error_msg} (code={error_code})")
            
            # ── Diagnose common errors ───────────────────────────
            if error_code == 20003:
                diag = "Authentication error — check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN"
                print(f"[WHATSAPP] 🔍 Diagnosis: {diag}")
            elif error_code == 21608:
                diag = (
                    "The recipient has NOT joined the Twilio sandbox! "
                    "They must send 'join <your-sandbox-word>' to +14155238886 on WhatsApp first."
                )
                print(f"[WHATSAPP] 🔍 Diagnosis: {diag}")
                # Don't retry for this error — user action required
                return {
                    'success': False,
                    'error': diag,
                    'error_code': error_code,
                }
            elif error_code == 21211:
                diag = f"Invalid phone number format: {to_whatsapp}"
                print(f"[WHATSAPP] 🔍 Diagnosis: {diag}")
                return {'success': False, 'error': diag, 'error_code': error_code}
            elif error_code == 63007:
                diag = "Message blocked by WhatsApp — the number may not be a valid WhatsApp account"
                print(f"[WHATSAPP] 🔍 Diagnosis: {diag}")
                return {'success': False, 'error': diag, 'error_code': error_code}
            elif 'authenticate' in error_msg.lower() or error_code == 20003:
                diag = "Invalid Twilio credentials"
                print(f"[WHATSAPP] 🔍 Diagnosis: {diag}")
                return {'success': False, 'error': diag, 'error_code': error_code}
            
            # Wait before retrying (exponential backoff)
            if attempt < max_retries:
                wait_time = 2 ** attempt
                print(f"[WHATSAPP] ⏳ Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
    
    # All retries exhausted
    final_error = f"All {max_retries} attempts failed. Last error: {str(last_error)}"
    print(f"[WHATSAPP] ❌ {final_error}")
    print("=" * 60 + "\n")
    logger.error(f"[WHATSAPP] {final_error}")
    
    return {
        'success': False,
        'error': final_error,
        'error_code': getattr(last_error, 'code', None),
    }


# ═══════════════════════════════════════════════════════════════
# Outpass-Specific Message Sender
# ═══════════════════════════════════════════════════════════════

def send_parent_approval_message(outpass):
    """
    Send WhatsApp approval request to parent for an outpass.
    
    Args:
        outpass: Outpass model instance (must have parent_phone populated)
        
    Returns:
        dict: Result from send_whatsapp_message()
    """
    print(f"\n[OUTPASS-WA] Preparing WhatsApp message for Outpass #{outpass.id}")
    logger.info(f"[OUTPASS-WA] Preparing message for outpass {outpass.id}")
    
    # Validate parent phone exists
    if not outpass.parent_phone:
        error_msg = f"No parent phone number set on outpass {outpass.id}"
        print(f"[OUTPASS-WA] ❌ {error_msg}")
        logger.warning(f"[OUTPASS-WA] {error_msg}")
        return {'success': False, 'error': error_msg}
    
    # Build the message text
    student_name = getattr(outpass, 'student_name', 'Unknown Student')
    message_text = (
        f"🏨 *SmartHostel 360 - Parent Approval Required*\n\n"
        f"Dear Parent,\n\n"
        f"Your ward *{student_name}* has submitted an outpass request.\n\n"
        f"📅 *Out Date:* {outpass.out_date}\n"
        f"📅 *Return Date:* {outpass.return_date}\n"
        f"📝 *Reason:* {outpass.reason}\n\n"
        f"Please reply with:\n"
        f"✅ *YES* — to approve\n"
        f"❌ *NO* — to reject\n\n"
        f"_Reference ID: OP{str(outpass.id).zfill(4)}_"
    )
    
    print(f"[OUTPASS-WA] Student: {student_name}")
    print(f"[OUTPASS-WA] Parent Phone: {outpass.parent_phone}")
    print(f"[OUTPASS-WA] Out Date: {outpass.out_date} -> Return: {outpass.return_date}")
    print(f"[OUTPASS-WA] Reason: {outpass.reason}")
    
    # Send via the core function
    result = send_whatsapp_message(
        phone=outpass.parent_phone,
        message=message_text,
        max_retries=2
    )
    
    if result['success']:
        print(f"[OUTPASS-WA] ✅ WhatsApp sent for outpass OP{str(outpass.id).zfill(4)}")
    else:
        print(f"[OUTPASS-WA] ❌ WhatsApp FAILED for outpass OP{str(outpass.id).zfill(4)}: {result.get('error')}")
    
    return result
