import google.generativeai as genai
from config import Config
import json

def get_smart_suggestion(order_type, pickup, drop, priority):
    """
    Uses Gemini API to provide an intelligent summary of the delivery and route reasoning.
    """
    if not Config.GEMINI_API_KEY:
        raise Exception("GEMINI_API_KEY is not configured in environment.")
        
    genai.configure(api_key=Config.GEMINI_API_KEY)
    
    # We use gemini-1.5-flash for text generation
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    type_description = "A Canteen/Shop delivery relay" if order_type == 'canteen_delivery' else "A Peer-to-Peer emergency item lending"
    
    prompt = f"""
    You are an AI logistics assistant for a campus app called 'UniDrop'.
    A user has requested a delivery:
    - Type: {type_description}
    - Pickup: {pickup}
    - Drop-off: {drop}
    - Priority: {priority}
    
    Provide a JSON response with:
    - "recommendation": A mocked intelligent student courier name who frequently travels this route.
    - "fastest_route": A logical sounding campus route taking this delivery.
    - "reasoning": A brief startup-friendly explanation (max 2 sentences) of why this is the best match.
    
    Output strictly valid JSON.
    """
    
    response = model.generate_content(prompt)
    
    try:
        # Strip potential markdown formatting if returned
        clean_text = response.text.replace('```json', '').replace('```', '').strip()
        suggestion = json.loads(clean_text)
        return suggestion
    except Exception as e:
        # Fallback if AI hallucinates non-JSON
        return {
            "recommendation": "Alex Student (Campus Hero)",
            "fastest_route": "Direct route",
            "reasoning": response.text
        }
