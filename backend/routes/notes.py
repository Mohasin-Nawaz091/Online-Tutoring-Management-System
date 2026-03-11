from flask import Blueprint, request, jsonify
from models import db, Note

notes_bp = Blueprint('notes', __name__)

@notes_bp.route('/<booking_id>', methods=['GET'])
def get_notes(booking_id):
    items = Note.query.filter_by(booking_id=booking_id).order_by(Note.created_at.desc()).all()
    return jsonify([i.to_dict() for i in items])

@notes_bp.route('/', methods=['POST'])
def add_note():
    data = request.json
    note = Note(
        booking_id=data.get('booking_id'),
        title=data.get('title'),
        content=data.get('content')
    )
    db.session.add(note)
    db.session.commit()
    return jsonify(note.to_dict()), 201

@notes_bp.route('/<id>', methods=['DELETE'])
def delete_note(id):
    note = Note.query.get(id)
    if note:
        db.session.delete(note)
        db.session.commit()
    return jsonify({'message': 'Deleted'})
