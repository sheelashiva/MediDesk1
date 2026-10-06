from datetime import datetime
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import or_

from models.models import db, Appointment, Patient, Doctor, Clinic, DoctorClinic
from security.decorators import role_required
from services.audit import audit, security_alert

appointment_bp = Blueprint("appointments", __name__, url_prefix="/api/appointments")

def serialize(a):
    doctor = Doctor.query.get(a.doctor_id)
    clinic = Clinic.query.get(a.clinic_id)
    patient = Patient.query.get(a.patient_id)
    return {
        "id": a.id, "date": a.appointment_date.isoformat(),
        "time": a.appointment_time.strftime("%H:%M"),
        "reason": a.reason, "status": a.status,
        "doctor": {"id": doctor.id, "name": doctor.full_name} if doctor else None,
        "clinic": {"id": clinic.id, "name": clinic.name} if clinic else None,
        "patient": {"id": patient.id, "name": patient.full_name} if patient else None
    }

@appointment_bp.route("", methods=["POST"])
@role_required("patient")
def create():
    data = request.get_json() or {}
    user_id = int(get_jwt_identity())
    patient = Patient.query.filter_by(user_id=user_id).first_or_404()
    required = ["doctor_id", "clinic_id", "date", "time"]
    if any(k not in data for k in required):
        return {"error": "doctor_id, clinic_id, date and time are required"}, 400

    doctor = Doctor.query.get_or_404(int(data["doctor_id"]))
    clinic = Clinic.query.get_or_404(int(data["clinic_id"]))
    if not DoctorClinic.query.filter_by(doctor_id=doctor.id, clinic_id=clinic.id).first():
        return {"error": "Doctor does not work at this clinic"}, 403

    date = datetime.strptime(data["date"], "%Y-%m-%d").date()
    time = datetime.strptime(data["time"], "%H:%M").time()
    conflict = Appointment.query.filter_by(
        doctor_id=doctor.id, clinic_id=clinic.id,
        appointment_date=date, appointment_time=time
    ).first()
    if conflict:
        return {"error": "This appointment slot is already booked"}, 409

    row = Appointment(
        patient_id=patient.id, doctor_id=doctor.id, clinic_id=clinic.id,
        appointment_date=date, appointment_time=time,
        reason=data.get("reason", ""), status="pending"
    )
    db.session.add(row)
    audit(user_id, "BOOK_APPOINTMENT", "appointment", None)
    db.session.commit()
    return serialize(row), 201

@appointment_bp.route("/mine", methods=["GET"])
@role_required("patient")
def patient_appointments():
    patient = Patient.query.filter_by(user_id=int(get_jwt_identity())).first_or_404()
    return [serialize(x) for x in Appointment.query.filter_by(patient_id=patient.id).order_by(Appointment.appointment_date.desc()).all()], 200

@appointment_bp.route("/doctor", methods=["GET"])
@role_required("doctor")
def doctor_appointments():
    doctor = Doctor.query.filter_by(user_id=int(get_jwt_identity())).first_or_404()
    return [serialize(x) for x in Appointment.query.filter_by(doctor_id=doctor.id).order_by(Appointment.appointment_date.desc()).all()], 200

@appointment_bp.route("/<int:appointment_id>/status", methods=["PATCH"])
@role_required("doctor", "admin")
def update_status(appointment_id):
    row = Appointment.query.get_or_404(appointment_id)
    data = request.get_json() or {}
    status = data.get("status")
    if status not in {"pending", "confirmed", "completed", "cancelled"}:
        return {"error": "Invalid appointment status"}, 400
    user_id = int(get_jwt_identity())
    if "doctor" in __import__("flask_jwt_extended").get_jwt().get("role", ""):
        doctor = Doctor.query.filter_by(user_id=user_id).first()
        if not doctor or doctor.id != row.doctor_id:
            security_alert(user_id, "UNAUTHORIZED_APPOINTMENT_ACCESS", "Doctor attempted to change an appointment not assigned to them")
            db.session.commit()
            return {"error": "Access denied"}, 403
    row.status = status
    audit(user_id, "UPDATE_APPOINTMENT_STATUS", "appointment", row.id)
    db.session.commit()
    return serialize(row), 200
