"""
Base Domain Entities
"""
from abc import ABC
from typing import Optional
from datetime import datetime
from app.core.id import ID


class DomainEntity(ABC):
    """Base class for domain entities"""
    
    def __init__(self, id: Optional[ID] = None, created_at: Optional[datetime] = None, updated_at: Optional[datetime] = None):
        self.id = id
        self.created_at = created_at
        self.updated_at = updated_at
    
    def __eq__(self, other):
        if not isinstance(other, DomainEntity):
            return False
        return self.id == other.id
    
    def __hash__(self):
        return hash(self.id)


class ValueObject(ABC):
    """Base class for value objects"""
    pass

