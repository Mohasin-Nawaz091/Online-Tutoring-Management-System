"""
Flask Application Entry Point – TutorFlow Backend
Run: python app.py
"""
from flask import Flask
from flask_cors import CORS

from config import DATABASE_URI, SECRET_KEY, DEBUG
from models import db

# ── Route blueprints ──────────────────────────────────────────────────────────
from routes.auth     import auth_bp
from routes.students import students_bp
from routes.tutors   import tutors_bp
from routes.bookings import bookings_bp
from routes.subjects import subjects_bp
from routes.availability import availability_bp
from routes.messages import messages_bp
from routes.notes import notes_bp


def create_app():
    app = Flask(__name__)

    # Config
    app.config['SQLALCHEMY_DATABASE_URI']        = DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY']                     = SECRET_KEY

    # Extensions
    db.init_app(app)
    CORS(app, resources={r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }})

    # Register blueprints
    from routes.auth     import auth_bp
    from routes.students import students_bp
    from routes.tutors   import tutors_bp
    from routes.bookings import bookings_bp
    from routes.subjects import subjects_bp
    from routes.availability import availability_bp
    from routes.messages import messages_bp
    from routes.notes import notes_bp

    app.register_blueprint(auth_bp,     url_prefix='/api/auth')
    app.register_blueprint(students_bp, url_prefix='/api/students')
    app.register_blueprint(tutors_bp,   url_prefix='/api/tutors')
    app.register_blueprint(bookings_bp, url_prefix='/api/bookings')
    app.register_blueprint(subjects_bp, url_prefix='/api/subjects')
    app.register_blueprint(availability_bp, url_prefix='/api/availability')
    app.register_blueprint(messages_bp, url_prefix='/api/messages')
    app.register_blueprint(notes_bp, url_prefix='/api/notes')

    # Health check
    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'message': 'TutorFlow API is running'}

    # Global Error Handlers (important for CORS on errors)
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'message': 'Endpoint not found'}), 404

    @app.errorhandler(500)
    def server_error(e):
        app.logger.error(f"Server Error: {e}")
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

    @app.errorhandler(409)
    def conflict_error(e):
        return jsonify({'success': False, 'message': str(e)}), 409

    return app


app = create_app()

if __name__ == '__main__':
    with app.app_context():
        # Force recreation to pick up new 'photo' and other columns
        # In a real app we'd use migrations, but for this prototype drop/create is safest
        db.create_all()         
        print("✅ Database tables ready.")
    app.run(host='0.0.0.0', port=5000, debug=DEBUG)
