"""
Views for Outpass management.
Sends WhatsApp message to parent when outpass is created.
Includes test endpoint for WhatsApp debugging.
"""
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes as perm_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from .models import Outpass
from .serializers import OutpassSerializer
from .whatsapp_service import send_parent_approval_message, send_whatsapp_message

logger = logging.getLogger('whatsapp')


class OutpassViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Outpass CRUD operations.

    Endpoints:
    - GET    /api/outpasses/                    → List all outpasses
    - POST   /api/outpasses/                    → Create new outpass + send WhatsApp to parent
    - GET    /api/outpasses/{id}/               → Retrieve single outpass
    - PATCH  /api/outpasses/{id}/               → Partial update
    - DELETE /api/outpasses/{id}/               → Delete outpass
    - POST   /api/outpasses/{id}/set_status/    → Approve/Reject outpass (Warden only)
    """
    queryset = Outpass.objects.all().select_related('hosteler')
    serializer_class = OutpassSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter outpasses based on user role."""
        queryset = super().get_queryset()
        user = self.request.user

        # Students can only see their own outpasses
        if user.is_student and user.hosteler_id:
            from hostel.models import Hosteler
            try:
                hosteler = Hosteler.objects.get(hosteler_id=user.hosteler_id)
                queryset = queryset.filter(hosteler=hosteler)
            except Hosteler.DoesNotExist:
                queryset = queryset.none()

        return queryset

    def create(self, request, *args, **kwargs):
        """
        Create outpass request.
        After saving, automatically sends WhatsApp message to parent.
        
        Frontend must send:
        {
            "parent_phone": "919876543210",   ← parent's WhatsApp number
            "out_date": "2025-04-10",
            "return_date": "2025-04-12",
            "reason": "Family function",
            ...other fields
        }
        """
        print("\n" + "=" * 60)
        print("[OUTPASS] ── Creating new outpass request ──")
        print(f"[OUTPASS] Request data: {request.data}")
        print("=" * 60)
        
        logger.info(f"[OUTPASS] Creating outpass with data: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            outpass = serializer.save()
        except Exception as e:
            print("\n" + "!" * 60)
            print("[OUTPASS] ❌ ERROR ❌")
            if hasattr(e, 'detail'):
                print(f"[OUTPASS] Error Details: {e.detail}")
            else:
                import traceback
                traceback.print_exc()
                print(f"[OUTPASS] Error: {e}")
            print("!" * 60 + "\n")
            raise e
        
        print(f"[OUTPASS] ✅ Outpass saved! ID: {outpass.id}")
        print(f"[OUTPASS] Parent phone from form: '{outpass.parent_phone}'")
        logger.info(f"[OUTPASS] Outpass {outpass.id} saved successfully")

        # ── Send WhatsApp message to parent ──────────────────────────
        print("[OUTPASS] ── Triggering WhatsApp message to parent ──")
        whatsapp_result = send_parent_approval_message(outpass)
        
        print(f"[OUTPASS] WhatsApp result: {whatsapp_result}")
        logger.info(f"[OUTPASS] WhatsApp result for outpass {outpass.id}: {whatsapp_result}")

        if whatsapp_result['success']:
            # Save the WhatsApp message ID so we can track parent's reply
            message_id = whatsapp_result.get('message_sid') or whatsapp_result.get('message_id', '')
            outpass.whatsapp_message_id = message_id
            outpass.save(update_fields=['whatsapp_message_id'])
            print(f"[OUTPASS] ✅ WhatsApp message ID saved: {message_id}")
        else:
            print(f"[OUTPASS] ⚠️  WhatsApp send FAILED: {whatsapp_result.get('error')}")
            logger.warning(f"[OUTPASS] WhatsApp failed for outpass {outpass.id}: {whatsapp_result.get('error')}")

        # Return the outpass data + WhatsApp send status
        response_data = self.get_serializer(outpass).data
        response_data['whatsapp_sent'] = whatsapp_result['success']

        if not whatsapp_result['success']:
            # Still created the outpass, just warn about WhatsApp
            response_data['whatsapp_error'] = whatsapp_result.get('error', 'Unknown error')

        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def set_status(self, request, pk=None):
        """
        Custom action to approve/reject outpass (Warden only).
        POST /api/outpasses/{id}/set_status/
        Body: {"status": "approved"/"rejected", "warden_reply": "optional message"}
        """
        from core.permissions import IsWarden
        
        outpass = self.get_object()
        new_status = request.data.get('status')
        warden_reply = request.data.get('warden_reply', '')

        if new_status not in ['approved', 'rejected']:
            return Response(
                {'error': 'Invalid status. Must be "approved" or "rejected"'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_status == 'approved' and getattr(outpass, 'parent_status', 'pending') != 'approved':
            return Response(
                {'error': 'Cannot approve outpass. Parent has not approved yet!'},
                status=status.HTTP_400_BAD_REQUEST
            )

        outpass.status = new_status
        outpass.approved_by = request.user.get_full_name() or request.user.username
        outpass.approved_on = timezone.now()
        outpass.warden_reply = warden_reply
        outpass.save()

        serializer = self.get_serializer(outpass)
        return Response(serializer.data)


# ═══════════════════════════════════════════════════════════════
# TEST ENDPOINT — /api/test-whatsapp/
# ═══════════════════════════════════════════════════════════════

@csrf_exempt
def test_whatsapp_view(request):
    """
    Test endpoint to verify WhatsApp integration works.
    
    GET  /api/test-whatsapp/                        → sends to default test number from settings
    GET  /api/test-whatsapp/?phone=919876543210      → sends to specified number
    POST /api/test-whatsapp/  {"phone": "919876543210", "message": "optional custom message"}
    
    Returns JSON with success/failure and debugging info.
    """
    import json
    from django.conf import settings
    
    print("\n" + "=" * 60)
    print("[TEST-WA] ══ WhatsApp Test Endpoint Hit ══")
    print(f"[TEST-WA] Method: {request.method}")
    print("=" * 60)
    
    # Get phone number from request
    if request.method == 'POST':
        try:
            body = json.loads(request.body) if request.body else {}
        except json.JSONDecodeError:
            body = {}
        phone = body.get('phone', '')
        custom_message = body.get('message', '')
    else:
        phone = request.GET.get('phone', '')
        custom_message = request.GET.get('message', '')
    
    # Use test phone from settings if not provided
    if not phone:
        phone = getattr(settings, 'TWILIO_TEST_PHONE', '')
    
    if not phone:
        error_response = {
            'success': False,
            'error': 'No phone number provided!',
            'usage': {
                'GET': '/api/test-whatsapp/?phone=919876543210',
                'POST': '{"phone": "919876543210", "message": "optional"}',
                'tip': 'Or set TWILIO_TEST_PHONE in .env file',
            },
            'setup_checklist': {
                '1_twilio_credentials': 'Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env',
                '2_sandbox_join': 'Parent must send "join <word>" to +14155238886 on WhatsApp',
                '3_phone_format': 'Use format: 919876543210 (country code + number, no +)',
            }
        }
        print(f"[TEST-WA] ❌ No phone number provided")
        return JsonResponse(error_response, status=400)
    
    # Build test message
    if not custom_message:
        custom_message = (
            "🧪 *SmartHostel 360 — WhatsApp Test*\n\n"
            "If you received this message, your WhatsApp integration is working correctly! ✅\n\n"
            f"_Sent at: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}_"
        )
    
    print(f"[TEST-WA] Phone: {phone}")
    print(f"[TEST-WA] Message: {custom_message[:50]}...")
    
    # ── Check Twilio credentials first ───────────────────────────
    account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
    auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
    from_number = getattr(settings, 'TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886')
    
    config_status = {
        'TWILIO_ACCOUNT_SID': '✅ Set' if account_sid else '❌ MISSING',
        'TWILIO_AUTH_TOKEN': '✅ Set' if auth_token else '❌ MISSING',
        'TWILIO_WHATSAPP_FROM': from_number,
    }
    print(f"[TEST-WA] Config: {config_status}")
    
    # ── Send the message ─────────────────────────────────────────
    result = send_whatsapp_message(phone=phone, message=custom_message, max_retries=2)
    
    # ── Build response ───────────────────────────────────────────
    response = {
        'success': result['success'],
        'config': config_status,
        'phone_sent_to': phone,
    }
    
    if result['success']:
        response['message'] = 'Message sent successfully! ✅'
        response['message_sid'] = result.get('message_sid', '')
        response['twilio_status'] = result.get('status', '')
        print(f"[TEST-WA] ✅ SUCCESS — SID: {result.get('message_sid')}")
    else:
        response['message'] = f"Failed to send: {result.get('error', 'Unknown error')}"
        response['error'] = result.get('error', '')
        response['error_code'] = result.get('error_code', '')
        response['troubleshooting'] = {
            'step_1': 'Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env',
            'step_2': 'Has the parent joined the sandbox? They must send "join <word>" to +14155238886',
            'step_3': 'Is the phone number a valid WhatsApp number?',
            'step_4': 'Check your Twilio console logs: https://console.twilio.com/us1/monitor/logs/sms',
        }
        print(f"[TEST-WA] ❌ FAILED — {result.get('error')}")
    
    print("=" * 60 + "\n")
    
    http_status = 200 if result['success'] else 500
    return JsonResponse(response, status=http_status)
