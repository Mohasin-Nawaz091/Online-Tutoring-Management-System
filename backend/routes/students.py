"""
routes/students.py  –  /api/students
"""
import uuid
from flask import Blueprint, request, jsonify
from models import db, Student

students_bp = Blueprint('students', __name__)


@students_bp.route('/', methods=['GET'])
def get_all():
    return jsonify([s.to_dict() for s in Student.query.all()])


@students_bp.route('/<student_id>', methods=['GET'])
def get_one(student_id):
    s = Student.query.get_or_404(student_id)
    return jsonify(s.to_dict())


@students_bp.route('/', methods=['POST'])
def create():
    data = request.get_json()
    s = Student(
        id       = str(uuid.uuid4()),
        name     = data['name'],
        email    = data['email'].lower().strip(),
        phone    = data.get('phone', ''),
        password = data['password'],
        role     = 'student',
    )
    db.session.add(s)
    db.session.commit()
    return jsonify(s.to_dict()), 201


@students_bp.route('/<student_id>', methods=['PUT'])
def update(student_id):
    s = Student.query.get_or_404(student_id)
    data = request.get_json()
    if 'name'  in data: s.name  = data['name']
    if 'phone' in data: s.phone = data['phone']
    db.session.commit()
    return jsonify(s.to_dict())


@students_bp.route('/<student_id>', methods=['DELETE'])
def delete(student_id):
    s = Student.query.get_or_404(student_id)
    db.session.delete(s)
    db.session.commit()
    return jsonify({'success': True})
