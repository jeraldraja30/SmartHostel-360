"""
WhatsApp Webhook Endpoint.

Handles incoming messages (parent replies) via Twilio.
"""
import logging
from django.http import HttpResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class WhatsAppWebhookView(View):
    """
    Handles Twilio incoming WhatsApp messages.
    """

    def get(self, request):
        """
        Twilio doesn't typically do GET challenge verify, but we can leave it returning 200.
        """
        return HttpResponse('Webhook is active.', status=200)

    def post(self, request):
        """
        Handle incoming WhatsApp messages from Twilio (parent replies).
        Twilio sends data as application/x-www-form-urlencoded.
        """
        try:
            # Log request headers for debugging
            logger.debug(f"Webhook headers: {dict(request.META)}")
            logger.debug(f"Webhook POST data: {dict(request.POST)}")

            from_number = request.POST.get('From', '').strip()
            message_body = request.POST.get('Body', '').strip()
            message_sid = request.POST.get('MessageSid', '').strip()

            logger.info(f"Received Twilio WhatsApp message from {from_number}: '{message_body}' (SID: {message_sid})")

            if not from_number or not message_body:
                logger.warning("Twilio webhook payload missing 'From' or 'Body'. This might be a status callback.")
                return HttpResponse('<Response></Response>', content_type='text/xml', status=200)

            # Validate 'From' number format (should be whatsapp:+XX...)
            if not from_number.startswith('whatsapp:'):
                logger.warning(f"Invalid 'From' format: {from_number}. Expected 'whatsapp:+...' format")
                return HttpResponse('<Response></Response>', content_type='text/xml', status=200)

            # Process the parent's YES/NO reply
            from .webhook_processor import process_parent_reply
            process_parent_reply(from_number, message_body)

            # Always return 200 with Empty TwiML to Twilio
            logger.debug(f"Webhook response: 200 OK with empty TwiML")
            return HttpResponse('<Response></Response>', content_type='text/xml', status=200)

        except Exception as e:
            logger.error(f"Webhook processing error: {str(e)}", exc_info=True)
            # Even on error, return TwiML to prevent Twilio retry looping
            return HttpResponse('<Response></Response>', content_type='text/xml', status=200)
