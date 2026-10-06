from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt

from config import Config
from models.models import db
from routes.auth import auth_bp
from routes.admin import admin_bp
from routes.doctors import doctor_bp
from routes.appointments import appointment_bp
from routes.reports import report_bp
from routes.reviews import review_bp
from routes.security import security_bp

app = Flask(__name__)
app.config.from_object(Config)

CORS(app)
db.init_app(app)
JWTManager(app)
Bcrypt(app)

app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(doctor_bp)
app.register_blueprint(appointment_bp)
app.register_blueprint(report_bp)
app.register_blueprint(review_bp)
app.register_blueprint(security_bp)


@app.route("/")
def home():
    return {"message": "MediDesk API is running"}


@app.route("/health")
def health():
    return {"status": "healthy"}


with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)