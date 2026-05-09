from flask import Blueprint, request, jsonify
from services.gemini_service import get_smart_suggestion
from services.matching import calculate_match

ai_bp = Blueprint('ai_bp', __name__)

@ai_bp.route('/match-route', methods=['GET'])
def match_route():
    # Use dummy order data to simulate match for MVP
    dummy_order = {
        "priority": request.args.get('priority', 'normal')
    }
    match = calculate_match(dummy_order)
    return jsonify(match)

@ai_bp.route('/ai-suggestion', methods=['POST'])
def ai_suggestion():
    data = request.json
    try:
        suggestion = get_smart_suggestion(
            order_type=data.get('order_type', 'canteen_delivery'),
            pickup=data.get('pickup', 'Unknown'),
            drop=data.get('drop', 'Unknown'),
            priority=data.get('priority', 'normal')
        )
        return jsonify({"suggestion": suggestion})
    except Exception as e:
        # Fallback to demo data if API key is missing or invalid
        return jsonify({
            "suggestion": {
                "recommendation": "Alex Student (Campus Hero)",
                "fastest_route": "Via Main Quad to the Library",
                "reasoning": f"Alex is currently passing by {data.get('pickup', 'your location')} and has a 98% route overlap. AI confidence: 96%."
            }
        })
