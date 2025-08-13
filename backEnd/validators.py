import re
from fastapi import HTTPException, status

MIN_LEN = 8

LOWER_RE = re.compile(r"[a-z]")
UPPER_RE = re.compile(r"[A-Z]")
DIGIT_RE = re.compile(r"\d")

# a special char validation below
# SPECIAL_RE = re.compile(r"[^A-Za-z0-9]")

def validate_password_or_400(password: str) -> None:
    """
    Validates the password and raises a 400 with a helpful, specific message
    telling the user exactly which requirements are missing.
    """
    pw = password or ""
    missing_parts = []

    if len(pw) < MIN_LEN:
        missing_parts.append(f"at least {MIN_LEN} characters")
    if not LOWER_RE.search(pw):
        missing_parts.append("a lowercase letter (a-z)")
    if not UPPER_RE.search(pw):
        missing_parts.append("an uppercase letter (A-Z)")
    if not DIGIT_RE.search(pw):
        missing_parts.append("a number (0-9)")

    #     missing_parts.append("a special character (!@#$% etc.)")

    if missing_parts:
        # Single, readable string (works nicely with your frontend error handling)
        details = "Password must include: " + ", ".join(missing_parts) + "."
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=details
        )
