from flask import Blueprint, jsonify
from extensions import socketio

tracking_bp = Blueprint('tracking_bp', __name__)

@tracking_bp.route('/tracking', methods=['GET'])
def get_tracking():
    # MVP static representation
    return jsonify({
        "status": "in_transit",
        "current_location": {"lat": 37.4250, "lng": -122.1650},
        "eta": "4 mins",
        "courier": "Michael R."
    })

# Socket.io Events for Realtime Tracking Simulation
@socketio.on('location_update')
def handle_location_update(data):
    # data is expected to be { "order_id": "...", "lat": 37.4250, "lng": -122.1650 }
    socketio.emit('live_location', data, broadcast=True)
