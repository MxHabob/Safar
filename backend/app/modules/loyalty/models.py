"""
نماذج برنامج الولاء - Loyalty Program Models
From Prisma Schema
"""
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, DateTime, Index, ForeignKey, Numeric
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB, ARRAY

from app.shared.base import BaseModel


class LoyaltyProgram(BaseModel):
    """
    جدول برامج الولاء
    Loyalty programs table
    """
    __tablename__ = "loyalty_programs"
    
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    tiers = Column(JSONB, default=dict, nullable=False)  # Tier definitions
    
    # Relationships
    ledger = relationship("LoyaltyLedger", back_populates="program", lazy="selectin")
    
    __table_args__ = (
        Index("idx_loyalty_program_code", "code"),
    )


class LoyaltyLedger(BaseModel):
    """
    جدول سجل نقاط الولاء
    Loyalty ledger table
    """
    __tablename__ = "loyalty_ledgers"
    
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    program_id = Column(String(40), ForeignKey("loyalty_programs.id", ondelete="CASCADE"), nullable=False, index=True)
    balance = Column(Integer, default=0, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    transactions = Column(ARRAY(JSONB), default=[], nullable=False)  # Transaction history
    
    # Relationships
    user = relationship("User", back_populates="loyalty_ledgers", lazy="selectin")
    program = relationship("LoyaltyProgram", back_populates="ledger", lazy="selectin")
    
    __table_args__ = (
        Index("idx_loyalty_ledger_user_program", "user_id", "program_id", unique=True),
    )

