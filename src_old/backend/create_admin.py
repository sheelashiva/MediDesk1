from flask_bcrypt import Bcrypt
from app import app
from models.models import db, User

bcrypt = Bcrypt(app)

username = input("Admin username: ").strip()
email = input("Admin email: ").strip().lower()
phone = input("Admin phone: ").strip()
password = input("Admin password (8+ chars): ")

with app.app_context():
    if User.query.filter((User.username == username) | (User.email == email)).first():
        print("Admin username/email already exists.")
    else:
        user = User(
            username=username,
            email=email,
            phone=phone,
            password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
            role="admin"
        )
        db.session.add(user)
        db.session.commit()
        print(f"Admin created successfully. ID={user.id}")
