from flask import Blueprint, request, jsonify
from models import db, Message

messages_bp = Blueprint('messages', __name__)

@messages_bp.route('/<booking_id>', methods=['GET'])
def get_messages(booking_id):
    items = Message.query.filter_by(booking_id=booking_id).order_by(Message.timestamp.asc()).all()
    return jsonify([i.to_dict() for i in items])

@messages_bp.route('/', methods=['POST'])
def send_message():
    data = request.json
    msg = Message(
        booking_id=data.get('booking_id'),
        sender_id=data.get('sender_id'),
        text=data.get('text')
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.to_dict()), 201
