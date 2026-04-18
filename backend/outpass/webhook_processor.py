"""
Processes incoming WhatsApp replies from parents.

Logic:
- Parent replies "YES" → parent_status = 'approved'
- Parent replies "NO"  → parent_status = 'rejected'
- Anything else        → ignored (not a valid reply)

How we match the reply to the correct outpass:
  We look up the most recent PENDING outpass where parent_phone
  matches the sender's WhatsApp number.
"""
import logging
from django.utils import timezone
from .models import Outpass

logger = logging.getLogger(__name__)


def process_parent_reply(from_number, message_body):
    """
    Match the parent's reply to an outpass and update its status.

    Args:
        from_number (str): Parent's WhatsApp number e.g. '919876543210'
        message_body (str): Text the parent sent e.g. 'YES' or 'NO'
    """
    if not from_number or not message_body:
        logger.warning("process_parent_reply: missing from_number or message_body")
        return

    # Normalize reply — handle uppercase, lowercase, spaces
    reply = message_body.strip().upper()

    # Only act on YES or NO
    if reply not in ['YES', 'NO']:
        logger.info(f"Ignoring non-YES/NO reply from {from_number}: '{message_body}'")
        return

    # ── Find the matching outpass ──────────────────────────────────
    # Match by parent_phone AND parent_status = 'pending'
    # Get the most recent one if multiple exist
    try:
        outpass = (
            Outpass.objects
            .filter(parent_phone=from_number, parent_status='pending')
            .order_by('-created_at')
            .first()
        )
    except Exception as e:
        logger.error(f"DB error while looking up outpass for {from_number}: {e}")
        return

    if not outpass:
        logger.warning(f"No pending outpass found for parent phone: {from_number}")
        return

    # ── Update parent_status based on reply ───────────────────────
    if reply == 'YES':
        outpass.parent_status = 'approved'
        logger.info(f"Parent APPROVED outpass OP{str(outpass.id).zfill(4)}")
    else:
        outpass.parent_status = 'rejected'
        logger.info(f"Parent REJECTED outpass OP{str(outpass.id).zfill(4)}")

    # Record the exact time the parent replied
    outpass.parent_response_time = timezone.now()

    # Save only the changed fields (efficient DB update)
    outpass.save(update_fields=['parent_status', 'parent_response_time'])

    logger.info(
        f"Outpass OP{str(outpass.id).zfill(4)} parent_status updated to "
        f"'{outpass.parent_status}' at {outpass.parent_response_time}"
    )
