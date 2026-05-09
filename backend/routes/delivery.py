from flask import Blueprint, request, jsonify
from extensions import mongo

delivery_bp = Blueprint('delivery_bp', __name__)

@delivery_bp.route('/accept-delivery', methods=['POST'])
def accept_delivery():
    data = request.json
    order_id = data.get('order_id')
    courier_id = data.get('courier_id', 'mock_courier_123')
    
    mongo.db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": "accepted", "courier_id": courier_id}}
    )
    
    from services.otp import generate_otp
    otp = generate_otp(order_id)
    
    from services.notifications import send_notification
    send_notification("DELIVERY_ACCEPTED", f"Courier is on the way! OTP: {otp}")
    
    return jsonify({
        "message": "Delivery Accepted",
        "otp_required": True
    })

@delivery_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    order_id = data.get('order_id')
    provided_otp = data.get('otp')
    
    from services.otp import verify_otp as check_otp
    if check_otp(order_id, provided_otp):
        mongo.db.orders.update_one(
            {"order_id": order_id},
            {"$set": {"status": "completed"}}
        )
        
        from services.notifications import send_notification
        send_notification("DELIVERY_COMPLETED", "Delivery completed successfully!")
        
        return jsonify({
            "message": "Delivery completed successfully!",
            "xp_earned": 20,
            "badge_unlocked": "Speed Courier"
        })
    else:
        return jsonify({"message": "Invalid OTP"}), 400
