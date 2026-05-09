from flask import Blueprint, request, jsonify
from extensions import mongo
import uuid
import datetime

from models.schemas import OrderCreateSchema
from pydantic import ValidationError

orders_bp = Blueprint('orders_bp', __name__)

@orders_bp.route('/create-order', methods=['POST'])
def create_order():
    try:
        data = OrderCreateSchema(**request.json)
    except ValidationError as e:
        return jsonify({"message": "Validation error", "details": e.errors()}), 400
        
    order = {
        "order_id": str(uuid.uuid4()),
        "order_type": data.order_type,
        "item": data.item,
        "pickup_name": data.pickup_name or data.pickup or "Unknown",
        "drop_name": data.drop_name or data.drop or "Unknown",
        "priority": data.priority,
        "status": "pending",
        "created_at": datetime.datetime.utcnow()
    }
    
    # Add geolocation if provided
    if data.pickup_location:
        order["pickup_location"] = data.pickup_location.model_dump()
    if data.drop_location:
        order["drop_location"] = data.drop_location.model_dump()
    
    # Store in MongoDB
    mongo.db.orders.insert_one(order)
    order['_id'] = str(order['_id'])
    order['created_at'] = order['created_at'].isoformat()
    
    # Run the heavy matching logic in a background thread so the API responds instantly!
    from utils.worker import run_background_task
    from services.matching import calculate_match
    
    def async_match(order_obj):
        # In a real app, this would use Celery + Redis
        # calculate_match handles MongoDB $near geospatial queries
        match_result = calculate_match(order_obj)
        print(f"Background Match Found: {match_result}")
        
    run_background_task(async_match, order)
    
    # Calculate Surge Pricing based on demand (pending orders)
    pending_count = mongo.db.orders.count_documents({"status": "pending"})
    surge_multiplier = 1.0
    if pending_count > 10:
        surge_multiplier = 1.5
    elif pending_count > 20:
        surge_multiplier = 2.0
        
    return jsonify({
        "message": "Order Created Successfully",
        "surge_multiplier": surge_multiplier,
        "estimated_fee": round(5.0 * surge_multiplier, 2), # Base fee of $5.00
        "order": order
    })
