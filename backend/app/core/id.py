import uuid
import base58
from typing import Annotated
from pydantic import PlainSerializer
from pydantic.functional_validators import AfterValidator
from pydantic.json_schema import WithJsonSchema

MAX_ID_LENGTH = 40
SEPARATOR = "_"
MIN_RANDOM_LENGTH = 8



def _random_bytes() -> bytes:
    if hasattr(uuid, "uuid7"):
        return uuid.uuid7().bytes
    return uuid.uuid4().bytes


def _encode_bytes(data: bytes, length: int | None = None) -> str:
    encoded = base58.b58encode(data).decode().rstrip("=")
    if length is not None and len(encoded) > length:
        encoded = encoded[:length]
    return encoded


def generate_id(max_length: int = MAX_ID_LENGTH) -> str:
    base_length = max(MIN_RANDOM_LENGTH, min(max_length, 22))
    return _encode_bytes(_random_bytes(), base_length)


def _validate_id(v: str) -> str:
    clean = v.split(SEPARATOR)[-1]
    if len(clean) < MIN_RANDOM_LENGTH or len(v) > MAX_ID_LENGTH:
        raise ValueError(f"ID length invalid; got random='{len(clean)}', total='{len(v)}'")
    if not clean.replace("-", "").isalnum():
        raise ValueError("ID must be alphanumeric")
    return v


ID = Annotated[
    str,
    AfterValidator(_validate_id),
    PlainSerializer(lambda x: x),
    WithJsonSchema({"type": "string", "example": "7X9kP2mN4vL8sQ1tR3uJ", "maxLength": MAX_ID_LENGTH}),
]


def generate_typed_id(prefix: str) -> str:
    random_part_max = MAX_ID_LENGTH - len(prefix) - len(SEPARATOR)
    if random_part_max < MIN_RANDOM_LENGTH:
        raise ValueError(f"Prefix '{prefix}' too long for max length {MAX_ID_LENGTH}")
    random_part = generate_id(max_length=random_part_max)
    return f"{prefix}{SEPARATOR}{random_part}"