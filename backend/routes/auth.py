"""
routes/auth.py  –  POST /api/auth/login  and  POST /api/auth/register
"""
import uuid
from flask import Blueprint, request, jsonify
from models import db, Student, Tutor

auth_bp = Blueprint('auth', __name__)

ADMIN_EMAIL    = 'admin@tutorflow.com'
ADMIN_PASSWORD = 'admin123'


@auth_bp.route('/login', methods=['POST'])
def login():
    data     = request.get_json()
    email    = (data.get('email') or '').lower().strip()
    password = data.get('password', '')

    # Admin check
    if email == ADMIN_EMAIL and password == ADMIN_PASSWORD:
        return jsonify({
            'success': True,
            'user': {
                'id': 'admin-1', 'name': 'Admin', 'email': ADMIN_EMAIL, 'role': 'admin'
            }
        })

    # Student check
    student = Student.query.filter_by(email=email).first()
    if student and student.password == password:
        return jsonify({'success': True, 'user': student.to_dict()})

    # Tutor check
    tutor = Tutor.query.filter_by(email=email).first()
    if tutor and tutor.password == password:
        return jsonify({'success': True, 'user': tutor.to_dict()})

    return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401


@auth_bp.route('/register', methods=['POST'])
def register():
    data     = request.get_json()
    email    = (data.get('email') or '').lower().strip()
    name     = data.get('name', '').strip()
    phone    = data.get('phone', '').strip()
    password = data.get('password', '')
    role     = data.get('role', 'student')

    # Check duplicate
    if Student.query.filter_by(email=email).first() or \
       Tutor.query.filter_by(email=email).first() or \
       email == ADMIN_EMAIL:
        return jsonify({'success': False, 'message': 'An account with this email already exists.'}), 409

    new_id = str(uuid.uuid4())
    if role == 'student':
        user = Student(id=new_id, name=name, email=email, phone=phone, password=password, role='student')
        db.session.add(user)
    else:
        user = Tutor(id=new_id, name=name, email=email, phone=phone, password=password, role='tutor')
        user.subjects = []
        db.session.add(user)

    db.session.commit()
    return jsonify({'success': True, 'user': user.to_dict()}), 201
