from flask import Blueprint, jsonify, request
from extensions import socketio, mongo
from flask_socketio import join_room, leave_room
import threading
import time

tracking_bp = Blueprint('tracking_bp', __name__)

# Simulated campus GPS route (NMIT area)
CAMPUS_ROUTE = [
    {"lat": 13.0827, "lng": 80.2707, "stage": "Picked up"},
    {"lat": 13.0829, "lng": 80.2709, "stage": "En route"},
    {"lat": 13.0831, "lng": 80.2711, "stage": "En route"},
    {"lat": 13.0833, "lng": 80.2713, "stage": "Crossing Main Quad"},
    {"lat": 13.0835, "lng": 80.2715, "stage": "Near Library"},
    {"lat": 13.0837, "lng": 80.2717, "stage": "Almost there"},
    {"lat": 13.0839, "lng": 80.2719, "stage": "Arriving"},
    {"lat": 13.0841, "lng": 80.2721, "stage": "At drop-off"},
]


@tracking_bp.route('/tracking', methods=['GET'])
def get_tracking():
    """Get current tracking state for an order."""
    order_id = request.args.get('order_id')

    if order_id:
        track_data = mongo.db.tracking.find_one(
            {"order_id": order_id}, {"_id": 0}
        )
        if track_data:
            return jsonify(track_data)

    # Default demo tracking response
    return jsonify({
        "status": "in_transit",
        "current_location": {"lat": 13.0833, "lng": 80.2713},
        "eta": "4 mins",
        "courier": "Vikash S.",
        "stage": "Crossing Main Quad",
        "progress_percent": 50
    })


@tracking_bp.route('/tracking/simulate', methods=['POST'])
def simulate_tracking():
    """Start a mock GPS simulation for demo purposes."""
    data = request.json or {}
    order_id = data.get('order_id', 'demo_order')

    def run_simulation(app, order_id):
        with app.app_context():
            total_steps = len(CAMPUS_ROUTE)
            for i, point in enumerate(CAMPUS_ROUTE):
                progress = int(((i + 1) / total_steps) * 100)
                eta = max(1, total_steps - i - 1)

                payload = {
                    "order_id": order_id,
                    "lat": point["lat"],
                    "lng": point["lng"],
                    "stage": point["stage"],
                    "eta": f"{eta} min{'s' if eta != 1 else ''}",
                    "progress_percent": progress,
                    "step": i + 1,
                    "total_steps": total_steps
                }

                # Emit to the specific order room AND globally
                socketio.emit('live_location', payload, to=order_id)
                socketio.emit('live_location', payload)

                # Also emit delivery stage updates
                socketio.emit('delivery_status', {
                    "order_id": order_id,
                    "status": "completed" if progress == 100 else "in_transit",
                    "stage": point["stage"],
                    "progress": progress
                }, to=order_id)

                time.sleep(3)  # Move every 3 seconds

            # Final: mark as arrived
            socketio.emit('delivery_status', {
                "order_id": order_id,
                "status": "arrived",
                "stage": "Delivered",
                "progress": 100
            }, to=order_id)

    # Run simulation in background thread
    from flask import current_app
    app = current_app._get_current_object()
    thread = threading.Thread(target=run_simulation, args=(app, order_id))
    thread.daemon = True
    thread.start()

    return jsonify({
        "message": "GPS simulation started",
        "order_id": order_id,
        "total_steps": len(CAMPUS_ROUTE),
        "interval": "3 seconds per step"
    })


# ─── Socket.IO Events ───────────────────────────────────────────

@socketio.on('join_order_room')
def handle_join_room(data):
    order_id = data.get('order_id')
    if order_id:
        join_room(order_id)
        socketio.emit('room_update', {
            'message': f'Joined tracking room for order {order_id}'
        }, to=order_id)


@socketio.on('location_update')
def handle_location_update(data):
    """Handle real GPS updates from courier's device."""
    order_id = data.get('order_id')
    if order_id:
        socketio.emit('live_location', data, to=order_id)
    else:
        socketio.emit('live_location', data)


@socketio.on('send_chat_message')
def handle_chat_message(data):
    """In-delivery chat between courier and requester."""
    order_id = data.get('order_id')
    message = data.get('message')
    sender = data.get('sender', 'Anonymous')
    if order_id and message:
        socketio.emit('new_chat_message', {
            'sender': sender,
            'message': message
        }, to=order_id)
