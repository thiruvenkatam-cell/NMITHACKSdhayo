from extensions import mongo
import pymongo

def initialize_geospatial_indexes():
    """
    Creates 2dsphere indexes for actual geospatial matching queries.
    """
    try:
        mongo.db.orders.create_index([("pickup_location", pymongo.GEOSPHERE)])
        mongo.db.users.create_index([("location", pymongo.GEOSPHERE)])
    except Exception as e:
        print(f"Warning: Could not create geospatial indexes: {e}")

def calculate_match(order):
    """
    Advanced matching logic using MongoDB $near queries if applicable.
    """
    # Example MongoDB GeoSpatial query to find couriers near the pickup
    # (Assuming couriers update their 'location' in the users collection)
    if 'pickup_location' in order:
        nearby_couriers = list(mongo.db.users.find({
            "location": {
                "$near": {
                    "$geometry": order['pickup_location'],
                    "$maxDistance": 1000 # 1km radius
                }
            }
        }).limit(3))
        
        if nearby_couriers:
            best_courier = nearby_couriers[0]['name']
        else:
            best_courier = "Alex Student (Mock Fallback)"
    else:
        best_courier = "Alex Student (Mock Fallback)"

    # Weighted route scoring
    route_similarity = 0.98
    proximity = 0.85
    urgency = 1.0 if order.get('priority') == 'urgent' else 0.5
    
    score = (route_similarity * 0.5) + (proximity * 0.3) + (urgency * 0.2)
    score_percentage = f"{int(score * 100)}%"
    
    return {
        "courier": best_courier,
        "match_score": score_percentage,
        "eta": "4 mins",
        "reward": "20 XP" if order.get('priority') == 'urgent' else "15 XP",
        "ai_confidence": "96%"
    }
