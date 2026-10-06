from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity

from models.models import db, Appointment, Doctor, Patient, Review
from security.decorators import role_required

review_bp = Blueprint("reviews", __name__, url_prefix="/api/reviews")

@review_bp.route("", methods=["POST"])
@role_required("patient")
def create_review():
    data = request.get_json() or {}
    patient = Patient.query.filter_by(user_id=int(get_jwt_identity())).first_or_404()
    appointment = Appointment.query.get_or_404(int(data.get("appointment_id")))
    if appointment.patient_id != patient.id or appointment.status != "completed":
        return {"error": "Review allowed only after your completed appointment"}, 403
    if Review.query.filter_by(appointment_id=appointment.id).first():
        return {"error": "Review already submitted"}, 409
    rating = int(data.get("rating", 0))
    if rating < 1 or rating > 5:
        return {"error": "Rating must be between 1 and 5"}, 400
    row = Review(patient_id=patient.id, doctor_id=appointment.doctor_id,
                 appointment_id=appointment.id, rating=rating,
                 comment=data.get("comment", ""))
    db.session.add(row)
    db.session.commit()
    return {"message": "Review submitted"}, 201
