from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from flask_bcrypt import Bcrypt

from models.models import (
    db, User, Patient, Doctor, Clinic,
    DoctorClinic, Appointment
)
from security.decorators import role_required
from services.audit import audit

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")
bcrypt = Bcrypt()


# =========================
# ADMIN DASHBOARD
# =========================

@admin_bp.route("/dashboard", methods=["GET"])
@role_required("admin")
def dashboard():
    return {
        "patients": Patient.query.count(),
        "doctors": Doctor.query.count(),
        "clinics": Clinic.query.count(),
        "appointments": Appointment.query.count()
    }, 200


# =========================
# DOCTORS
# =========================

@admin_bp.route("/doctors", methods=["GET"])
@role_required("admin")
def get_doctors():
    doctors = Doctor.query.order_by(Doctor.id.desc()).all()

    result = []

    for doctor in doctors:
        user = User.query.get(doctor.user_id)

        clinics = []
        links = DoctorClinic.query.filter_by(
            doctor_id=doctor.id
        ).all()

        for link in links:
            clinic = Clinic.query.get(link.clinic_id)
            if clinic:
                clinics.append({
                    "id": clinic.id,
                    "name": clinic.name
                })

        result.append({
            "id": doctor.id,
            "full_name": doctor.full_name,
            "specialization": doctor.specialization,
            "experience_years": doctor.experience_years,
            "consultation_fee": float(doctor.consultation_fee or 0),
            "bio": doctor.bio,
            "user_id": doctor.user_id,
            "username": user.username if user else None,
            "email": user.email if user else None,
            "is_active": user.is_active if user else False,
            "clinics": clinics
        })

    return result, 200


@admin_bp.route("/doctors", methods=["POST"])
@role_required("admin")
def create_doctor():
    data = request.get_json() or {}

    required = [
        "username",
        "email",
        "phone",
        "password",
        "full_name",
        "specialization"
    ]

    if any(not data.get(field) for field in required):
        return {"error": "Required doctor fields are missing"}, 400

    username = data["username"].strip()
    email = data["email"].strip().lower()
    phone = data["phone"].strip()

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
        password_hash=bcrypt.generate_password_hash(
            data["password"]
        ).decode("utf-8"),
        role="doctor",
        is_active=True
    )

    db.session.add(user)
    db.session.flush()

    doctor = Doctor(
        user_id=user.id,
        full_name=data["full_name"].strip(),
        specialization=data["specialization"].strip(),
        experience_years=int(data.get("experience_years", 0)),
        consultation_fee=float(data.get("consultation_fee", 0)),
        bio=data.get("bio", "")
    )

    db.session.add(doctor)
    db.session.commit()

    admin_id = int(get_jwt_identity())
    audit(admin_id, "CREATE_DOCTOR", "doctor", doctor.id)
    db.session.commit()

    return {
        "message": "Doctor created successfully",
        "doctor_id": doctor.id
    }, 201


@admin_bp.route("/doctors/<int:doctor_id>", methods=["PATCH"])
@role_required("admin")
def update_doctor(doctor_id):
    doctor = Doctor.query.get_or_404(doctor_id)
    data = request.get_json() or {}

    if "full_name" in data:
        doctor.full_name = data["full_name"]

    if "specialization" in data:
        doctor.specialization = data["specialization"]

    if "experience_years" in data:
        doctor.experience_years = int(data["experience_years"])

    if "consultation_fee" in data:
        doctor.consultation_fee = float(data["consultation_fee"])

    if "bio" in data:
        doctor.bio = data["bio"]

    db.session.commit()

    admin_id = int(get_jwt_identity())
    audit(admin_id, "UPDATE_DOCTOR", "doctor", doctor.id)
    db.session.commit()

    return {"message": "Doctor updated successfully"}, 200


@admin_bp.route("/doctors/<int:doctor_id>/status", methods=["PATCH"])
@role_required("admin")
def doctor_status(doctor_id):
    doctor = Doctor.query.get_or_404(doctor_id)
    user = User.query.get_or_404(doctor.user_id)

    data = request.get_json() or {}

    if "is_active" not in data:
        return {"error": "is_active is required"}, 400

    user.is_active = bool(data["is_active"])

    db.session.commit()

    admin_id = int(get_jwt_identity())
    audit(
        admin_id,
        "CHANGE_DOCTOR_STATUS",
        "doctor",
        doctor.id
    )
    db.session.commit()

    return {
        "message": "Doctor status updated",
        "is_active": user.is_active
    }, 200


# =========================
# PATIENTS
# =========================

@admin_bp.route("/patients", methods=["GET"])
@role_required("admin")
def get_patients():
    patients = Patient.query.order_by(Patient.id.desc()).all()

    result = []

    for patient in patients:
        user = User.query.get(patient.user_id)

        result.append({
            "id": patient.id,
            "full_name": patient.full_name,
            "username": user.username if user else None,
            "email": user.email if user else None,
            "phone": user.phone if user else None,
            "is_active": user.is_active if user else False
        })

    return result, 200


@admin_bp.route("/patients/<int:patient_id>/status", methods=["PATCH"])
@role_required("admin")
def patient_status(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    user = User.query.get_or_404(patient.user_id)

    data = request.get_json() or {}

    if "is_active" not in data:
        return {"error": "is_active is required"}, 400

    user.is_active = bool(data["is_active"])

    db.session.commit()

    admin_id = int(get_jwt_identity())
    audit(
        admin_id,
        "CHANGE_PATIENT_STATUS",
        "patient",
        patient.id
    )
    db.session.commit()

    return {
        "message": "Patient status updated",
        "is_active": user.is_active
    }, 200


# =========================
# CLINICS
# =========================

@admin_bp.route("/clinics", methods=["GET"])
@role_required("admin")
def get_clinics():
    clinics = Clinic.query.order_by(Clinic.id.desc()).all()

    return [
        {
            "id": clinic.id,
            "name": clinic.name,
            "address": clinic.address,
            "city": clinic.city
        }
        for clinic in clinics
    ], 200


@admin_bp.route("/clinics", methods=["POST"])
@role_required("admin")
def create_clinic():
    data = request.get_json() or {}

    if not data.get("name"):
        return {"error": "Clinic name is required"}, 400

    clinic = Clinic(
        name=data["name"].strip(),
        address=data.get("address", "").strip(),
        city=data.get("city", "").strip()
    )

    db.session.add(clinic)
    db.session.commit()

    admin_id = int(get_jwt_identity())
    audit(admin_id, "CREATE_CLINIC", "clinic", clinic.id)
    db.session.commit()

    return {
        "message": "Clinic created successfully",
        "clinic_id": clinic.id
    }, 201


# =========================
# APPOINTMENTS
# =========================

@admin_bp.route("/appointments", methods=["GET"])
@role_required("admin")
def get_appointments():
    appointments = Appointment.query.order_by(
        Appointment.appointment_date.desc(),
        Appointment.appointment_time.desc()
    ).all()

    result = []

    for appointment in appointments:
        patient = Patient.query.get(appointment.patient_id)
        doctor = Doctor.query.get(appointment.doctor_id)
        clinic = Clinic.query.get(appointment.clinic_id)

        result.append({
            "id": appointment.id,
            "date": appointment.appointment_date.isoformat(),
            "time": appointment.appointment_time.strftime("%H:%M"),
            "status": appointment.status,
            "reason": appointment.reason,
            "patient": patient.full_name if patient else None,
            "doctor": doctor.full_name if doctor else None,
            "clinic": clinic.name if clinic else None
        })

    return result, 200