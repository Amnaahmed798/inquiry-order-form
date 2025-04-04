# FOEM - Scientific Editing Submission System

A Flask-based web application for managing scientific editing submissions with MongoDB integration.

## Deployment Instructions

### Prerequisites
- Python 3.11+
- MongoDB Atlas account (for database)
- Render.com account (for hosting)

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

### Deployment to Render.com

1. Create a MongoDB Atlas cluster:
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster (free tier works fine)
   - Create a database named "foem"
   - Create collections: "forms" and "files"
   - Create a database user with read/write permissions
   - Get your connection string (replace password and database name)

2. Deploy to Render.com:
   - Sign up at [Render.com](https://render.com)
   - Create a new Web Service
   - Connect your GitHub repository
   - Use the following settings:
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `gunicorn app:app`
   - Add the following environment variables:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `SECRET_KEY`: A random secret key for Flask
     - `MONGO_DB_NAME`: foem
     - `UPLOAD_FOLDER`: /var/data/uploads

3. Create a Persistent Disk in Render:
   - Go to Disks in your Render dashboard
   - Create a new disk (min 1GB)
   - Mount it to /var/data
   - Attach it to your web service

4. After deployment, your application will be available at the URL provided by Render.

## Features
- User submission form with file upload
- Admin dashboard to manage submissions
- File processing and management
- Status tracking for submissions 