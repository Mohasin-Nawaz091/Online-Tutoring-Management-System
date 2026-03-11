"""
routes/subjects.py  –  /api/subjects
"""
from flask import Blueprint, request, jsonify
from models import db, Subject

subjects_bp = Blueprint('subjects', __name__)


@subjects_bp.route('/', methods=['GET'])
def get_all():
    return jsonify([s.to_dict() for s in Subject.query.order_by(Subject.subject_name).all()])


@subjects_bp.route('/', methods=['POST'])
def create():
    data = request.get_json()
    name = (data.get('subject_name') or '').strip()
    if not name:
        return jsonify({'error': 'subject_name is required'}), 400
    if Subject.query.filter_by(subject_name=name).first():
        return jsonify({'error': 'Subject already exists'}), 409
    s = Subject(subject_name=name)
    db.session.add(s)
    db.session.commit()
    return jsonify(s.to_dict()), 201


@subjects_bp.route('/<int:subject_id>', methods=['DELETE'])
def delete(subject_id):
    s = Subject.query.get_or_404(subject_id)
    db.session.delete(s)
    db.session.commit()
    return jsonify({'success': True})
