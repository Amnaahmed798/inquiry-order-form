from app import app

# This file is the entry point for Vercel serverless functions
# We're exporting the Flask app for Vercel to handle HTTP requests
# No additional code needed - Vercel looks for 'app' in this file

# For local development only
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000) 