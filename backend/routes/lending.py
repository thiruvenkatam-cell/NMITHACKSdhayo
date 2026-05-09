from flask import Blueprint, request, jsonify
from extensions import mongo
import uuid
import datetime

lending_bp = Blueprint('lending_bp', __name__)

@lending_bp.route('/request-item', methods=['POST'])
def request_item():
    """Create a new lending request for an item."""
    data = request.json

    lend_request = {
        "request_id": str(uuid.uuid4()),
        "requester_id": data.get('requester_id', 'demo_user'),
        "item": data.get('item', 'Calculator'),
        "duration": data.get('duration', '2 hours'),
        "reward_xp": data.get('reward', 50),
        "pickup": data.get('pickup', 'Library'),
        "category": data.get('category', 'academic'),
        "status": "pending",  # pending -> matched -> handed_over -> returned
        "lender_id": None,
        "created_at": datetime.datetime.utcnow(),
        "return_by": None
    }

    mongo.db.lend_requests.insert_one(lend_request)
    lend_request['_id'] = str(lend_request['_id'])
    # Convert datetime for JSON serialization
    lend_request['created_at'] = lend_request['created_at'].isoformat()

    # Try to find a lender match
    from services.matching import calculate_lend_match
    match = calculate_lend_match(lend_request)

    from services.notification_service import create_notification
    create_notification(
        user_id=lend_request['requester_id'],
        event_type="LEND_REQUEST_CREATED",
        message=f"Your request for '{lend_request['item']}' has been posted! Looking for lenders nearby..."
    )

    return jsonify({
        "message": "Lending request created successfully",
        "request": lend_request,
        "match": match
    }), 201


@lending_bp.route('/accept-lend', methods=['POST'])
def accept_lend():
    """A lender accepts a lending request."""
    data = request.json
    request_id = data.get('request_id')
    lender_id = data.get('lender_id', 'lender_demo')

    mongo.db.lend_requests.update_one(
        {"request_id": request_id},
        {"$set": {
            "status": "matched",
            "lender_id": lender_id,
            "matched_at": datetime.datetime.utcnow()
        }}
    )

    # Generate OTP for handover verification
    from services.otp import generate_otp
    otp = generate_otp(request_id)

    from services.notification_service import create_notification
    create_notification(
        user_id=lender_id,
        event_type="LEND_ACCEPTED",
        message=f"You accepted a lending request. Handover OTP: {otp}"
    )

    return jsonify({
        "message": "Lending request accepted",
        "request_id": request_id,
        "lender_id": lender_id,
        "handover_otp": otp
    })


@lending_bp.route('/verify-handover', methods=['POST'])
def verify_handover():
    """Verify OTP when item is handed over to the requester."""
    data = request.json
    request_id = data.get('request_id')
    provided_otp = data.get('otp')

    from services.otp import verify_otp
    if verify_otp(request_id, provided_otp):
        # Calculate return time
        lend_req = mongo.db.lend_requests.find_one({"request_id": request_id})
        duration_str = lend_req.get('duration', '2 hours') if lend_req else '2 hours'

        # Parse duration (e.g., "2 hours" -> 2)
        try:
            hours = int(duration_str.split()[0])
        except (ValueError, IndexError):
            hours = 2

        return_by = datetime.datetime.utcnow() + datetime.timedelta(hours=hours)

        mongo.db.lend_requests.update_one(
            {"request_id": request_id},
            {"$set": {
                "status": "handed_over",
                "handed_over_at": datetime.datetime.utcnow(),
                "return_by": return_by
            }}
        )

        from services.notification_service import create_notification
        create_notification(
            user_id=lend_req.get('requester_id', 'unknown'),
            event_type="ITEM_RECEIVED",
            message=f"Item received! Please return by {return_by.strftime('%I:%M %p')}"
        )

        return jsonify({
            "message": "Handover verified! Item lending is now active.",
            "return_by": return_by.isoformat(),
            "status": "handed_over"
        })
    else:
        return jsonify({"message": "Invalid OTP"}), 400


@lending_bp.route('/return-item', methods=['POST'])
def return_item():
    """Mark an item as returned and award XP."""
    data = request.json
    request_id = data.get('request_id')

    lend_req = mongo.db.lend_requests.find_one({"request_id": request_id})
    if not lend_req:
        return jsonify({"message": "Lending request not found"}), 404

    mongo.db.lend_requests.update_one(
        {"request_id": request_id},
        {"$set": {
            "status": "returned",
            "returned_at": datetime.datetime.utcnow()
        }}
    )

    # Award XP to lender
    reward_xp = lend_req.get('reward_xp', 50)
    from services.reward_service import award_xp, check_badge_unlock
    award_xp(lend_req.get('lender_id'), reward_xp)
    new_badge = check_badge_unlock(lend_req.get('lender_id'))

    from services.notification_service import create_notification
    create_notification(
        user_id=lend_req.get('lender_id'),
        event_type="ITEM_RETURNED",
        message=f"Item returned! You earned {reward_xp} XP."
    )

    return jsonify({
        "message": "Item returned successfully!",
        "xp_earned": reward_xp,
        "badge_unlocked": new_badge
    })


@lending_bp.route('/lend-requests', methods=['GET'])
def get_lend_requests():
    """Get all active lending requests (for lender discovery feed)."""
    status_filter = request.args.get('status', 'pending')
    requests_list = list(mongo.db.lend_requests.find(
        {"status": status_filter},
        {"_id": 0}
    ).sort("created_at", -1).limit(20))

    return jsonify({"requests": requests_list})
