from flask import Blueprint, jsonify

rewards_bp = Blueprint('rewards_bp', __name__)

@rewards_bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    leaderboard = [
        {"rank": 1, "name": "Sarah Jenkins", "xp": 2450, "badge": "Campus Hero"},
        {"rank": 2, "name": "Alex Student", "xp": 2100, "badge": "Speed Courier", "isMe": True},
        {"rank": 3, "name": "Mike Ross", "xp": 1850, "badge": "Night Owl"},
        {"rank": 4, "name": "Emma Watson", "xp": 1600, "badge": "Bronze Runner"},
    ]
    return jsonify({"leaderboard": leaderboard})
