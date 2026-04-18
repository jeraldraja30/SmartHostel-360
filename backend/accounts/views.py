"""
Views for authentication and RBAC-based user management.

Endpoints:
    POST /api/auth/login/                → LoginView
    POST /api/auth/register/             → RegisterView
    GET  /api/auth/profile/              → UserProfileView

Admin-only:
    POST   /api/admin/add-student/       → AdminAddStudentView
    DELETE /api/admin/remove-student/    → AdminRemoveStudentView
    PUT    /api/admin/update-room/       → AdminUpdateRoomView

Admin + Warden:
    GET /api/rooms/                      → rooms app
    GET /api/warden/students/            → WardenListStudentsView

Student-only:
    GET /api/student/me/                 → StudentMeView
    GET /api/student/my-room/            → StudentMyRoomView
"""
import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .serializers import (
    LoginSerializer,
    TokenResponseSerializer,
    UserSerializer,
    RegisterSerializer,
    AdminStudentCreateSerializer,
)

logger = logging.getLogger('django')


# ─────────────────────────────────────────────────────────────────────────────
# Auth Views
# ─────────────────────────────────────────────────────────────────────────────

class LoginView(APIView):
    """
    POST /api/auth/login/

    Authenticate a user and return JWT tokens + full user profile.

    Response:
        {
            "success": true,
            "access":  "<JWT>",
            "refresh": "<JWT>",
            "user": {
                "id": 1,
                "username": "raja",
                "role": "student",
                "hosteler_id": "H202601021",
                "full_name": "Raja",
                "address": "Chennai",
                "email": "raja@email.com",
                "phone_number": "9876543210"
            }
        }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '')
        logger.debug(f'[LOGIN-VIEW] Attempt: username="{username}"')

        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token_data = TokenResponseSerializer.get_token_for_user(user)
            token_data['success'] = True

            logger.info(
                f'[LOGIN-VIEW] ✅ OK: {user.username} '
                f'role={user.role} hosteler_id="{user.hosteler_id}"'
            )
            return Response(token_data, status=status.HTTP_200_OK)

        error_msg = serializer.errors.get('non_field_errors', ['Invalid credentials'])[0]
        logger.warning(f'[LOGIN-VIEW] ❌ FAILED for "{username}": {error_msg}')
        return Response(
            {'success': False, 'error': str(error_msg)},
            status=status.HTTP_200_OK,
        )


class RegisterView(APIView):
    """
    POST /api/auth/register/

    Register a new user. hosteler_id is AUTO-GENERATED — do NOT send it.

    Minimal request body for a student:
        {
            "username": "raja",
            "password": "Secret@123",
            "role": "student",
            "full_name": "Raja",
            "email": "raja@email.com",
            "phone_number": "9876543210"
        }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '')
        role = request.data.get('role', 'student')
        logger.debug(f'[REGISTER-VIEW] Attempt: username="{username}" role="{role}"')

        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token_data = TokenResponseSerializer.get_token_for_user(user)
            token_data['success'] = True

            logger.info(
                f'[REGISTER-VIEW] ✅ Registered: username="{user.username}" '
                f'role={user.role} hosteler_id="{user.hosteler_id}"'
            )
            return Response(token_data, status=status.HTTP_201_CREATED)

        errors = serializer.errors
        priority = ['username', 'email', 'password', 'role', 'non_field_errors']
        error_msg = None
        for field in priority:
            if field in errors:
                error_msg = errors[field][0]
                break
        if not error_msg and errors:
            first_field = next(iter(errors))
            error_msg = f"{first_field}: {errors[first_field][0]}"
        error_msg = error_msg or 'Registration failed.'

        logger.warning(f'[REGISTER-VIEW] ❌ FAILED for "{username}": {error_msg} | {errors}')
        return Response(
            {'success': False, 'error': str(error_msg)},
            status=status.HTTP_200_OK,
        )


class UserProfileView(APIView):
    """
    GET /api/auth/profile/

    Return the authenticated user's full profile (including hosteler_id).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# ─────────────────────────────────────────────────────────────────────────────
# Admin-only Views
# ─────────────────────────────────────────────────────────────────────────────

class AdminAddStudentView(APIView):
    """
    POST /api/admin/add-student/

    Admin creates a student with room assignment and auto-generated hosteler_id.

    Request body:
        {
            "username": "raja",
            "password": "password123",
            "full_name": "Raja Jerald",
            "email": "raja@email.com",
            "phone_number": "9876543210",
            "address": "Chennai, TN",   ← optional
            "floor": 1,
            "room": 2,
            "bed": 1
        }

    Response:
        {
            "success": true,
            "message": "Student created successfully.",
            "user": {
                "username": "raja",
                "role": "student",
                "hosteler_id": "H202601021",
                "full_name": "Raja Jerald",
                "email": "raja@email.com",
                "phone_number": "9876543210"
            },
            "assignment": {
                "floor": 1,
                "room": 2,
                "bed": 1,
                "hosteler_id": "H202601021"
            }
        }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Only admins can use this endpoint
        if not hasattr(request.user, 'role') or request.user.role != 'admin':
            return Response(
                {'success': False, 'error': 'Only admins can create student accounts.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AdminStudentCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            logger.info(
                f'[ADMIN-ADD-STUDENT] ✅ Created by {request.user.username}: '
                f'username="{user.username}" hosteler_id="{user.hosteler_id}"'
            )
            return Response(
                {
                    'success': True,
                    'message': 'Student created successfully.',
                    'user': UserSerializer(user).data,
                    'assignment': {
                        'floor': serializer.validated_data['floor'],
                        'room':  serializer.validated_data['room'],
                        'bed':   serializer.validated_data['bed'],
                        'hosteler_id': user.hosteler_id,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        logger.warning(
            f'[ADMIN-ADD-STUDENT] ❌ Validation failed: {serializer.errors}'
        )
        return Response(
            {'success': False, 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )


class AdminRemoveStudentView(APIView):
    """
    DELETE /api/admin/remove-student/

    Admin deletes a student account and their Hosteler profile.

    Request body:
        { "username": "raja" }
      OR
        { "hosteler_id": "H202601021" }
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        if not hasattr(request.user, 'role') or request.user.role != 'admin':
            return Response(
                {'success': False, 'error': 'Only admins can remove student accounts.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        username    = request.data.get('username')
        hosteler_id = request.data.get('hosteler_id')

        from .models import User as UserModel
        try:
            if username:
                student = UserModel.objects.get(username=username, role='student')
            elif hosteler_id:
                student = UserModel.objects.get(hosteler_id=hosteler_id, role='student')
            else:
                return Response(
                    {'success': False, 'error': 'Provide username or hosteler_id.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except UserModel.DoesNotExist:
            return Response(
                {'success': False, 'error': 'Student not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Also remove Hosteler profile
        try:
            from hostel.models import Hosteler
            hosteler_profile = Hosteler.objects.filter(hosteler_id=student.hosteler_id)
            if hosteler_profile.exists():
                # Free up the bed in the room
                room = hosteler_profile.first().room
                if room:
                    room.deallocate_bed()
                hosteler_profile.delete()
        except Exception as exc:
            logger.warning(f'[ADMIN-REMOVE-STUDENT] Could not remove Hosteler profile: {exc}')

        deleted_info = {
            'username': student.username,
            'hosteler_id': student.hosteler_id,
        }
        student.delete()
        logger.info(
            f'[ADMIN-REMOVE-STUDENT] ✅ Deleted by {request.user.username}: {deleted_info}'
        )
        return Response(
            {'success': True, 'message': 'Student removed.', 'deleted': deleted_info},
            status=status.HTTP_200_OK,
        )


class AdminUpdateRoomView(APIView):
    """
    PUT /api/admin/update-room/

    Admin updates a student's room/bed assignment.

    Request body:
        {
            "hosteler_id": "H202601021",   ← student to update
            "floor": 1,
            "room": 3,
            "bed": 2
        }
    """
    permission_classes = [IsAuthenticated]

    def put(self, request):
        if not hasattr(request.user, 'role') or request.user.role != 'admin':
            return Response(
                {'success': False, 'error': 'Only admins can update room assignments.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        hosteler_id = request.data.get('hosteler_id')
        floor = request.data.get('floor')
        room  = request.data.get('room')
        bed   = request.data.get('bed')

        if not all([hosteler_id, floor, room, bed]):
            return Response(
                {'success': False, 'error': 'hosteler_id, floor, room and bed are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .models import User as UserModel
        try:
            student = UserModel.objects.get(hosteler_id=hosteler_id, role='student')
        except UserModel.DoesNotExist:
            return Response(
                {'success': False, 'error': f'Student with hosteler_id={hosteler_id} not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            floor = int(floor)
            room  = int(room)
            bed   = int(bed)
        except (ValueError, TypeError):
            return Response(
                {'success': False, 'error': 'floor, room, bed must be integers.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate ranges
        if floor not in (1, 2) or not (1 <= room <= 10) or not (1 <= bed <= 3):
            return Response(
                {'success': False, 'error': 'floor: 1-2, room: 1-10, bed: 1-3.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_hosteler_id = f"H{__import__('datetime').datetime.now().year}{floor}{room:02d}{bed}"

        # Check if new slot is already taken by someone else
        if UserModel.objects.filter(hosteler_id=new_hosteler_id).exclude(pk=student.pk).exists():
            return Response(
                {'success': False, 'error': f'Bed is already occupied (hosteler_id={new_hosteler_id}).'},
                status=status.HTTP_409_CONFLICT,
            )

        old_id = student.hosteler_id
        student.hosteler_id = new_hosteler_id
        student.save(update_fields=['hosteler_id'])

        # Update Hosteler profile if it exists
        try:
            from hostel.models import Hosteler
            from rooms.models import Room
            profile = Hosteler.objects.get(hosteler_id=old_id)
            # Free old bed
            if profile.room:
                profile.room.deallocate_bed()
            # Assign new room
            room_number_str = f"F{floor}R{room:02d}"
            new_room, _ = Room.objects.get_or_create(
                room_number=room_number_str,
                defaults={
                    'block': 'a-block',
                    'floor': 'first' if floor == 1 else 'second',
                    'room_type': 'non-ac',
                    'bed_type': 'triple',
                    'total_beds': 3,
                    'available_beds': 3,
                    'room_rate': 5000.00,
                }
            )
            new_room.allocate_bed()
            profile.hosteler_id = new_hosteler_id
            profile.room = new_room
            profile.bed  = str(bed)
            profile.save()
        except Exception as exc:
            logger.warning(f'[ADMIN-UPDATE-ROOM] Could not update Hosteler profile: {exc}')

        logger.info(
            f'[ADMIN-UPDATE-ROOM] ✅ {request.user.username} moved student '
            f'"{student.username}": {old_id} → {new_hosteler_id}'
        )
        return Response(
            {
                'success': True,
                'message': 'Room updated.',
                'old_hosteler_id': old_id,
                'new_hosteler_id': new_hosteler_id,
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Warden Views  (Warden + Admin can access these)
# ─────────────────────────────────────────────────────────────────────────────

class WardenListStudentsView(APIView):
    """
    GET /api/warden/students/

    Returns all student user profiles.
    Accessible by both 'warden' and 'admin' roles.

    Response:
        [
            {
                "id": 1,
                "username": "raja",
                "role": "student",
                "hosteler_id": "H202601021",
                "full_name": "Raja Jerald",
                ...
            },
            ...
        ]
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'role') or user.role not in ('warden', 'admin'):
            return Response(
                {'success': False, 'error': 'Only wardens and admins can access student records.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        from .models import User as UserModel
        students = UserModel.objects.filter(role='student').order_by('-date_joined')
        serializer = UserSerializer(students, many=True)
        logger.info(
            f'[WARDEN-LIST-STUDENTS] {user.username} fetched {students.count()} student records.'
        )
        return Response({'success': True, 'students': serializer.data, 'count': students.count()})


# ─────────────────────────────────────────────────────────────────────────────
# Student Self-service Views
# ─────────────────────────────────────────────────────────────────────────────

class StudentMeView(APIView):
    """
    GET /api/student/me/

    Returns the logged-in student's full profile data.
    Response auto-fetched after login — no manual entry needed.

    Response:
        {
            "id": 5,
            "username": "raja",
            "role": "student",
            "hosteler_id": "H202601021",
            "full_name": "Raja Jerald",
            "email": "raja@email.com",
            "phone_number": "9876543210",
            "address": "Chennai, TN"
        }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'student':
            return Response(
                {'error': 'This endpoint is for students only.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(UserSerializer(request.user).data)


class StudentMyRoomView(APIView):
    """
    GET /api/student/my-room/

    Returns the logged-in student's room and bed assignment.

    Response:
        {
            "hosteler_id": "H202601021",
            "floor": 1,
            "room": 2,
            "bed": 1,
            "room_number": "F1R02",
            "room_details": { ... }
        }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'student':
            return Response(
                {'error': 'This endpoint is for students only.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = request.user
        hid  = user.hosteler_id

        if not hid:
            return Response(
                {'error': 'No hosteler_id found. Please contact admin.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Try Hosteler profile first
        try:
            from hostel.models import Hosteler
            profile = Hosteler.objects.select_related('room').get(hosteler_id=hid)
            room_data = None
            if profile.room:
                from rooms.serializers import RoomSerializer
                room_data = RoomSerializer(profile.room).data

            return Response({
                'hosteler_id': hid,
                'bed': profile.bed,
                'room_number': profile.room.room_number if profile.room else None,
                'room_details': room_data,
            })
        except Exception as exc:
            logger.warning(f'[STUDENT-MY-ROOM] Hosteler profile lookup failed: {exc}')

        # Fallback: parse floor/room/bed from hosteler_id (H<year><floor><room><bed>)
        try:
            from datetime import datetime
            year_str = str(datetime.now().year)
            remainder = hid[len('H') + len(year_str):]
            if len(remainder) >= 4:
                floor   = int(remainder[0])
                room_no = int(remainder[1:3])
                bed_no  = int(remainder[3])
                return Response({
                    'hosteler_id': hid,
                    'floor': floor,
                    'room': room_no,
                    'bed': bed_no,
                    'room_number': f'F{floor}R{room_no:02d}',
                    'room_details': None,
                })
        except Exception as exc:
            logger.warning(f'[STUDENT-MY-ROOM] Could not parse hosteler_id "{hid}": {exc}')

        return Response(
            {'hosteler_id': hid, 'message': 'Room details not available.'},
            status=status.HTTP_200_OK,
        )
