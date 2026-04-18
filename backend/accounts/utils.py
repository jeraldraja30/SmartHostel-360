"""
accounts/utils.py
=================
Utility functions for the accounts app.

Includes:
    - generate_hosteler_id()              →  H<YYYY><NNN>          e.g. H2026001
    - generate_hosteler_id_from_room()   →  H<YYYY><F><RR><B>     e.g. H202601021
      Format: H + year + floor (1-2) + room (01-10 zero-padded) + bed (1-3)
"""
import logging
import random
from datetime import datetime

logger = logging.getLogger('django')


def generate_hosteler_id_from_room(floor: int, room: int, bed: int) -> str:
    """
    Generate hosteler ID in the format: H<YEAR><FLOOR><ROOM><BED>.

    Example:
        floor=1, room=2, bed=1  →  H202601021
        floor=2, room=10, bed=3 →  H202621003

    Args:
        floor: Floor number (1–2)
        room: Room number (1–10)
        bed: Bed number (1–3)

    Returns:
        str — e.g. 'H202601021'
    """
    year = datetime.now().year
    # Zero-pad room to 2 digits: 1→01, 10→10
    candidate_id = f"H{year}{floor}{room:02d}{bed}"
    logger.info(f"[HOSTELER-ID] Generated room-based ID: {candidate_id}")
    return candidate_id


def generate_hosteler_id() -> str:
    """
    Generate a unique hosteler ID in the format H<YEAR><NNN>.

    Strategy:
        1. Start with H + current year + 3-digit sequence.
        2. Check the database for collisions.
        3. Retry (up to 50 times) with an incremented/randomised suffix
           if a collision is found.

    Returns:
        str  — e.g. 'H2026001', 'H2026042'

    Raises:
        RuntimeError — if 50 collision-free attempts all fail (extremely unlikely).
    """
    # Import inside function to avoid circular imports at module load time.
    from .models import User

    year = datetime.now().year
    prefix = f"H{year}"

    # Find the highest existing ID for this year to pick the next sequence number.
    existing = (
        User.objects
        .filter(hosteler_id__startswith=prefix)
        .values_list('hosteler_id', flat=True)
    )

    # Also check the Hosteler table if it exists
    try:
        from hostel.models import Hosteler
        existing_hosteler = (
            Hosteler.objects
            .filter(hosteler_id__startswith=prefix)
            .values_list('hosteler_id', flat=True)
        )
    except Exception:
        existing_hosteler = []

    all_existing = set(existing) | set(existing_hosteler)

    # Extract numeric suffixes and find the maximum.
    max_seq = 0
    for hid in all_existing:
        suffix = hid[len(prefix):]
        if suffix.isdigit():
            max_seq = max(max_seq, int(suffix))

    # Build the new ID.
    for attempt in range(50):
        candidate_seq = max_seq + 1 + attempt
        candidate_id = f"{prefix}{candidate_seq:03d}"

        if candidate_id not in all_existing:
            logger.info(f"[HOSTELER-ID] Generated new ID: {candidate_id} (attempt {attempt + 1})")
            return candidate_id

    # Extreme fallback: random 6-digit suffix
    for _ in range(20):
        candidate_id = f"{prefix}{random.randint(1, 9999):04d}"
        if candidate_id not in all_existing:
            logger.warning(f"[HOSTELER-ID] Used random fallback ID: {candidate_id}")
            return candidate_id

    raise RuntimeError(
        f"[HOSTELER-ID] Could not generate a unique hosteler_id after 70 attempts. "
        f"Please check the database for year {year}."
    )
