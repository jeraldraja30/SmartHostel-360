"""
Serializers for authentication and user management.
"""
import logging
from django.db import transaction
from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .utils import generate_hosteler_id, generate_hosteler_id_from_room

logger = logging.getLogger('django')


# ─────────────────────────────────────────────────────────────────────────────
# User Serializer  (returned in every login/register/profile response)
# ─────────────────────────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    """Read-only serializer for User model — returned in login/register responses."""

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email',
            'role', 'hosteler_id',
            # Student profile fields
            'full_name', 'address', 'phone_number',
            # Legacy / extra
            'first_name', 'last_name', 'mobile',
        ]
        read_only_fields = ['id']


# ─────────────────────────────────────────────────────────────────────────────
# Login Serializer
# ─────────────────────────────────────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    """Authenticate a user and return the user object."""

    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if not (username and password):
            raise serializers.ValidationError('Must include username and password.')

        logger.debug(f'[LOGIN] Attempting authentication for: {username}')
        user = authenticate(username=username, password=password)

        if not user:
            logger.warning(f'[LOGIN] ❌ Authentication failed for: {username}')
            raise serializers.ValidationError('Invalid credentials.')

        if not user.is_active:
            logger.warning(f'[LOGIN] ❌ Inactive account: {username}')
            raise serializers.ValidationError('User account is disabled.')

        # ── Safety net: auto-fix missing hosteler_id for students ─────────────
        if user.role == 'student' and not user.hosteler_id:
            new_id = generate_hosteler_id()
            user.hosteler_id = new_id
            user.save(update_fields=['hosteler_id'])
            logger.warning(
                f'[LOGIN] ⚠️  Student "{username}" had no hosteler_id — '
                f'auto-assigned "{new_id}" at login.'
            )

        logger.info(
            f'[LOGIN] ✅ Authentication OK: {username} '
            f'(role={user.role}, hosteler_id="{user.hosteler_id}")'
        )
        data['user'] = user
        return data


# ─────────────────────────────────────────────────────────────────────────────
# Token Response Serializer
# ─────────────────────────────────────────────────────────────────────────────

class TokenResponseSerializer(serializers.Serializer):
    """Helper that packages JWT tokens + user data into the API response."""

    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()

    @staticmethod
    def get_token_for_user(user):
        """Generate JWT tokens for a user and return the full response payload."""
        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }


# ─────────────────────────────────────────────────────────────────────────────
# Register Serializer  (self-registration by students/wardens directly)
# ─────────────────────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user self-registration.

    Key behaviours:
    - hosteler_id is READ-ONLY (always auto-generated for students).
    - For role='student': generates hosteler_id AND creates a linked Hosteler profile atomically.
    - For role='warden'/'admin': hosteler_id is left blank.
    - Prevents duplicate usernames.
    """

    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
    )
    # hosteler_id is output-only — clients must NOT send it.
    hosteler_id = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'password', 'email',
            'first_name', 'last_name', 'role', 'mobile',
            'full_name', 'address', 'phone_number',
            'hosteler_id',
        ]

    def validate_username(self, value):
        """Prevent duplicate usernames."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                f'Username "{value}" is already taken. Please choose another.'
            )
        return value

    def validate_role(self, value):
        """Only allow defined roles."""
        allowed = {'student', 'warden', 'admin'}
        if value not in allowed:
            raise serializers.ValidationError(
                f'Invalid role "{value}". Allowed roles: {", ".join(sorted(allowed))}.'
            )
        return value

    def validate(self, data):
        """Cross-field validation."""
        data.pop('hosteler_id', None)
        return data

    @transaction.atomic
    def create(self, validated_data):
        role = validated_data.get('role', 'student')
        username = validated_data['username']

        # ── Determine hosteler_id ─────────────────────────────────────────────
        if role == 'student':
            hosteler_id = generate_hosteler_id()
            logger.info(f'[REGISTER] Generated hosteler_id="{hosteler_id}" for "{username}"')
        else:
            hosteler_id = ''

        # ── Create User ───────────────────────────────────────────────────────
        phone = validated_data.get('phone_number', '') or validated_data.get('mobile', '')
        user = User.objects.create_user(
            username=username,
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=role,
            mobile=phone,
            phone_number=phone,
            full_name=validated_data.get('full_name', ''),
            address=validated_data.get('address', ''),
            hosteler_id=hosteler_id,
        )

        # ── Auto-create Hosteler profile for students ─────────────────────────
        if role == 'student':
            try:
                from hostel.models import Hosteler
                full_name = validated_data.get('full_name', '') or \
                    f"{validated_data.get('first_name', '')} {validated_data.get('last_name', '')}".strip()
                display_name = full_name or username

                Hosteler.objects.create(
                    hosteler_id=hosteler_id,
                    name=display_name,
                    gender='male',
                    age=18,
                    mobile=phone,
                    email=validated_data.get('email', ''),
                    address=validated_data.get('address', ''),
                )
                logger.info(
                    f'[REGISTER] ✅ Created Hosteler profile '
                    f'"{hosteler_id}" for "{username}"'
                )
            except Exception as exc:
                logger.warning(
                    f'[REGISTER] ⚠️  Could not auto-create Hosteler profile for '
                    f'"{username}": {exc}'
                )

        logger.info(
            f'[REGISTER] ✅ New {role} account: username="{username}" '
            f'hosteler_id="{hosteler_id}"'
        )
        return user


# ─────────────────────────────────────────────────────────────────────────────
# AdminStudentCreateSerializer  (Admin creates a student with room assignment)
# ─────────────────────────────────────────────────────────────────────────────

class AdminStudentCreateSerializer(serializers.Serializer):
    """
    Admin-only serializer to create a student with room + bed assignment.

    Auto-generates hosteler_id in format: H<year><floor><room><bed>
    Example: floor=1, room=2, bed=1 → H202601021

    Required fields:
        username, password, full_name, email, phone_number, floor, room, bed

    Optional fields:
        address
    """

    # ── Auth fields ───────────────────────────────────────────────────────────
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    # ── Student profile fields ────────────────────────────────────────────────
    full_name    = serializers.CharField(max_length=200)
    email        = serializers.EmailField()
    phone_number = serializers.CharField(max_length=15)
    address      = serializers.CharField(required=False, allow_blank=True, default='')

    # ── Room assignment fields ────────────────────────────────────────────────
    floor = serializers.IntegerField(min_value=1, max_value=2)
    room  = serializers.IntegerField(min_value=1, max_value=10)
    bed   = serializers.IntegerField(min_value=1, max_value=3)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                f'Username "{value}" is already taken.'
            )
        return value

    def validate(self, data):
        """
        Validate that the requested floor/room/bed is not already occupied.
        Also check if a student with this room+bed already exists.
        """
        floor = data['floor']
        room  = data['room']
        bed   = data['bed']

        proposed_id = generate_hosteler_id_from_room(floor, room, bed)

        # Check if this room/bed combo is already taken
        if User.objects.filter(hosteler_id=proposed_id).exists():
            raise serializers.ValidationError(
                f'Bed {bed} in Room {room} on Floor {floor} is already occupied '
                f'(hosteler_id={proposed_id}).'
            )

        # Also check the Hosteler table
        try:
            from hostel.models import Hosteler
            if Hosteler.objects.filter(hosteler_id=proposed_id).exists():
                raise serializers.ValidationError(
                    f'Bed {bed} in Room {room} on Floor {floor} is already recorded '
                    f'in Hosteler table (hosteler_id={proposed_id}).'
                )
        except ImportError:
            pass

        data['_hosteler_id'] = proposed_id
        return data

    @transaction.atomic
    def create(self, validated_data):
        hosteler_id  = validated_data['_hosteler_id']
        username     = validated_data['username']
        floor        = validated_data['floor']
        room_num     = validated_data['room']
        bed_num      = validated_data['bed']
        phone        = validated_data['phone_number']
        full_name    = validated_data['full_name']
        email        = validated_data['email']
        address      = validated_data.get('address', '')

        logger.info(
            f'[ADMIN-CREATE-STUDENT] Creating student: username="{username}" '
            f'hosteler_id="{hosteler_id}" floor={floor} room={room_num} bed={bed_num}'
        )

        # ── Create User ───────────────────────────────────────────────────────
        user = User.objects.create_user(
            username=username,
            password=validated_data['password'],
            email=email,
            role='student',
            full_name=full_name,
            address=address,
            phone_number=phone,
            mobile=phone,
            hosteler_id=hosteler_id,
        )

        # ── Find or create the Room record ────────────────────────────────────
        room_obj = None
        try:
            from rooms.models import Room
            # Try to find existing room by a consistent room_number convention
            room_number_str = f"F{floor}R{room_num:02d}"
            room_obj, created = Room.objects.get_or_create(
                room_number=room_number_str,
                defaults={
                    'block': 'a-block',
                    'floor': 'first' if floor == 1 else 'second',
                    'room_type': 'non-ac',
                    'bed_type': 'triple',
                    'total_beds': 3,
                    'available_beds': 3,
                    'room_rate': 5000.00,
                    'is_available': True,
                }
            )
            if not created and room_obj.available_beds <= 0:
                raise serializers.ValidationError(
                    f'Room {room_number_str} has no available beds.'
                )
            if not created:
                room_obj.allocate_bed()
        except Exception as exc:
            logger.warning(f'[ADMIN-CREATE-STUDENT] ⚠️ Room lookup/create failed: {exc}')
            room_obj = None

        # ── Create Hosteler profile linked to Room ────────────────────────────
        try:
            from hostel.models import Hosteler
            Hosteler.objects.create(
                hosteler_id=hosteler_id,
                name=full_name,
                gender='male',
                age=18,
                mobile=phone,
                email=email,
                address=address,
                room=room_obj,
                bed=str(bed_num),
            )
            logger.info(
                f'[ADMIN-CREATE-STUDENT] ✅ Hosteler profile created: '
                f'{hosteler_id} → room={room_obj}'
            )
        except Exception as exc:
            logger.warning(
                f'[ADMIN-CREATE-STUDENT] ⚠️ Could not create Hosteler profile: {exc}'
            )

        return user
