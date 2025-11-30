#!/usr/bin/env python3
"""
Script to generate a secure SECRET_KEY for the .env file
Usage: python generate-secret-key.py
"""
import secrets

def generate_secret_key():
    """Generate a cryptographically secure random key"""
    key = secrets.token_hex(32)  # 32 bytes = 64 hex characters
    print(f"Generated SECRET_KEY: {key}")
    print(f"\nAdd this to your .env file:")
    print(f"SECRET_KEY={key}")
    return key

if __name__ == "__main__":
    generate_secret_key()

