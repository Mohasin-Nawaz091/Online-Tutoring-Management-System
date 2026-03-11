"""
seed.py – Seeds MySQL database with demo data matching the frontend's data.js
Run once after tables are created:  python seed.py
"""
from app import create_app
from models import db, Student, Tutor, Booking, Subject

STUDENTS = [
    {'id': 's1', 'name': 'Alex Johnson',  'email': 'alex@student.com',  'phone': '555-0101', 'password': '123456', 'role': 'student'},
    {'id': 's2', 'name': 'Emily Smith',   'email': 'emily@student.com', 'phone': '555-0102', 'password': '123456', 'role': 'student'},
    {'id': 's3', 'name': 'David Lee',     'email': 'david@student.com', 'phone': '555-0103', 'password': '123456', 'role': 'student'},
]

TUTORS = [
    {
        'id': 't1', 'name': 'Dr. Sarah Jenkins', 'email': 'sarah@tutor.com',
        'phone': '555-0201', 'password': '123456', 'role': 'tutor',
        'bio': 'PhD in Mathematics with 10+ years of teaching experience. Specializing in Calculus, Statistics and SAT Prep.',
        'experience': '10 years', 'hourly_price': 45, 'rating': 4.9,
        'subjects': 'Calculus,Statistics,SAT Prep',
        'photo': 'https://img.icons8.com/pulsar-color/96/teacher.png',
    },
    {
        'id': 't2', 'name': 'Mark Thompson', 'email': 'mark@tutor.com',
        'phone': '555-0202', 'password': '123456', 'role': 'tutor',
        'bio': 'Full-stack developer turned educator. Helping students master Python, React and SQL.',
        'experience': '6 years', 'hourly_price': 60, 'rating': 4.8,
        'subjects': 'Python,React,SQL',
        'photo': 'https://img.icons8.com/pulsar-color/96/teacher-man.png',
    },
    {
        'id': 't3', 'name': 'Elena Rodriguez', 'email': 'elena@tutor.com',
        'phone': '555-0203', 'password': '123456', 'role': 'tutor',
        'bio': 'Native Spanish speaker with a Masters in Linguistics. Teaching French, Spanish and ESL.',
        'experience': '8 years', 'hourly_price': 35, 'rating': 5.0,
        'subjects': 'Spanish,French,ESL',
        'photo': '',
    },
    {
        'id': 't4', 'name': 'James Wilson', 'email': 'james@tutor.com',
        'phone': '555-0204', 'password': '123456', 'role': 'tutor',
        'bio': 'Physics PhD candidate passionate about making complex concepts simple.',
        'experience': '4 years', 'hourly_price': 50, 'rating': 4.7,
        'subjects': 'Physics,Chemistry,Biology',
        'photo': '',
    },
    {
        'id': 't5', 'name': 'Aisha Patel', 'email': 'aisha@tutor.com',
        'phone': '555-0205', 'password': '123456', 'role': 'tutor',
        'bio': 'Data scientist with industry experience at top tech firms. Teaching Data Science and ML.',
        'experience': '5 years', 'hourly_price': 70, 'rating': 4.6,
        'subjects': 'Data Science,Machine Learning,Python',
        'photo': '',
    },
]

BOOKINGS = [
    {
        'id': 'b1', 'student_id': 's1', 'tutor_id': 't1',
        'subject': 'Calculus', 'date': '2026-03-12', 'time': '10:00',
        'duration': 1, 'status': 'confirmed',
    },
    {
        'id': 'b2', 'student_id': 's1', 'tutor_id': 't2',
        'subject': 'Python', 'date': '2026-03-13', 'time': '14:00',
        'duration': 2, 'status': 'pending',
    },
    {
        'id': 'b3', 'student_id': 's2', 'tutor_id': 't1',
        'subject': 'Statistics', 'date': '2026-03-14', 'time': '11:00',
        'duration': 1.5, 'status': 'pending',
    },
    {
        'id': 'b4', 'student_id': 's3', 'tutor_id': 't3',
        'subject': 'Spanish', 'date': '2026-03-10', 'time': '09:00',
        'duration': 1, 'status': 'completed',
    },
]

SUBJECTS = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Computer Science', 'English Literature', 'Spanish', 'French',
    'ESL', 'Calculus', 'Statistics', 'SAT Prep', 'Python',
    'React', 'SQL', 'Data Science', 'Machine Learning',
]


def seed():
    app = create_app()
    with app.app_context():
        print("🔄  Resetting database schema...")
        db.drop_all()
        db.create_all()
        print("🗄️  Tables recreated successfully.")

        # Seed students
        for d in STUDENTS:
            db.session.add(Student(**d))
        print(f"👩‍🎓 Seeded {len(STUDENTS)} students.")

        # Seed tutors
        for d in TUTORS:
            subjects_csv = d.pop('subjects', '')
            t = Tutor(**d)
            t.subjects_csv = subjects_csv
            db.session.add(t)
        print(f"👨‍🏫 Seeded {len(TUTORS)} tutors.")

        # Seed bookings
        for d in BOOKINGS:
            db.session.add(Booking(**d))
        print(f"📅 Seeded {len(BOOKINGS)} bookings.")

        # Seed subjects
        for name in SUBJECTS:
            db.session.add(Subject(subject_name=name))
        print(f"📚 Seeded {len(SUBJECTS)} subjects.")

        db.session.commit()
        print("\n✅ Database seeded successfully!")
        print("   Login credentials:")
        print("   Student → alex@student.com / 123456")
        print("   Tutor   → sarah@tutor.com  / 123456")
        print("   Admin   → admin@tutorflow.com / admin123")


if __name__ == '__main__':
    seed()
