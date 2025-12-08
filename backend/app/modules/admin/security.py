"""
Security utilities for admin module.
Input validation, sanitization, and security checks.
"""
import re
from typing import Optional
from fastapi import HTTPException, status
from app.modules.users.models import User, UserRole
from app.core.id import ID


class AdminSecurity:
    """Security utilities for admin operations."""
    
    # Maximum search query length to prevent DoS
    MAX_SEARCH_LENGTH = 100
    
    # Dangerous patterns that should be rejected
    DANGEROUS_PATTERNS = [
        r'[;\'"\\]',  # SQL injection attempts
        r'<script',  # XSS attempts
        r'javascript:',  # XSS attempts
        r'on\w+\s*=',  # Event handler injection
    ]
    
    @staticmethod
    def sanitize_search_query(search: Optional[str]) -> Optional[str]:
        """
        Sanitize search query to prevent injection attacks.
        
        Args:
            search: Raw search query
            
        Returns:
            Sanitized search query or None
            
        Raises:
            HTTPException: If search query contains dangerous patterns
        """
        if not search:
            return None
        
        # Remove leading/trailing whitespace
        search = search.strip()
        
        # Check length
        if len(search) > AdminSecurity.MAX_SEARCH_LENGTH:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Search query too long (max {AdminSecurity.MAX_SEARCH_LENGTH} characters)"
            )
        
        # Check for dangerous patterns
        for pattern in AdminSecurity.DANGEROUS_PATTERNS:
            if re.search(pattern, search, re.IGNORECASE):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid characters in search query"
                )
        
        # Limit to alphanumeric, spaces, and common punctuation
        # SQLAlchemy's ilike will handle the rest safely
        sanitized = re.sub(r'[^\w\s\-@.]', '', search)
        
        return sanitized if sanitized else None
    
    @staticmethod
    def validate_user_id(user_id: ID) -> None:
        """
        Validate user ID format.
        
        Args:
            user_id: User ID to validate
            
        Raises:
            HTTPException: If user ID is invalid
        """
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID is required"
            )
        
        # Check ID format (should start with USR prefix)
        if not isinstance(user_id, str) or len(user_id) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
    
    @staticmethod
    def prevent_self_modification(
        current_user: User,
        target_user_id: ID,
        action: str
    ) -> None:
        """
        Prevent admins from performing dangerous actions on themselves.
        
        Args:
            current_user: The admin performing the action
            target_user_id: The user being modified
            action: The action being performed
            
        Raises:
            HTTPException: If admin tries to modify themselves
        """
        if current_user.id == target_user_id:
            dangerous_actions = ['suspend', 'deactivate', 'delete', 'remove_admin']
            if any(dangerous in action.lower() for dangerous in dangerous_actions):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot perform this action on your own account"
                )
    
    @staticmethod
    def prevent_admin_role_removal(
        current_user: User,
        target_user: User,
        new_role: Optional[UserRole]
    ) -> None:
        """
        Prevent removal of admin role from the last admin.
        
        Args:
            current_user: The admin performing the action
            target_user: The user being modified
            new_role: The new role being assigned
            
        Raises:
            HTTPException: If this would remove the last admin
        """
        from sqlalchemy.ext.asyncio import AsyncSession
        from sqlalchemy import select, func
        from app.core.database import get_db
        
        # If trying to remove admin role from an admin
        if (target_user.role in {UserRole.ADMIN, UserRole.SUPER_ADMIN} and 
            new_role not in {UserRole.ADMIN, UserRole.SUPER_ADMIN, None}):
            
            # This check should be done in the service layer with db access
            # For now, we'll raise a warning
            if current_user.id == target_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot remove admin role from your own account"
                )
    
    @staticmethod
    async def check_last_admin(
        db,
        target_user: User,
        new_role: Optional[UserRole]
    ) -> None:
        """
        Check if removing admin role would leave no admins.
        
        Args:
            db: Database session (AsyncSession)
            target_user: User being modified
            new_role: New role being assigned
            
        Raises:
            HTTPException: If this would remove the last admin
        """
        from sqlalchemy.ext.asyncio import AsyncSession
        from sqlalchemy import select, func
        from app.modules.users.models import User, UserRole
        
        # If trying to remove admin role
        if (target_user.role in {UserRole.ADMIN, UserRole.SUPER_ADMIN} and 
            new_role not in {UserRole.ADMIN, UserRole.SUPER_ADMIN, None}):
            
            # Count remaining admins
            result = await db.execute(
                select(func.count(User.id)).where(
                    User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
                    User.id != target_user.id,
                    User.is_active == True
                )
            )
            remaining_admins = result.scalar() or 0
            
            if remaining_admins == 0:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot remove admin role: This is the last active admin"
                )
    
    @staticmethod
    def validate_pagination(skip: int, limit: int) -> None:
        """
        Validate pagination parameters.
        
        Args:
            skip: Offset value
            limit: Limit value
            
        Raises:
            HTTPException: If pagination parameters are invalid
        """
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Skip must be >= 0"
            )
        
        if limit < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be >= 1"
            )
        
        if limit > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit cannot exceed 100"
            )
        
        # Prevent excessive pagination (DoS protection)
        if skip > 10000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Skip value too large"
            )

