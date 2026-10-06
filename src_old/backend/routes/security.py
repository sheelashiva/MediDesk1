from flask import Blueprint
from security.decorators import role_required
from models.models import SecurityAlert

security_bp = Blueprint("security", __name__, url_prefix="/api/security")

@security_bp.route("/alerts", methods=["GET"])
@role_required("admin")
def alerts():
    rows = SecurityAlert.query.order_by(SecurityAlert.created_at.desc()).limit(100).all()
    return [{
        "id": r.id, "type": r.alert_type, "description": r.description,
        "severity": r.severity, "resolved": r.is_resolved,
        "created_at": r.created_at.isoformat() if r.created_at else None
    } for r in rows], 200
