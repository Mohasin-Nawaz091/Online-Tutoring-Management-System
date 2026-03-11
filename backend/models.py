"""
SQLAlchemy ORM Models for TutorFlow
Mirrors the data.js simulated schema exactly.
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Student(db.Model):
    __tablename__ = 'students'

    id         = db.Column(db.String(36), primary_key=True)
    name       = db.Column(db.String(120), nullable=False)
    email      = db.Column(db.String(120), unique=True, nullable=False)
    phone      = db.Column(db.String(30))
    password   = db.Column(db.String(255), nullable=False)
    photo      = db.Column(db.String(255))
    role       = db.Column(db.String(10), default='student')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    bookings   = db.relationship('Booking', backref='student', lazy=True)

    def to_dict(self):
        return {
            'id':         self.id,
            'name':       self.name,
            'email':      self.email,
            'phone':      self.phone or '',
            'role':       self.role,
            'photo':      self.photo or '',
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Tutor(db.Model):
    __tablename__ = 'tutors'

    id           = db.Column(db.String(36), primary_key=True)
    name         = db.Column(db.String(120), nullable=False)
    email        = db.Column(db.String(120), unique=True, nullable=False)
    phone        = db.Column(db.String(30))
    password     = db.Column(db.String(255), nullable=False)
    role         = db.Column(db.String(10), default='tutor')
    bio          = db.Column(db.Text)
    experience   = db.Column(db.String(60))
    hourly_price = db.Column(db.Float, default=0)
    rating       = db.Column(db.Float, default=0)
    photo        = db.Column(db.String(255))
    # subjects stored as comma-separated string; split on read
    subjects_csv = db.Column('subjects', db.Text)
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    bookings     = db.relationship('Booking', backref='tutor', lazy=True)

    @property
    def subjects(self):
        if not self.subjects_csv:
            return []
        return [s.strip() for s in self.subjects_csv.split(',') if s.strip()]

    @subjects.setter
    def subjects(self, value):
        self.subjects_csv = ','.join(value) if value else ''

    def to_dict(self):
        return {
            'id':           self.id,
            'name':         self.name,
            'email':        self.email,
            'phone':        self.phone or '',
            'role':         self.role,
            'bio':          self.bio or '',
            'experience':   self.experience or '',
            'hourly_price': self.hourly_price,
            'rating':       self.rating,
            'photo':        self.photo or '',
            'subjects':     self.subjects,
            'created_at':   self.created_at.isoformat() if self.created_at else None,
        }


class Booking(db.Model):
    __tablename__ = 'bookings'

    id         = db.Column(db.String(36), primary_key=True)
    student_id = db.Column(db.String(36), db.ForeignKey('students.id'), nullable=False)
    tutor_id   = db.Column(db.String(36), db.ForeignKey('tutors.id'),   nullable=False)
    subject    = db.Column(db.String(100), nullable=False)
    date       = db.Column(db.String(20), nullable=False)   # stored as 'YYYY-MM-DD'
    time       = db.Column(db.String(10), nullable=False)   # stored as 'HH:MM'
    duration   = db.Column(db.Float, default=1)
    status     = db.Column(db.String(20), default='pending')  # pending/confirmed/rejected/completed
    notes      = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':         self.id,
            'student_id': self.student_id,
            'tutor_id':   self.tutor_id,
            'subject':    self.subject,
            'date':       self.date,
            'time':       self.time,
            'duration':   self.duration,
            'status':     self.status,
            'notes':      self.notes or '',
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Subject(db.Model):
    __tablename__ = 'subjects'

    id           = db.Column(db.Integer, primary_key=True, autoincrement=True)
    subject_name = db.Column(db.String(120), unique=True, nullable=False)

    def to_dict(self):
        return {
            'id':           self.id,
            'subject_name': self.subject_name,
        }
class Availability(db.Model):
    __tablename__ = 'availability'
    id       = db.Column(db.Integer, primary_key=True)
    tutor_id = db.Column(db.String(36), db.ForeignKey('tutors.id'), nullable=False)
    day      = db.Column(db.String(20), nullable=False) # Monday, Tuesday, etc.
    slots    = db.Column(db.Text) # Stored as comma separated "09:00,10:00,11:00"

    def to_dict(self):
        return {
            'id': self.id,
            'tutor_id': self.tutor_id,
            'day': self.day,
            'slots': [s.strip() for s in self.slots.split(',') if s.strip()] if self.slots else []
        }

class Message(db.Model):
    __tablename__ = 'messages'
    id         = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.String(36), db.ForeignKey('bookings.id'), nullable=False)
    sender_id  = db.Column(db.String(36), nullable=False)
    text       = db.Column(db.Text, nullable=False)
    timestamp  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'sender_id': self.sender_id,
            'text': self.text,
            'timestamp': self.timestamp.isoformat()
        }

class Note(db.Model):
    __tablename__ = 'notes'
    id         = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.String(36), db.ForeignKey('bookings.id'), nullable=False)
    title      = db.Column(db.String(200), nullable=False)
    content    = db.Column(db.Text) # Can be a shared link or actual text
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'title': self.title,
            'content': self.content or '',
            'created_at': self.created_at.isoformat()
        }
