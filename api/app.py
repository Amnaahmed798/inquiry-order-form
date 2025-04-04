import sys
import os

# Add parent directory to Python path so we can import the main app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the main Flask app
from app import app

# Add a health check endpoint for Vercel
@app.route('/api/vercel-health', methods=['GET'])
def vercel_health():
    """Health check endpoint specifically for Vercel"""
    from flask import jsonify
    response = jsonify({
        "status": "healthy",
        "message": "FOEM API is running on Vercel",
        "version": "1.0.0"
    })
    
    # Add CORS headers
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    
    return response

# For local testing
if __name__ == "__main__":
    app.run(debug=True) 