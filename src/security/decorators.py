from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def role_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            role = get_jwt().get("role")
            if role not in allowed_roles:
                return jsonify({
                    "error": "Access denied",
                    "message": "You do not have permission to access this resource"
                }), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
