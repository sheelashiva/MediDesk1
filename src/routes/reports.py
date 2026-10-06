import os
from flask import Blueprint, request, send_file, current_app
from flask_jwt_extended import get_jwt_identity, get_jwt

from models.models import db, Appointment, MedicalRecord, Patient, Doctor
from security.decorators import role_required
from services.audit import audit, security_alert

report_bp = Blueprint("reports", __name__, url_prefix="/api/reports")

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@report_bp.route("/appointment/<int:appointment_id>", methods=["POST"])
@role_required("patient")
def upload(appointment_id):
    appointment = Appointment.query.get_or_404(appointment_id)
    patient = Patient.query.filter_by(user_id=int(get_jwt_identity())).first_or_404()
    if appointment.patient_id != patient.id:
        security_alert(patient.user_id, "UNAUTHORIZED_REPORT_UPLOAD", "Patient attempted to upload to another patient's appointment")
        db.session.commit()
        return {"error": "Access denied"}, 403

    file = request.files.get("file")
    if not file or not file.filename:
        return {"error": "A file is required"}, 400

    safe_name = os.path.basename(file.filename)
    path = os.path.join(UPLOAD_DIR, f"{appointment.id}_{safe_name}")
    file.save(path)

    old = MedicalRecord.query.filter_by(appointment_id=appointment.id).first()
    if old:
        old.file_name = safe_name
        old.file_path = path
    else:
        db.session.add(MedicalRecord(
            patient_id=patient.id, appointment_id=appointment.id,
            file_name=safe_name, file_path=path
        ))
    audit(patient.user_id, "UPLOAD_MEDICAL_REPORT", "appointment", appointment.id)
    db.session.commit()
    return {"message": "Report uploaded securely"}, 201

@report_bp.route("/appointment/<int:appointment_id>", methods=["GET"])
@role_required("patient", "doctor")
def view_report(appointment_id):
    appointment = Appointment.query.get_or_404(appointment_id)
    record = MedicalRecord.query.filter_by(appointment_id=appointment.id).first()
    if not record:
        return {"error": "No report found"}, 404

    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    allowed = False

    if role == "patient":
        p = Patient.query.filter_by(user_id=user_id).first()
        allowed = p and p.id == appointment.patient_id
    elif role == "doctor":
        d = Doctor.query.filter_by(user_id=user_id).first()
        allowed = d and d.id == appointment.doctor_id

    if not allowed:
        security_alert(user_id, "UNAUTHORIZED_REPORT_ACCESS", f"User attempted to access report for appointment {appointment.id}")
        db.session.commit()
        return {"error": "Access denied"}, 403

    audit(user_id, "VIEW_MEDICAL_REPORT", "appointment", appointment.id)
    db.session.commit()
    return send_file(record.file_path, as_attachment=False, download_name=record.file_name)
