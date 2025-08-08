# backend/auth.py
import requests
from jose import jwt
from fastapi import Header, HTTPException

COGNITO_REGION = "eu-north-1"
USER_POOL_ID = "eu-north-1_VX4lzVaon"          # <-- your pool id
CLIENT_ID = "5al6bqqs0k4pmcm35d3d7vjt02"       # <-- your app client id

ISSUER = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}"
JWKS_URL = f"{ISSUER}/.well-known/jwks.json"

_jwks = None

def _get_jwks():
    global _jwks
    if _jwks is None:
        _jwks = requests.get(JWKS_URL, timeout=5).json()
    return _jwks

def verify_cognito_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing/invalid Authorization header")
    token = authorization.split(" ", 1)[1]

    # Find key by kid
    unverified = jwt.get_unverified_header(token)
    kid = unverified.get("kid")
    key = next((k for k in _get_jwks()["keys"] if k["kid"] == kid), None)
    if not key:
        raise HTTPException(status_code=401, detail="JWKS key not found")

    try:
        claims = jwt.decode(
            token,
            key,
            algorithms=[key["alg"]],
            audience=CLIENT_ID,   # access token "aud" should be your app client id
            issuer=ISSUER,
            options={"verify_at_hash": False},
        )
        return claims
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token invalid: {e}")
