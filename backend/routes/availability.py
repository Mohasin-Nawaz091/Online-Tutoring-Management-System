from flask import Blueprint, request, jsonify
from models import db, Availability

availability_bp = Blueprint('availability', __name__)

@availability_bp.route('/<tutor_id>', methods=['GET'])
def get_availability(tutor_id):
    items = Availability.query.filter_by(tutor_id=tutor_id).all()
    return jsonify([i.to_dict() for i in items])

@availability_bp.route('/', methods=['POST'])
def update_availability():
    data = request.json
    tutor_id = data.get('tutor_id')
    day = data.get('day')
    slots = data.get('slots', []) # Expecting list of strings

    # Find or create
    item = Availability.query.filter_by(tutor_id=tutor_id, day=day).first()
    if not item:
        item = Availability(tutor_id=tutor_id, day=day)
        db.session.add(item)
    
    item.slots = ','.join(slots)
    db.session.commit()
    return jsonify(item.to_dict())
