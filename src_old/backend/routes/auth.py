from datetime import datetime, timedelta
import secrets

from flask import Blueprint, request
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy import or_

from models.models import db, User, Patient, OTPRecord
from security.decorators import role_required
from services.audit import audit

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
bcrypt = Bcrypt()

def user_payload(user):
    return {
        "id": user.id, "username": user.username, "email": user.email,
        "phone": user.phone, "role": user.role, "is_active": user.is_active
    }

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    phone = data.get("phone", "").strip()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()

    if not all([username, email, phone, password, full_name]):
        return {"error": "All fields are required"}, 400
    if len(password) < 8:
        return {"error": "Password must contain at least 8 characters"}, 400
    if User.query.filter(or_(User.username == username, User.email == email, User.phone == phone)).first():
        return {"error": "Username, email, or phone already exists"}, 409

    user = User(
        username=username, email=email, phone=phone,
        password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
        role="patient"
    )
    db.session.add(user)
    db.session.flush()
    db.session.add(Patient(user_id=user.id, full_name=full_name))
    audit(user.id, "PATIENT_REGISTER", "user", user.id, ip_address=request.remote_addr)
    db.session.commit()

    return {"message": "Patient account created successfully", "user": user_payload(user)}, 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    identifier = data.get("identifier", "").strip()
    password = data.get("password", "")
    if not identifier or not password:
        return {"error": "Username/email and password are required"}, 400

    user = User.query.filter(or_(
        User.username == identifier,
        User.email == identifier.lower()
    )).first()

    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return {"error": "Invalid credentials"}, 401
    if not user.is_active:
        return {"error": "Account is inactive"}, 403

    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    audit(user.id, "LOGIN", "user", user.id, ip_address=request.remote_addr)
    db.session.commit()

    return {"message": "Login successful", "access_token": token, "user": user_payload(user)}, 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return {"error": "User not found"}, 404
    return user_payload(user), 200

@auth_bp.route("/patient-test", methods=["GET"])
@role_required("patient")
def patient_test():
    return {"message": "Patient access granted"}, 200

@auth_bp.route("/forgot-password/request", methods=["POST"])
def forgot_password_request():
    data = request.get_json() or {}
    identifier = data.get("identifier", "").strip().lower()
    user = User.query.filter(or_(User.email == identifier, User.username == identifier)).first()

    # Generic response avoids account enumeration.
    if not user:
        return {"message": "If the account exists, an OTP has been generated."}, 200

    otp = f"{secrets.randbelow(1000000):06d}"
    row = OTPRecord(
        user_id=user.id,
        otp_hash=bcrypt.generate_password_hash(otp).decode("utf-8"),
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.session.add(row)
    db.session.commit()

    # Hackathon/demo mode: return OTP so the flow can be demonstrated locally.
    return {
        "message": "OTP generated for demo mode",
        "demo_otp": otp,
        "expires_in_minutes": 10
    }, 200

@auth_bp.route("/forgot-password/reset", methods=["POST"])
def forgot_password_reset():
    data = request.get_json() or {}
    identifier = data.get("identifier", "").strip().lower()
    otp = data.get("otp", "").strip()
    new_password = data.get("new_password", "")

    if len(new_password) < 8:
        return {"error": "Password must contain at least 8 characters"}, 400

    user = User.query.filter(or_(User.email == identifier, User.username == identifier)).first()
    if not user:
        return {"error": "Invalid reset request"}, 400

    record = OTPRecord.query.filter_by(user_id=user.id, is_used=False).order_by(OTPRecord.created_at.desc()).first()
    if not record or record.expires_at < datetime.utcnow():
        return {"error": "OTP expired or invalid"}, 400
    if record.attempts >= 5:
        return {"error": "Too many OTP attempts"}, 429

    record.attempts += 1
    if not bcrypt.check_password_hash(record.otp_hash, otp):
        db.session.commit()
        return {"error": "Invalid OTP"}, 400

    user.password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
    record.is_used = True
    audit(user.id, "PASSWORD_RESET", "user", user.id, ip_address=request.remote_addr)
    db.session.commit()
    return {"message": "Password reset successfully"}, 200
