from datetime import datetime
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

from models.models import db, Doctor, Clinic, DoctorClinic, DoctorAvailability, Review
from security.decorators import role_required
from services.audit import audit

doctor_bp = Blueprint("doctors", __name__, url_prefix="/api/doctors")

@doctor_bp.route("", methods=["GET"])
@jwt_required()
def list_doctors():
    q = request.args.get("q", "").strip()
    specialization = request.args.get("specialization", "").strip()
    clinic_id = request.args.get("clinic_id", type=int)
    max_fee = request.args.get("max_fee", type=float)

    query = Doctor.query
    if q:
        query = query.filter(Doctor.full_name.ilike(f"%{q}%"))
    if specialization:
        query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))
    if max_fee is not None:
        query = query.filter(Doctor.consultation_fee <= max_fee)

    rows = query.order_by(Doctor.full_name).all()
    result = []
    for d in rows:
        links = DoctorClinic.query.filter_by(doctor_id=d.id).all()
        if clinic_id and not any(x.clinic_id == clinic_id for x in links):
            continue
        clinics = []
        for link in links:
            c = Clinic.query.get(link.clinic_id)
            if c:
                clinics.append({"id": c.id, "name": c.name, "city": c.city})
        avg = db.session.query(func.avg(Review.rating)).filter(Review.doctor_id == d.id).scalar()
        result.append({
            "id": d.id, "full_name": d.full_name, "specialization": d.specialization,
            "experience_years": d.experience_years,
            "consultation_fee": float(d.consultation_fee or 0),
            "rating": round(float(avg), 1) if avg else 0,
            "clinics": clinics
        })
    return result, 200

@doctor_bp.route("/<int:doctor_id>", methods=["GET"])
@jwt_required()
def doctor_detail(doctor_id):
    d = Doctor.query.get_or_404(doctor_id)
    links = DoctorClinic.query.filter_by(doctor_id=d.id).all()
    clinics = []
    for link in links:
        c = Clinic.query.get(link.clinic_id)
        if c:
            clinics.append({"id": c.id, "name": c.name, "address": c.address, "city": c.city})
    return {
        "id": d.id, "full_name": d.full_name, "specialization": d.specialization,
        "experience_years": d.experience_years, "consultation_fee": float(d.consultation_fee or 0),
        "bio": d.bio, "clinics": clinics
    }, 200

@doctor_bp.route("/me/availability", methods=["POST"])
@role_required("doctor")
def set_availability():
    from flask_jwt_extended import get_jwt_identity
    d = Doctor.query.filter_by(user_id=int(get_jwt_identity())).first_or_404()
    data = request.get_json() or {}
    required = ["clinic_id", "day_of_week", "start_time", "end_time"]
    if any(k not in data for k in required):
        return {"error": "clinic_id, day_of_week, start_time and end_time are required"}, 400
    link = DoctorClinic.query.filter_by(doctor_id=d.id, clinic_id=int(data["clinic_id"])).first()
    if not link:
        return {"error": "Doctor is not assigned to this clinic"}, 403
    start = datetime.strptime(data["start_time"], "%H:%M").time()
    end = datetime.strptime(data["end_time"], "%H:%M").time()
    row = DoctorAvailability(doctor_id=d.id, clinic_id=link.clinic_id, day_of_week=int(data["day_of_week"]), start_time=start, end_time=end)
    db.session.add(row)
    audit(d.user_id, "SET_AVAILABILITY", "doctor", d.id)
    db.session.commit()
    return {"message": "Availability saved", "id": row.id}, 201
@doctor_bp.route("/me/patients", methods=["GET"])
@role_required("doctor")
def my_patients():
    from models.models import Appointment, Patient, User

    doctor = Doctor.query.filter_by(
        user_id=int(get_jwt_identity())
    ).first_or_404()

    appointments = (
        Appointment.query
        .filter_by(doctor_id=doctor.id)
        .order_by(Appointment.appointment_date.desc())
        .all()
    )

    seen = set()
    result = []

    for appointment in appointments:
        patient = Patient.query.get(appointment.patient_id)

        if not patient or patient.id in seen:
            continue

        seen.add(patient.id)

        user = User.query.get(patient.user_id)

        result.append({
            "id": patient.id,
            "full_name": patient.full_name,
            "email": user.email if user else None,
            "phone": user.phone if user else None,
            "appointment_id": appointment.id,
            "appointment_date": appointment.appointment_date.isoformat(),
            "appointment_time": appointment.appointment_time.strftime("%H:%M"),
            "appointment_status": appointment.status
        })

    audit(
        doctor.user_id,
        "VIEW_AUTHORIZED_PATIENTS",
        "doctor",
        doctor.id
    )
    db.session.commit()

    return result, 200
