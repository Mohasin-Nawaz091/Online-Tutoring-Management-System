"""
routes/tutors.py  –  /api/tutors
"""
import uuid
from flask import Blueprint, request, jsonify
from models import db, Tutor

tutors_bp = Blueprint('tutors', __name__)


@tutors_bp.route('/', methods=['GET'])
def get_all():
    # Optional filters: ?subject=Math&min_price=10&max_price=100&sort=rating
    q          = Tutor.query
    subject    = request.args.get('subject')
    min_price  = request.args.get('min_price', type=float)
    max_price  = request.args.get('max_price', type=float)
    sort       = request.args.get('sort', 'rating')

    if subject:
        q = q.filter(Tutor.subjects_csv.like(f'%{subject}%'))
    if min_price is not None:
        q = q.filter(Tutor.hourly_price >= min_price)
    if max_price is not None:
        q = q.filter(Tutor.hourly_price <= max_price)
    if sort == 'price_asc':
        q = q.order_by(Tutor.hourly_price.asc())
    elif sort == 'price_desc':
        q = q.order_by(Tutor.hourly_price.desc())
    else:
        q = q.order_by(Tutor.rating.desc())

    return jsonify([t.to_dict() for t in q.all()])


@tutors_bp.route('/<tutor_id>', methods=['GET'])
def get_one(tutor_id):
    t = Tutor.query.get_or_404(tutor_id)
    return jsonify(t.to_dict())


@tutors_bp.route('/', methods=['POST'])
def create():
    data = request.get_json()
    t = Tutor(
        id           = str(uuid.uuid4()),
        name         = data['name'],
        email        = data['email'].lower().strip(),
        phone        = data.get('phone', ''),
        password     = data['password'],
        role         = 'tutor',
        bio          = data.get('bio', ''),
        experience   = data.get('experience', ''),
        hourly_price = data.get('hourly_price', 0),
        rating       = data.get('rating', 0),
        photo        = data.get('photo', ''),
    )
    t.subjects = data.get('subjects', [])
    db.session.add(t)
    db.session.commit()
    return jsonify(t.to_dict()), 201


@tutors_bp.route('/<tutor_id>', methods=['PUT'])
def update(tutor_id):
    t    = Tutor.query.get_or_404(tutor_id)
    data = request.get_json()
    if 'name'         in data: t.name         = data['name']
    if 'phone'        in data: t.phone        = data['phone']
    if 'bio'          in data: t.bio          = data['bio']
    if 'experience'   in data: t.experience   = data['experience']
    if 'hourly_price' in data: t.hourly_price  = data['hourly_price']
    if 'rating'       in data: t.rating       = data['rating']
    if 'photo'        in data: t.photo        = data['photo']
    if 'subjects'     in data: t.subjects     = data['subjects']
    db.session.commit()
    return jsonify(t.to_dict())


@tutors_bp.route('/<tutor_id>', methods=['DELETE'])
def delete(tutor_id):
    t = Tutor.query.get_or_404(tutor_id)
    db.session.delete(t)
    db.session.commit()
    return jsonify({'success': True})
