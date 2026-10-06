from datetime import time
from flask_bcrypt import Bcrypt
from app import app
from models.models import db, User, Doctor, Clinic, DoctorClinic, DoctorAvailability

bcrypt = Bcrypt(app)

with app.app_context():
    clinic1 = Clinic.query.filter_by(name="MediCare Central").first()
    if not clinic1:
        clinic1 = Clinic(
            name="MediCare Central",
            address="Main Road",
            city="Hyderabad",
            phone="9000000002"
        )
        db.session.add(clinic1)

    clinic2 = Clinic.query.filter_by(name="CarePoint Clinic").first()
    if not clinic2:
        clinic2 = Clinic(
            name="CarePoint Clinic",
            address="MG Road",
            city="Secunderabad",
            phone="9000000003"
        )
        db.session.add(clinic2)

    db.session.flush()

    doctors_data = [
        ("dr_ananya", "ananya@medidesk.com", "9000000011",
         "Dr. Ananya Rao", "Cardiology", 12, 700, clinic1),
        ("dr_rahul", "rahul@medidesk.com", "9000000012",
         "Dr. Rahul Mehta", "Dermatology", 8, 600, clinic2),
        ("dr_priya", "priya@medidesk.com", "9000000013",
         "Dr. Priya Nair", "General Medicine", 10, 500, clinic1),
    ]

    for username, email, phone, name, specialization, exp, fee, clinic in doctors_data:
        user = User.query.filter(
            (User.username == username) | (User.email == email)
        ).first()

        if not user:
            user = User(
                username=username,
                email=email,
                phone=phone,
                password_hash=bcrypt.generate_password_hash("Doctor@123").decode("utf-8"),
                role="doctor"
            )
            db.session.add(user)
            db.session.flush()

        doctor = Doctor.query.filter_by(user_id=user.id).first()

        if not doctor:
            doctor = Doctor(
                user_id=user.id,
                full_name=name,
                specialization=specialization,
                experience_years=exp,
                consultation_fee=fee
            )
            db.session.add(doctor)
            db.session.flush()

        link = DoctorClinic.query.filter_by(
            doctor_id=doctor.id,
            clinic_id=clinic.id
        ).first()

        if not link:
            db.session.add(
                DoctorClinic(
                    doctor_id=doctor.id,
                    clinic_id=clinic.id
                )
            )

        existing_availability = DoctorAvailability.query.filter_by(
            doctor_id=doctor.id,
            clinic_id=clinic.id
        ).first()

        if not existing_availability:
            for day in range(1, 6):
                db.session.add(
                    DoctorAvailability(
                        doctor_id=doctor.id,
                        clinic_id=clinic.id,
                        day_of_week=day,
                        start_time=time(9, 0),
                        end_time=time(17, 0),
                        is_active=True
                    )
                )

    db.session.commit()

    print("Demo clinics and doctors created successfully.")
    print("Doctor login password: Doctor@123")
