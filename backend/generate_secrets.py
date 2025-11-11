"""Generate secret keys for .env file"""

import secrets


def generate_secret_key(length: int = 32) -> str:
    """Generate a cryptographically secure secret key"""
    return secrets.token_hex(length)


if __name__ == "__main__":
    print("=== Secret Key Generator ===\n")
    print("Copy these values to your .env file:\n")
    print(f"SECRET_KEY={generate_secret_key()}")
    print(f"JWT_SECRET_KEY={generate_secret_key()}\n")
    print("⚠️  Keep these secret and never commit them to version control!")
