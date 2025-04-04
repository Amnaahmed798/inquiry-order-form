# FOEM - Scientific Editing Submission System

A Flask-based web application for managing scientific editing submissions with MongoDB integration.

## Deployment Instructions

### Prerequisites
- Python 3.11+
- MongoDB Atlas account (for database)
- Vercel account (for hosting)

### Local Development Setup
1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Set up environment variables in `.env` file:
```
MONGODB_URI=your_mongodb_connection_string
SECRET_KEY=your_secret_key
MONGO_DB_NAME=foem
```
4. Run the application: `python app.py`

### Deployment to Vercel

1. **Create a MongoDB Atlas cluster**:
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster (free tier works fine)
   - Create a database named "foem"
   - Create collections: "forms" and "files"
   - Create a database user with read/write permissions
   - Get your connection string (replace password and database name)
   - Add `0.0.0.0/0` to your IP Access List to allow connections from anywhere

2. **Deploy to Vercel**:
   - Push your code to GitHub
   - Sign up for a Vercel account at [Vercel.com](https://vercel.com)
   - Connect your GitHub repository to Vercel
   - Set Framework Preset to "Other" (not Flask)
   - Configure your settings:
     - Build Command: Leave blank (or use `pip install -r requirements.txt`)
     - Output Directory: Leave blank
     - Install Command: `pip install -r requirements.txt`
   
3. **Set up environment variables in Vercel**:
   - Go to your project settings → Environment Variables
   - Add the following:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `SECRET_KEY`: A random secure string
     - `MONGO_DB_NAME`: foem
     - `FLASK_ENV`: production
     - `VERCEL`: true
     - `PYTHONPATH`: .

4. **Fixing 404 Errors on Vercel**:
   - If you encounter a 404 error after deployment, try these steps:
   
   a. Check that the `vercel.json` file has these settings:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "api/app.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "api/app.py",
         "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
         "headers": {
           "Access-Control-Allow-Origin": "*",
           "Access-Control-Allow-Headers": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
           "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT"
         }
       }
     ]
   }
   ```
   
   b. Confirm `api/app.py` is importing your main application:
   ```python
   import sys, os
   sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
   from app import app
   ```
   
   c. Test the health check endpoint: 
   
   Visit `https://your-app.vercel.app/api/vercel-health` to see if the API is running.
   
   d. Check for errors in the Vercel deployment logs:
   
   In your Vercel dashboard, go to your project → Deployments → Latest deployment → Functions
   
   e. Try a minimal test deployment:
   
   Delete everything in `api/app.py` except:
   ```python
   from flask import Flask, jsonify
   app = Flask(__name__)
   
   @app.route('/')
   def index():
       return jsonify({"status": "ok"})
   ```
   Then deploy and see if that works.
   
   f. If all else fails, redeploy with Vercel CLI:
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

5. **Important Notes for Vercel Deployment**:
   - Vercel uses a serverless environment which cannot persist files
   - File uploads must be stored in the database or external storage
   - Serverless functions have a maximum execution time limit of 10 seconds
   - Static files should be served from the `/static` directory

## Features
- User submission form with file upload
- Admin dashboard to manage submissions
- File processing and management
- Status tracking for submissions 