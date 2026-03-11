"""
routes/bookings.py  –  /api/bookings
"""
import uuid
from flask import Blueprint, request, jsonify
from models import db, Booking

bookings_bp = Blueprint('bookings', __name__)


@bookings_bp.route('/', methods=['GET'])
def get_all():
    # Optional: ?student_id=xxx  or  ?tutor_id=xxx
    q          = Booking.query
    student_id = request.args.get('student_id')
    tutor_id   = request.args.get('tutor_id')
    if student_id: q = q.filter_by(student_id=student_id)
    if tutor_id:   q = q.filter_by(tutor_id=tutor_id)
    return jsonify([b.to_dict() for b in q.order_by(Booking.created_at.desc()).all()])


@bookings_bp.route('/<booking_id>', methods=['GET'])
def get_one(booking_id):
    b = Booking.query.get_or_404(booking_id)
    return jsonify(b.to_dict())


@bookings_bp.route('/', methods=['POST'])
def create():
    data = request.get_json()
    b = Booking(
        id         = str(uuid.uuid4()),
        student_id = data['student_id'],
        tutor_id   = data['tutor_id'],
        subject    = data['subject'],
        date       = data['date'],
        time       = data['time'],
        duration   = data.get('duration', 1),
        status     = data.get('status', 'pending'),
        notes      = data.get('notes', ''),
    )
    db.session.add(b)
    db.session.commit()
    return jsonify(b.to_dict()), 201


@bookings_bp.route('/<booking_id>', methods=['PUT'])
def update(booking_id):
    b    = Booking.query.get_or_404(booking_id)
    data = request.get_json()
    if 'status'   in data: b.status   = data['status']
    if 'date'     in data: b.date     = data['date']
    if 'time'     in data: b.time     = data['time']
    if 'duration' in data: b.duration = data['duration']
    if 'notes'    in data: b.notes    = data['notes']
    db.session.commit()
    return jsonify(b.to_dict())


@bookings_bp.route('/<booking_id>', methods=['DELETE'])
def delete(booking_id):
    b = Booking.query.get_or_404(booking_id)
    db.session.delete(b)
    db.session.commit()
    return jsonify({'success': True})
