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
        "pickup_name": data.pickup_name,
        "drop_name": data.drop_name,
        "pickup_location": data.pickup_location.model_dump(),
        "drop_location": data.drop_location.model_dump(),
        "priority": data.priority,
        "status": "pending",
        "created_at": datetime.datetime.utcnow()
    }
    
    # Store in MongoDB
    mongo.db.orders.insert_one(order)
    order['_id'] = str(order['_id'])
    
    # Run the heavy matching logic in a background thread so the API responds instantly!
    from utils.worker import run_background_task
    from services.matching import calculate_match
    
    def async_match(order_obj):
        # In a real app, this would use Celery + Redis
        # calculate_match handles MongoDB $near geospatial queries
        match_result = calculate_match(order_obj)
        print(f"Background Match Found: {match_result}")
        
    run_background_task(async_match, order)
    
    return jsonify({
        "message": "Order Created Successfully",
        "order": order
    })
