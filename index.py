import sys
import os

# Add api directory to Python path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'api'))

# Import the Flask app from api/app.py
from app import app

# This file serves as an alternative entry point for Vercel
# Vercel will look for an app object to serve the application

if __name__ == "__main__":
    # For local development only
    app.run(debug=True, host='0.0.0.0', port=5000) 