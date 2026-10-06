from models.models import db, AuditLog, SecurityAlert

def audit(user_id, action, resource_type=None, resource_id=None, result="success", ip_address=None):
    row = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        result=result,
        ip_address=ip_address
    )
    db.session.add(row)

def security_alert(user_id, alert_type, description, severity="high"):
    row = SecurityAlert(
        user_id=user_id,
        alert_type=alert_type,
        description=description,
        severity=severity
    )
    db.session.add(row)
