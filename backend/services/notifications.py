from extensions import socketio

def send_notification(event_type, message):
    """
    Broadcasts a real-time notification to all connected clients.
    event_type: string representing type (e.g. 'MATCH_FOUND')
    message: string describing the event
    """
    payload = {
        "type": event_type,
        "message": message
    }
    # Emitting to a generalized 'notification' event
    socketio.emit('notification', payload, broadcast=True)
