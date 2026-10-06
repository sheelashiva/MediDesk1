from flask import Blueprint, request
from flask_bcrypt import Bcrypt
from flask_jwt_extended import jwt_required, get_jwt_identity

from models.models import db, User, Doctor, Clinic, DoctorClinic, Patient, Appointment, AuditLog, SecurityAlert
from security.decorators import role_required
from services.audit import audit

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")
bcrypt = Bcrypt()

@admin_bp.route("/test", methods=["GET"])
@role_required("admin")
def admin_test():
    return {"message": "Admin access granted"}, 200

@admin_bp.route("/dashboard", methods=["GET"])
@role_required("admin")
def dashboard():
    return {
        "patients": User.query.filter_by(role="patient").count(),
        "doctors": User.query.filter_by(role="doctor").count(),
        "appointments": Appointment.query.count(),
        "clinics": Clinic.query.count(),
        "security_alerts": SecurityAlert.query.filter_by(is_resolved=False).count()
    }, 200

@admin_bp.route("/doctors", methods=["GET"])
@role_required("admin")
def doctors():
    rows = Doctor.query.order_by(Doctor.id.desc()).all()
    return [{
        "id": d.id, "full_name": d.full_name, "specialization": d.specialization,
        "experience_years": d.experience_years, "consultation_fee": float(d.consultation_fee or 0),
        "user_id": d.user_id
    } for d in rows], 200

@admin_bp.route("/doctors", methods=["POST"])
@role_required("admin")
def create_doctor():
    data = request.get_json() or {}
    required = ["username", "email", "phone", "password", "full_name", "specialization"]
    if any(not str(data.get(k, "")).strip() for k in required):
        return {"error": "Required doctor fields are missing"}, 400
    if len(data["password"]) < 8:
        return {"error": "Password must contain at least 8 characters"}, 400
    if User.query.filter((User.username == data["username"]) | (User.email == data["email"].lower()) | (User.phone == data["phone"])).first():
        return {"error": "Username, email, or phone already exists"}, 409

    user = User(
        username=data["username"].strip(),
        email=data["email"].strip().lower(),
        phone=data["phone"].strip(),
        password_hash=bcrypt.generate_password_hash(data["password"]).decode("utf-8"),
        role="doctor"
    )
    db.session.add(user)
    db.session.flush()

    doctor = Doctor(
        user_id=user.id,
        full_name=data["full_name"].strip(),
        specialization=data["specialization"].strip(),
        experience_years=int(data.get("experience_years", 0) or 0),
        consultation_fee=float(data.get("consultation_fee", 0) or 0),
        bio=data.get("bio", "")
    )
    db.session.add(doctor)
    audit(int(get_jwt_identity()), "CREATE_DOCTOR", "doctor", doctor.id)
    db.session.commit()

    return {"message": "Doctor created successfully", "doctor_id": doctor.id}, 201

@admin_bp.route("/clinics", methods=["GET"])
@role_required("admin")
def clinics():
    rows = Clinic.query.order_by(Clinic.name).all()
    return [{"id": c.id, "name": c.name, "address": c.address, "city": c.city, "phone": c.phone} for c in rows], 200

@admin_bp.route("/clinics", methods=["POST"])
@role_required("admin")
def create_clinic():
    data = request.get_json() or {}
    if not data.get("name"):
        return {"error": "Clinic name is required"}, 400
    c = Clinic(name=data["name"].strip(), address=data.get("address"), city=data.get("city"), phone=data.get("phone"))
    db.session.add(c)
    audit(int(get_jwt_identity()), "CREATE_CLINIC", "clinic", None)
    db.session.commit()
    return {"message": "Clinic created successfully", "clinic_id": c.id}, 201

@admin_bp.route("/doctors/<int:doctor_id>/clinics", methods=["POST"])
@role_required("admin")
def assign_clinic(doctor_id):
    data = request.get_json() or {}
    doctor = Doctor.query.get_or_404(doctor_id)
    clinic = Clinic.query.get_or_404(int(data.get("clinic_id")))
    existing = DoctorClinic.query.filter_by(doctor_id=doctor.id, clinic_id=clinic.id).first()
    if existing:
        return {"message": "Doctor already assigned to clinic"}, 200
    db.session.add(DoctorClinic(doctor_id=doctor.id, clinic_id=clinic.id))
    audit(int(get_jwt_identity()), "ASSIGN_DOCTOR_CLINIC", "doctor", doctor.id)
    db.session.commit()
    return {"message": "Clinic assigned successfully"}, 201

@admin_bp.route("/security/logs", methods=["GET"])
@role_required("admin")
def security_logs():
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(100).all()
    return [{
        "id": x.id, "user_id": x.user_id, "action": x.action,
        "resource_type": x.resource_type, "resource_id": x.resource_id,
        "result": x.result, "ip_address": x.ip_address,
        "created_at": x.created_at.isoformat() if x.created_at else None
    } for x in logs], 200

@admin_bp.route("/security/alerts", methods=["GET"])
@role_required("admin")
def security_alerts():
    rows = SecurityAlert.query.order_by(SecurityAlert.created_at.desc()).limit(100).all()
    return [{
        "id": x.id, "user_id": x.user_id, "alert_type": x.alert_type,
        "description": x.description, "severity": x.severity,
        "is_resolved": x.is_resolved,
        "created_at": x.created_at.isoformat() if x.created_at else None
    } for x in rows], 200
