"""
Travel Guides and User Stories models.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, Text,
    Index, ForeignKey, Numeric, ARRAY
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.shared.base import BaseModel


class TravelGuide(BaseModel):
    """
    Travel guides table.
    Stores curated travel guides created by users or admins.
    """
    __tablename__ = "travel_guides"
    
    # Basic Info
    title = Column(String(500), nullable=False, index=True)
    slug = Column(String(500), unique=True, nullable=False, index=True)
    summary = Column(String(1000), nullable=True)
    content = Column(Text, nullable=False)  # Full guide content (markdown/HTML)
    
    # Author
    author_id = Column(String(40), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    is_official = Column(Boolean, default=False, nullable=False, index=True)  # Official guides by admins
    
    # Location
    destination = Column(String(200), nullable=False, index=True)
    city = Column(String(100), nullable=True, index=True)
    country = Column(String(100), nullable=False, index=True)
    region = Column(String(100), nullable=True)
    
    # Content
    cover_image_url = Column(String(1000), nullable=True)
    image_urls = Column(ARRAY(String), default=[], nullable=False)
    tags = Column(ARRAY(String), default=[], nullable=False, index=True)
    categories = Column(ARRAY(String), default=[], nullable=False)  # adventure, culture, food, etc.
    
    # Metadata
    reading_time_minutes = Column(Integer, nullable=True)
    difficulty_level = Column(String(50), nullable=True)  # easy, moderate, challenging
    best_season = Column(ARRAY(String), default=[], nullable=False)  # spring, summer, fall, winter
    
    # Engagement
    view_count = Column(Integer, default=0, nullable=False)
    like_count = Column(Integer, default=0, nullable=False)
    share_count = Column(Integer, default=0, nullable=False)
    bookmark_count = Column(Integer, default=0, nullable=False)
    
    # Status
    status = Column(String(50), default="draft", nullable=False, index=True)  # draft, published, archived
    published_at = Column(DateTime(timezone=True), nullable=True, index=True)
    
    # SEO
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(String(500), nullable=True)
    
    # Relationships
    author = relationship("User", lazy="selectin")
    stories = relationship("UserStory", back_populates="guide", cascade="all, delete-orphan", lazy="selectin")
    bookmarks = relationship("TravelGuideBookmark", back_populates="guide", cascade="all, delete-orphan", lazy="selectin")
    likes = relationship("TravelGuideLike", back_populates="guide", cascade="all, delete-orphan", lazy="selectin")
    
    __table_args__ = (
        Index("idx_travel_guide_destination", "destination", "country", "status"),
        Index("idx_travel_guide_author_status", "author_id", "status"),
        Index("idx_travel_guide_published", "published_at", "status"),
        Index("idx_travel_guide_tags", "tags", postgresql_using="gin"),
    )


class UserStory(BaseModel):
    """
    User stories table.
    Personal travel stories shared by users.
    """
    __tablename__ = "user_stories"
    
    # Author
    author_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Content
    title = Column(String(500), nullable=False, index=True)
    content = Column(Text, nullable=False)
    summary = Column(String(1000), nullable=True)
    
    # Location
    destination = Column(String(200), nullable=False, index=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=False, index=True)
    
    # Media
    cover_image_url = Column(String(1000), nullable=True)
    image_urls = Column(ARRAY(String), default=[], nullable=False)
    video_urls = Column(ARRAY(String), default=[], nullable=False)
    
    # Metadata
    travel_date = Column(DateTime(timezone=True), nullable=True, index=True)
    duration_days = Column(Integer, nullable=True)
    travel_style = Column(String(50), nullable=True)  # solo, couple, family, group
    tags = Column(ARRAY(String), default=[], nullable=False, index=True)
    
    # Engagement
    view_count = Column(Integer, default=0, nullable=False)
    like_count = Column(Integer, default=0, nullable=False)
    comment_count = Column(Integer, default=0, nullable=False)
    share_count = Column(Integer, default=0, nullable=False)
    
    # Relationships
    guide_id = Column(String(40), ForeignKey("travel_guides.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Status
    status = Column(String(50), default="draft", nullable=False, index=True)  # draft, published, archived
    published_at = Column(DateTime(timezone=True), nullable=True, index=True)
    is_featured = Column(Boolean, default=False, nullable=False, index=True)
    
    # Relationships
    author = relationship("User", lazy="selectin")
    guide = relationship("TravelGuide", back_populates="stories", lazy="selectin")
    likes = relationship("UserStoryLike", back_populates="story", cascade="all, delete-orphan", lazy="selectin")
    comments = relationship("UserStoryComment", back_populates="story", cascade="all, delete-orphan", lazy="selectin")
    
    __table_args__ = (
        Index("idx_user_story_author_status", "author_id", "status"),
        Index("idx_user_story_destination", "destination", "country", "status"),
        Index("idx_user_story_published", "published_at", "status"),
        Index("idx_user_story_tags", "tags", postgresql_using="gin"),
    )


class TravelGuideBookmark(BaseModel):
    """Bookmarks for travel guides."""
    __tablename__ = "travel_guide_bookmarks"
    
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    guide_id = Column(String(40), ForeignKey("travel_guides.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", lazy="selectin")
    guide = relationship("TravelGuide", back_populates="bookmarks", lazy="selectin")
    
    __table_args__ = (
        Index("idx_travel_guide_bookmark_unique", "user_id", "guide_id", unique=True),
    )


class TravelGuideLike(BaseModel):
    """Likes for travel guides."""
    __tablename__ = "travel_guide_likes"
    
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    guide_id = Column(String(40), ForeignKey("travel_guides.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", lazy="selectin")
    guide = relationship("TravelGuide", back_populates="likes", lazy="selectin")
    
    __table_args__ = (
        Index("idx_travel_guide_like_unique", "user_id", "guide_id", unique=True),
    )


class UserStoryLike(BaseModel):
    """Likes for user stories."""
    __tablename__ = "user_story_likes"
    
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    story_id = Column(String(40), ForeignKey("user_stories.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", lazy="selectin")
    story = relationship("UserStory", back_populates="likes", lazy="selectin")
    
    __table_args__ = (
        Index("idx_user_story_like_unique", "user_id", "story_id", unique=True),
    )


class UserStoryComment(BaseModel):
    """Comments on user stories."""
    __tablename__ = "user_story_comments"
    
    user_id = Column(String(40), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    story_id = Column(String(40), ForeignKey("user_stories.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_comment_id = Column(String(40), ForeignKey("user_story_comments.id", ondelete="CASCADE"), nullable=True)
    
    content = Column(Text, nullable=False)
    
    # Engagement
    like_count = Column(Integer, default=0, nullable=False)
    
    # Relationships
    user = relationship("User", lazy="selectin")
    story = relationship("UserStory", back_populates="comments", lazy="selectin")
    parent_comment = relationship("UserStoryComment", remote_side="UserStoryComment.id", lazy="selectin")
    
    __table_args__ = (
        Index("idx_user_story_comment_story", "story_id", "created_at"),
    )

