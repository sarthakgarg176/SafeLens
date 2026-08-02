from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .connection import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    api_key = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    assets = relationship("Asset", back_populates="user")

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    filename = Column(String, nullable=False)
    source_website = Column(String, nullable=True)
    thumbnail_path = Column(String, nullable=True)
    phash = Column(String, nullable=True)
    whash = Column(String, nullable=True)
    watermark_id = Column(String, nullable=True)
    confidence_before = Column(Float, nullable=True)
    confidence_after = Column(Float, nullable=True)
    status = Column(String, default="Protected")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    user = relationship("User", back_populates="assets")
    alerts = relationship("Alert", back_populates="asset")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, unique=True)
    matched_url = Column(String, nullable=False)
    match_confidence = Column(Float, nullable=True)
    severity = Column(String, default="Normal")
    status = Column(String, default="Open")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    asset = relationship("Asset", back_populates="alerts")
    action = relationship("Action", back_populates="alert", uselist=False)

class Action(Base):
    __tablename__ = "actions"
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False)
    action_type = Column(String, nullable=False)
    status = Column(String, default="Pending")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    alert = relationship("Alert", back_populates="action")

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    incident_type = Column(String, nullable=False)
    action_taken = Column(String, nullable=False)
    detected_terms = Column(String, nullable=True)  # JSON-serialized list of matched terms
    severity = Column(String, nullable=False)
    latency_ms = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))