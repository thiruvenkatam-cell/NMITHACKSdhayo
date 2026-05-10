import google.generativeai as genai
import json

genai.configure(api_key="AIzaSyD0sEmNU3lxxf0bReh9OcyLQpqdLgYPuXk")

try:
    models = genai.list_models()
    print("Available models:")
    for m in models:
        print(m.name)
except Exception as e:
    print("ERROR:", str(e))
