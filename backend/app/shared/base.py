"""
Base classes للموديلات - Base classes for models
"""
from datetime import datetime
from typing import Any
from sqlalchemy import Column, Integer, DateTime, func, String
from sqlalchemy.ext.declarative import declared_attr
from app.core.database import Base
from app.core.id import generate_typed_id


class TimestampMixin:
    """Mixin لإضافة timestamps تلقائية - Automatic timestamps mixin"""
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class BaseModel(Base, TimestampMixin):
    """Base model لجميع الجداول - Base model for all tables"""
    
    __abstract__ = True
    
    @declared_attr
    def id(cls):
        """Generate typed ID based on table name"""
        # Get table name prefix (first 4 chars uppercase)
        if hasattr(cls, '__tablename__'):
            table_name = cls.__tablename__
            prefix = table_name.upper()[:4] if len(table_name) >= 4 else table_name.upper()
        else:
            prefix = "TBL"
        return Column(String(40), primary_key=True, index=True, default=lambda: generate_typed_id(prefix))
    
    def to_dict(self) -> dict[str, Any]:
        """تحويل الموديل إلى dictionary - Convert model to dictionary"""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }


class StringIDBaseModel(Base, TimestampMixin):
    """Base model للجداول التي تستخدم String ID - Base model for tables using String ID"""
    
    __abstract__ = True
    
    @declared_attr
    def id(cls):
        """Generate typed ID based on table name"""
        # Get table name prefix (first 4 chars uppercase)
        if hasattr(cls, '__tablename__'):
            table_name = cls.__tablename__
            prefix = table_name.upper()[:4] if len(table_name) >= 4 else table_name.upper()
        else:
            prefix = "TBL"
        return Column(String(40), primary_key=True, index=True, default=lambda: generate_typed_id(prefix))
    
    def to_dict(self) -> dict[str, Any]:
        """تحويل الموديل إلى dictionary - Convert model to dictionary"""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }

