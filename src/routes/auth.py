from flask import Blueprint, request
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from models.models import db, User, Patient
from security.decorators import role_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
bcrypt = Bcrypt()

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
    if User.query.filter_by(username=username).first():
        return {"error": "Username already exists"}, 409
    if User.query.filter_by(email=email).first():
        return {"error": "Email already exists"}, 409
    if User.query.filter_by(phone=phone).first():
        return {"error": "Phone number already exists"}, 409

    user = User(
        username=username,
        email=email,
        phone=phone,
        password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
        role="patient"
    )
    db.session.add(user)
    db.session.flush()
    db.session.add(Patient(user_id=user.id, full_name=full_name))
    db.session.commit()

    return {"message": "Patient account created successfully",
            "user": {"id": user.id, "username": user.username,
                     "email": user.email, "role": user.role}}, 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    identifier = data.get("identifier", "").strip()
    password = data.get("password", "")
    if not identifier or not password:
        return {"error": "Username/email and password are required"}, 400

    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier.lower())
    ).first()

    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return {"error": "Invalid credentials"}, 401
    if not user.is_active:
        return {"error": "Account is inactive"}, 403

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )
    return {"message": "Login successful", "access_token": token,
            "user": {"id": user.id, "username": user.username,
                     "email": user.email, "role": user.role}}, 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return {"error": "User not found"}, 404
    return {"id": user.id, "username": user.username, "email": user.email,
            "phone": user.phone, "role": user.role}, 200

@auth_bp.route("/patient-test", methods=["GET"])
@role_required("patient")
def patient_test():
    return {"message": "Patient access granted"}, 200
