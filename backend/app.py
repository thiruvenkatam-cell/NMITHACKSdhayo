import eventlet
eventlet.monkey_patch()

from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_pymongo import PyMongo

from config import Config

from extensions import mongo, socketio

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Initialize plugins
    mongo.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*", async_mode='eventlet')
    
    with app.app_context():
        from services.matching import initialize_geospatial_indexes
        initialize_geospatial_indexes()
    
    # Register blueprints (Lazy loaded to avoid circular imports)
    from routes.orders import orders_bp
    from routes.tracking import tracking_bp
    from routes.ai import ai_bp
    from routes.delivery import delivery_bp
    from routes.rewards import rewards_bp
    from routes.auth import auth_bp
    
    app.register_blueprint(orders_bp)
    app.register_blueprint(tracking_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(delivery_bp)
    app.register_blueprint(rewards_bp)
    app.register_blueprint(auth_bp)
    
    # Global Error Handler to ensure the frontend never receives HTML error pages
    @app.errorhandler(Exception)
    def handle_exception(e):
        return jsonify({
            "status": "error",
            "message": str(e),
            "type": e.__class__.__name__
        }), getattr(e, 'code', 500)

    @app.route('/')
    def home():
        return jsonify({"message": "UniDrop Backend Running with Socket.IO and MongoDB"})

    @app.route('/test-db')
    def test_db():
        try:
            mongo.db.test.insert_one({"message": "MongoDB Connected"})
            return jsonify({"status": "success", "message": "Database Connected"})
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.route('/analytics')
    def analytics():
        return jsonify({
            "active_users": 1248,
            "deliveries_today": 342,
            "hotspots": 12,
            "avg_eta_mins": 11,
            "co2_saved_kg": 142
        })

    return app

app = create_app()

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5001)