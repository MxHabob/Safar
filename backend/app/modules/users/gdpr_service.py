"""
GDPR Compliance Service
Implements data export and account deletion per GDPR requirements.
"""
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.modules.users.models import (
    User, Account, UserDevice, UserPasskey, TwoFactorChallenge,
    HostProfile, UserVerification
)
from app.modules.listings.models import Listing
from app.modules.bookings.models import Booking, Payment
from app.modules.reviews.models import Review
from app.modules.messages.models import Message, Conversation, ConversationParticipant
from app.modules.wishlist.models import Wishlist
from app.modules.notifications.models import Notification
from app.modules.loyalty.models import LoyaltyLedger
from app.modules.promotions.models import PromotionRedemption
from app.modules.bookings.models import Payout
from app.modules.analytics.models import AnalyticsEvent, AuditLog
from app.modules.files.models import File
from app.modules.ai_trip_planner.models import TravelPlan
from app.core.id import ID


class GDPRService:
    """Service for GDPR compliance: data export and deletion."""
    
    @staticmethod
    async def export_user_data(
        db: AsyncSession,
        user_id: ID
    ) -> Dict[str, Any]:
        """
        Export all user data in JSON format per GDPR Article 15 (Right of Access).
        
        Args:
            db: Database session
            user_id: User ID to export data for
            
        Returns:
            Dictionary containing all user data
        """
        # Get user
        result = await db.execute(
            select(User)
            .where(User.id == user_id)
            .options(
                selectinload(User.accounts),
                selectinload(User.devices),
                selectinload(User.passkeys),
                selectinload(User.two_factor_challenges),
                selectinload(User.host_profile)
            )
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Export user profile
        user_data = {
            "id": str(user.id),
            "email": user.email,
            "phone_number": user.phone_number,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "bio": user.bio,
            "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
            "country": user.country,
            "city": user.city,
            "timezone": user.timezone,
            "language": user.language,
            "locale": user.locale,
            "currency": user.currency,
            "role": user.role.value if user.role else None,
            "roles": user.roles,
            "status": user.status.value if user.status else None,
            "is_active": user.is_active,
            "is_email_verified": user.is_email_verified,
            "is_phone_verified": user.is_phone_verified,
            "totp_enabled": user.totp_enabled,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
            "last_login_ip": str(user.last_login_ip) if user.last_login_ip else None,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat(),
            "metadata": user.user_metadata or {}
        }
        
        # Export OAuth accounts
        accounts_data = []
        for account in user.accounts:
            accounts_data.append({
                "provider": account.provider.value if account.provider else None,
                "provider_id": account.provider_id,
                "scopes": account.scopes,
                "expires_at": account.expires_at.isoformat() if account.expires_at else None,
                "created_at": account.created_at.isoformat()
            })
        user_data["oauth_accounts"] = accounts_data
        
        # Export devices
        devices_data = []
        for device in user.devices:
            devices_data.append({
                "platform": device.platform,
                "fingerprint": device.fingerprint,
                "last_seen_at": device.last_seen_at.isoformat() if device.last_seen_at else None,
                "is_trusted": device.is_trusted,
                "created_at": device.created_at.isoformat()
            })
        user_data["devices"] = devices_data
        
        # Export host profile if exists
        if user.host_profile:
            user_data["host_profile"] = {
                "legal_name": user.host_profile.legal_name,
                "bio": user.host_profile.bio,
                "status": user.host_profile.status,
                "badges": user.host_profile.badges,
                "onboarding_step": user.host_profile.onboarding_step,
                "created_at": user.host_profile.created_at.isoformat(),
                "updated_at": user.host_profile.updated_at.isoformat()
            }
        
        # Export listings (if host)
        listings_result = await db.execute(
            select(Listing).where(Listing.host_id == user_id)
        )
        listings = listings_result.scalars().all()
        listings_data = []
        for listing in listings:
            listings_data.append({
                "id": str(listing.id),
                "title": listing.title,
                "description": listing.description,
                "city": listing.city,
                "country": listing.country,
                "base_price": float(listing.base_price) if listing.base_price else None,
                "status": listing.status.value if listing.status else None,
                "created_at": listing.created_at.isoformat(),
                "updated_at": listing.updated_at.isoformat()
            })
        user_data["listings"] = listings_data
        
        # Export bookings (as guest)
        bookings_result = await db.execute(
            select(Booking).where(Booking.guest_id == user_id)
        )
        bookings = bookings_result.scalars().all()
        bookings_data = []
        for booking in bookings:
            bookings_data.append({
                "id": str(booking.id),
                "booking_number": booking.booking_number,
                "listing_id": str(booking.listing_id),
                "check_in": booking.check_in.isoformat() if booking.check_in else None,
                "check_out": booking.check_out.isoformat() if booking.check_out else None,
                "guests": booking.guests,
                "total_amount": float(booking.total_amount) if booking.total_amount else None,
                "currency": booking.currency,
                "status": booking.status.value if booking.status else None,
                "payment_status": booking.payment_status.value if booking.payment_status else None,
                "created_at": booking.created_at.isoformat(),
                "updated_at": booking.updated_at.isoformat()
            })
        user_data["bookings"] = bookings_data
        
        # Export reviews (as guest and host)
        reviews_guest_result = await db.execute(
            select(Review).where(Review.guest_id == user_id)
        )
        reviews_guest = reviews_guest_result.scalars().all()
        
        reviews_host_result = await db.execute(
            select(Review).where(Review.host_id == user_id)
        )
        reviews_host = reviews_host_result.scalars().all()
        
        reviews_data = []
        for review in list(reviews_guest) + list(reviews_host):
            reviews_data.append({
                "id": str(review.id),
                "listing_id": str(review.listing_id),
                "booking_id": str(review.booking_id) if review.booking_id else None,
                "guest_id": str(review.guest_id),
                "host_id": str(review.host_id),
                "overall_rating": float(review.overall_rating) if review.overall_rating else None,
                "title": review.title,
                "comment": review.comment,
                "is_public": review.is_public,
                "created_at": review.created_at.isoformat()
            })
        user_data["reviews"] = reviews_data
        
        # Export messages
        messages_sent_result = await db.execute(
            select(Message).where(Message.sender_id == user_id)
        )
        messages_received_result = await db.execute(
            select(Message).where(Message.receiver_id == user_id)
        )
        messages_sent = messages_sent_result.scalars().all()
        messages_received = messages_received_result.scalars().all()
        
        messages_data = []
        for message in list(messages_sent) + list(messages_received):
            messages_data.append({
                "id": str(message.id),
                "conversation_id": str(message.conversation_id),
                "sender_id": str(message.sender_id),
                "receiver_id": str(message.receiver_id),
                "content": message.content,
                "is_read": message.is_read,
                "created_at": message.created_at.isoformat()
            })
        user_data["messages"] = messages_data
        
        # Export wishlists
        wishlists_result = await db.execute(
            select(Wishlist).where(Wishlist.user_id == user_id)
        )
        wishlists = wishlists_result.scalars().all()
        wishlists_data = []
        for wishlist in wishlists:
            wishlists_data.append({
                "id": str(wishlist.id),
                "listing_id": str(wishlist.listing_id),
                "created_at": wishlist.created_at.isoformat()
            })
        user_data["wishlists"] = wishlists_data
        
        # Export notifications
        notifications_result = await db.execute(
            select(Notification).where(Notification.user_id == user_id)
        )
        notifications = notifications_result.scalars().all()
        notifications_data = []
        for notification in notifications:
            notifications_data.append({
                "id": str(notification.id),
                "type": notification.type,
                "title": notification.title,
                "message": notification.message,
                "is_read": notification.is_read,
                "created_at": notification.created_at.isoformat()
            })
        user_data["notifications"] = notifications_data
        
        # Export loyalty ledger
        loyalty_result = await db.execute(
            select(LoyaltyLedger).where(LoyaltyLedger.user_id == user_id)
        )
        loyalty_entries = loyalty_result.scalars().all()
        loyalty_data = []
        for entry in loyalty_entries:
            loyalty_data.append({
                "id": str(entry.id),
                "points": entry.points,
                "type": entry.type,
                "description": entry.description,
                "created_at": entry.created_at.isoformat()
            })
        user_data["loyalty_ledger"] = loyalty_data
        
        # Export analytics events
        analytics_result = await db.execute(
            select(AnalyticsEvent).where(AnalyticsEvent.user_id == user_id)
        )
        analytics_events = analytics_result.scalars().all()
        analytics_data = []
        for event in analytics_events:
            analytics_data.append({
                "id": str(event.id),
                "event_type": event.event_type,
                "payload": event.payload,
                "recorded_at": event.recorded_at.isoformat()
            })
        user_data["analytics_events"] = analytics_data
        
        # Export audit logs (where user is actor)
        audit_logs_result = await db.execute(
            select(AuditLog).where(AuditLog.actor_id == user_id)
        )
        audit_logs = audit_logs_result.scalars().all()
        audit_data = []
        for log in audit_logs:
            audit_data.append({
                "id": str(log.id),
                "action": log.action,
                "resource": log.resource,
                "resource_id": log.resource_id,
                "metadata": log.audit_metadata,
                "created_at": log.created_at.isoformat()
            })
        user_data["audit_logs"] = audit_data
        
        # Export files
        files_result = await db.execute(
            select(File).where(File.uploaded_by == user_id)
        )
        files = files_result.scalars().all()
        files_data = []
        for file in files:
            files_data.append({
                "id": str(file.id),
                "filename": file.filename,
                "file_path": file.file_path,
                "file_size": file.file_size,
                "mime_type": file.mime_type,
                "category": file.category.value if file.category else None,
                "created_at": file.created_at.isoformat()
            })
        user_data["files"] = files_data
        
        # Export travel plans
        travel_plans_result = await db.execute(
            select(TravelPlan).where(TravelPlan.user_id == user_id)
        )
        travel_plans = travel_plans_result.scalars().all()
        travel_plans_data = []
        for plan in travel_plans:
            travel_plans_data.append({
                "id": str(plan.id),
                "destination": plan.destination,
                "start_date": plan.start_date.isoformat() if plan.start_date else None,
                "end_date": plan.end_date.isoformat() if plan.end_date else None,
                "created_at": plan.created_at.isoformat()
            })
        user_data["travel_plans"] = travel_plans_data
        
        # Add export metadata
        export_data = {
            "export_date": datetime.utcnow().isoformat(),
            "user_id": str(user_id),
            "data": user_data
        }
        
        return export_data
    
    @staticmethod
    async def delete_user_account(
        db: AsyncSession,
        user_id: ID,
        password: Optional[str] = None
    ) -> bool:
        """
        Permanently delete user account and all associated data per GDPR Article 17 (Right to Erasure).
        
        NOTE: Some data may be anonymized rather than deleted to preserve business records:
        - Reviews: Anonymized (guest_id/host_id set to NULL)
        - Bookings: Guest ID anonymized for historical records
        - Listings: Deactivated if user is host
        
        Args:
            db: Database session
            user_id: User ID to delete
            password: Optional password verification
            
        Returns:
            True if deletion successful
        """
        # Get user
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify password if provided
        if password:
            from app.core.security import verify_password
            if not user.hashed_password or not verify_password(password, user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid password"
                )
        
        # Anonymize reviews (preserve ratings but remove user identity)
        await db.execute(
            update(Review)
            .where(Review.guest_id == user_id)
            .values(guest_id=None, comment="[Deleted User]")
        )
        
        await db.execute(
            update(Review)
            .where(Review.host_id == user_id)
            .values(host_id=None)
        )
        
        # Anonymize bookings (preserve booking records but anonymize guest)
        # Note: Only anonymize if booking is completed/cancelled to preserve active bookings
        await db.execute(
            update(Booking)
            .where(
                Booking.guest_id == user_id,
                Booking.status.in_(["completed", "cancelled", "refunded"])
            )
            .values(guest_id=None)
        )
        
        # Deactivate listings if user is host
        await db.execute(
            update(Listing)
            .where(Listing.host_id == user_id)
            .values(status="inactive")
        )
        
        # Delete conversations where user is participant
        conversations_result = await db.execute(
            select(ConversationParticipant).where(ConversationParticipant.user_id == user_id)
        )
        conversation_ids = [cp.conversation_id for cp in conversations_result.scalars().all()]
        
        if conversation_ids:
            # Delete messages in those conversations
            await db.execute(
                delete(Message).where(Message.conversation_id.in_(conversation_ids))
            )
            # Delete conversation participants
            await db.execute(
                delete(ConversationParticipant).where(ConversationParticipant.user_id == user_id)
            )
            # Delete conversations
            await db.execute(
                delete(Conversation).where(Conversation.id.in_(conversation_ids))
            )
        
        # Delete user-specific data (cascade will handle most)
        # These have CASCADE delete, but we'll be explicit:
        await db.execute(delete(Wishlist).where(Wishlist.user_id == user_id))
        await db.execute(delete(Notification).where(Notification.user_id == user_id))
        await db.execute(delete(LoyaltyLedger).where(LoyaltyLedger.user_id == user_id))
        await db.execute(delete(PromotionRedemption).where(PromotionRedemption.user_id == user_id))
        await db.execute(delete(AnalyticsEvent).where(AnalyticsEvent.user_id == user_id))
        await db.execute(delete(TravelPlan).where(TravelPlan.user_id == user_id))
        
        # Delete files (and from storage)
        files_result = await db.execute(
            select(File).where(File.uploaded_by == user_id)
        )
        files = files_result.scalars().all()
        for file in files:
            # Delete from storage
            from app.modules.files.services import delete_file
            try:
                await delete_file(file, db)
            except Exception:
                pass  # Continue even if file deletion fails
        
        # Anonymize audit logs (set actor_id to NULL)
        await db.execute(
            update(AuditLog)
            .where(AuditLog.actor_id == user_id)
            .values(actor_id=None)
        )
        
        # Delete user account (cascade will delete: accounts, devices, passkeys, two_factor_challenges, host_profile)
        await db.execute(delete(User).where(User.id == user_id))
        
        # Revoke all tokens
        from app.core.token_blacklist import revoke_user_tokens
        try:
            await revoke_user_tokens(user_id)
        except Exception:
            pass  # Continue even if token revocation fails
        
        await db.commit()
        
        return True

