from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_file, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
import os
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
import pymongo
from bson.objectid import ObjectId
from pymongo import MongoClient
from dotenv import load_dotenv
from functools import wraps
from flask_pymongo import PyMongo
import docx
import logging
import json

# Load environment variables
load_dotenv()

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_id'):
            app.logger.warning("No user_id in session, redirecting to login")
            flash('Please log in to access this page', 'warning')
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

app = Flask(__name__)
# Configure CORS properly with all necessary settings
CORS(app, resources={
    r"/*": {
        "origins": ["http://127.0.0.1:5500", "http://localhost:5500", "http://127.0.0.1:5000", "http://localhost:5000", 
                     "http://127.0.0.1:5001", "http://localhost:5001", "http://127.0.0.1:5002", "http://localhost:5002",
                     "http://127.0.0.1:8000", "http://localhost:8000"],  # Add all frontend and backend origins
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# Basic configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', os.urandom(24))
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///users.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MONGO_URI'] = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
app.config['MONGO_DB_NAME'] = os.environ.get('MONGO_DB_NAME', 'foem')

# Configure logging
logging.basicConfig(level=logging.INFO)
app.logger.setLevel(logging.INFO)

# Connect to MongoDB
try:
    app.logger.info(f"Attempting to connect to MongoDB at {app.config['MONGO_URI']}")
    
    # Use a more reliable connection approach with better error handling
    mongo_client = MongoClient(
        app.config['MONGO_URI'],
        serverSelectionTimeoutMS=10000,  # Increased timeout
        connectTimeoutMS=10000,
        socketTimeoutMS=10000,
        retryWrites=True,
        retryReads=True
    )
    
    # Test the connection
    mongo_client.server_info()
    app.logger.info(f"✅ MongoDB connection successful! Connected to database: {app.config['MONGO_DB_NAME']}")
    
    # Get database and collections
    db = mongo_client[app.config['MONGO_DB_NAME']]
    app.logger.info(f"Collections available: {db.list_collection_names()}")
    
    # Ensure collections exist
    if 'forms' not in db.list_collection_names():
        app.logger.info("Creating 'forms' collection")
        db.create_collection('forms')
    
    if 'files' not in db.list_collection_names():
        app.logger.info("Creating 'files' collection")
        db.create_collection('files')
    
    submissions_collection = db['forms']
    files_collection = db['files']
    
    # Verify collections are accessible
    submissions_collection.find_one({})
    files_collection.find_one({})
    
    app.logger.info("MongoDB collections initialized successfully")
    
except Exception as e:
    app.logger.error(f"❌ MongoDB connection error: {str(e)}")
    app.logger.error(f"Failed to connect to MongoDB at {app.config['MONGO_URI']}")
    app.logger.error("Please make sure MongoDB is running and the database exists")
    submissions_collection = None
    files_collection = None

# Configure upload folder
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads'))
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Configure maximum file size (16MB)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx', 'rtf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'admin_login'

# User Model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Submission Model
class Submission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    subject_area = db.Column(db.String(100), nullable=False)
    journal_name = db.Column(db.String(200), nullable=False)
    order_instructions = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    # New fields
    mobile = db.Column(db.String(20))
    service_type = db.Column(db.String(50))
    total_price = db.Column(db.Float)
    promo_applied = db.Column(db.Boolean, default=False)
    files = db.relationship('SubmissionFile', backref='submission', lazy=True)

class SubmissionFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('submission.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_id = db.Column(db.String(50))
    word_count = db.Column(db.Integer)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def create_admin():
    try:
        # Drop all tables and recreate them
        db.drop_all()
        db.create_all()
        print("Database tables recreated successfully")

        # Check if admin exists
        admin = User.query.filter_by(username='admin@example.com').first()
        if not admin:
            print("Creating new admin user...")
            admin = User(username='admin@example.com', is_admin=True)
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("Admin user created successfully")
        else:
            print("Admin user already exists")
            # Update admin password if needed
            admin.set_password('admin123')
            db.session.commit()
            print("Admin password updated")
    except Exception as e:
        print(f"Error in create_admin: {str(e)}")
        db.session.rollback()
        raise

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
@login_required
def admin_index():
    if not current_user.is_admin:
        flash('Access denied. Admin privileges required.', 'danger')
        return redirect(url_for('admin_login'))
    
    # Fetch submissions from MongoDB instead of SQLite
    mongo_submissions = list(submissions_collection.find().sort("timestamp", -1))
    
    # Convert MongoDB ObjectId to string for each submission
    for submission in mongo_submissions:
        submission['id'] = str(submission['_id'])
    
    return render_template('admin/index.html', submissions=mongo_submissions)

@app.route('/login', methods=['GET', 'POST'])
def login():
    return redirect(url_for('admin_login'))

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Backend is running'})

@app.route('/api/upload-file', methods=['POST', 'OPTIONS'])
def upload_file():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        app.logger.info("Received upload request")
        app.logger.info(f"Files in request: {request.files}")
        app.logger.info(f"Form data: {request.form}")
        
        if 'file' not in request.files:
            app.logger.warning("No file part in the request")
            return jsonify({
                'success': False,
                'message': 'No file part in the request'
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            app.logger.warning("No filename provided")
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400
            
        app.logger.info(f"Processing file: {file.filename}")
        
        if not allowed_file(file.filename):
            app.logger.warning(f"File type not allowed: {file.filename}")
            return jsonify({
                'success': False,
                'message': f'File type not allowed. Allowed types are: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
        
        if file:
            try:
                # Generate a unique filename
                unique_suffix = datetime.now().timestamp()
                filename = secure_filename(file.filename)
                unique_filename = f"{int(unique_suffix)}-{filename}"
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                
                # Ensure upload directory exists
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                
                app.logger.info(f"Saving file to: {file_path}")
                file.save(file_path)
                app.logger.info(f"File saved successfully")
                
                # Get file extension and calculate word count
                file_extension = os.path.splitext(filename)[1].lower()
                word_count = 0
                
                # Calculate word count for Word documents
                if file_extension == '.docx':
                    try:
                        doc = docx.Document(file_path)
                        word_count = sum(len(p.text.split()) for p in doc.paragraphs)
                        app.logger.info(f"Word count for {filename}: {word_count}")
                    except Exception as e:
                        app.logger.error(f"Error counting words in docx: {str(e)}")
                
                # Create file document in MongoDB
                file_data = {
                    "originalName": filename,
                    "fileName": unique_filename,
                    "filePath": file_path,
                    "fileSize": os.path.getsize(file_path),
                    "fileType": file_extension,
                    "wordCount": word_count,
                    "uploadDate": datetime.utcnow(),
                    "status": "active"
                }
                
                # Insert file info into MongoDB files collection
                app.logger.info(f"Inserting file info into MongoDB: {file_data}")
                result = files_collection.insert_one(file_data)
                file_id = str(result.inserted_id)
                app.logger.info(f"MongoDB document created with ID: {file_id}")
                
                # Check if a submission_id was provided in the form
                submission_id = request.form.get('submission_id')
                if submission_id and ObjectId.is_valid(submission_id):
                    # Add the submission ID to the file data
                    file_data["submissionId"] = submission_id
                    app.logger.info(f"Associating file with submission ID: {submission_id}")
                    
                    try:
                        # Update the submission's files array with the new file_id
                        update_result = submissions_collection.update_one(
                            {"_id": ObjectId(submission_id)},
                            {"$addToSet": {"files": file_id}}  # Use addToSet to prevent duplicates
                        )
                        
                        if update_result.modified_count > 0:
                            app.logger.info(f"Successfully added file {file_id} to submission {submission_id}")
                        else:
                            app.logger.warning(f"No changes made when adding file {file_id} to submission {submission_id}")
                            
                    except Exception as e:
                        app.logger.error(f"Error updating submission with file: {str(e)}")
                
                # Return both file_id and fileId to ensure compatibility
                response_data = {
                    'success': True,
                    'message': 'File uploaded successfully',
                    'file_id': file_id,
                    'fileId': file_id,
                    'filename': filename,
                    'originalName': filename,
                    'size': os.path.getsize(file_path),
                    'type': file_extension,
                    'wordCount': word_count
                }
                
                app.logger.info(f"Returning response: {response_data}")
                return jsonify(response_data), 200
                
            except Exception as e:
                app.logger.error(f"Error saving file: {str(e)}")
                app.logger.exception("Full traceback:")
                return jsonify({
                    'success': False,
                    'message': f'Error saving file: {str(e)}'
                }), 500
                
    except Exception as e:
        app.logger.error(f"Server error in upload_file: {str(e)}")
        app.logger.exception("Full traceback:")
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

def process_files(files_data):
    processed_files = []
    
    for file_info in files_data:
        try:
            # Extract file information
            if isinstance(file_info, str):
                app.logger.info(f"Processing string file ID: {file_info}")
                file_id = file_info
                # Create new file document for frontend-generated IDs
                file_doc = {
                    "originalName": "Unknown File",
                    "fileName": "unknown.txt",
                    "fileId": file_id,
                    "uploadDate": datetime.utcnow(),
                    "status": "submitted"
                }
                result = files_collection.insert_one(file_doc)
                file_mongo_id = str(result.inserted_id)
                processed_files.append(file_mongo_id)
                app.logger.info(f"Created new file document with MongoDB ID: {file_mongo_id}")
            elif isinstance(file_info, dict):
                app.logger.info(f"Processing file info object: {json.dumps(file_info, indent=2)}")
                # Get file details from the object
                file_name = file_info.get('name') or file_info.get('originalName', 'unknown.txt')
                file_size = file_info.get('size') or file_info.get('fileSize', 0)
                word_count = file_info.get('wordCount', 0)
                file_type = file_info.get('type') or file_info.get('fileType', '')
                
                # Create or update file document
                file_doc = {
                    "originalName": file_name,
                    "fileName": file_name,
                    "fileSize": file_size,
                    "fileType": file_type,
                    "wordCount": word_count,
                    "uploadDate": datetime.utcnow(),
                    "status": "submitted",
                    "frontend_file_id": file_info.get('fileId') or file_info.get('file_id', '')
                }
                result = files_collection.insert_one(file_doc)
                file_mongo_id = str(result.inserted_id)
                processed_files.append(file_mongo_id)
                app.logger.info(f"Created file document with MongoDB ID: {file_mongo_id}")
            else:
                app.logger.warning(f"Unrecognized file info format: {file_info}")
        except Exception as e:
            app.logger.error(f"Error processing file info: {str(e)}")
            app.logger.exception("Full traceback:")
    
    return processed_files

@app.route('/api/submit-form', methods=['POST'])
def submit_form():
    try:
        data = request.get_json()
        if not data:
            app.logger.error("No data provided in form submission")
            return jsonify({'success': False, 'message': 'No data provided'}), 400

        app.logger.info("=== Starting Form Submission ===")
        app.logger.info(f"Raw form data: {json.dumps(data, indent=2)}")

        # Create the submission document for MongoDB
        submission_data = {
            'email': data.get('email', ''),
            'subjectArea': data.get('subjectArea', ''),
            'journalName': data.get('journalName', ''),
            'orderInstructions': data.get('orderInstructions', ''),
            'personalInfo': data.get('personalInfo', {
                'fullName': '',
                'secondaryEmail': '',
                'mobile': ''
            }),
            'selectedService': data.get('selectedService', {}),
            'selectedAddons': data.get('selectedAddons', []) or data.get('addOns', []),
            'totalPrice': float(data.get('totalPrice', 0.0)),
            'promoApplied': data.get('promoApplied', False),
            'submissionDate': datetime.utcnow(),
            'files': [],
            'status': 'pending'
        }
        
        # Process file IDs
        files_data = data.get('files', [])
        app.logger.info(f"Files data received: {json.dumps(files_data, indent=2)}")
        
        if files_data and isinstance(files_data, list):
            app.logger.info(f"Processing {len(files_data)} files for submission")
            processed_files = process_files(files_data)
            submission_data['files'] = processed_files
        
        app.logger.info(f"Final submission data: {json.dumps(submission_data, default=str, indent=2)}")
        
        # Insert submission into MongoDB
        result = submissions_collection.insert_one(submission_data)
        submission_id = str(result.inserted_id)
        app.logger.info(f"Submission created with ID: {submission_id}")

        # Update files with submission ID
        if submission_data['files']:
            app.logger.info(f"Updating {len(submission_data['files'])} files with submission ID")
            for file_id in submission_data['files']:
                try:
                    update_result = files_collection.update_one(
                        {"_id": ObjectId(file_id)},
                        {
                            "$set": {
                                "submissionId": submission_id,
                                "status": "submitted"
                            }
                        }
                    )
                    app.logger.info(f"File {file_id} update result: {update_result.modified_count} document(s) modified")
                except Exception as e:
                    app.logger.error(f"Error updating file {file_id}: {str(e)}")
                    app.logger.exception("Full traceback:")

        # Verify the submission was created with files
        created_submission = submissions_collection.find_one({"_id": ObjectId(submission_id)})
        app.logger.info(f"Created submission verification: {str(created_submission)}")

        return jsonify({
            'success': True,
            'message': 'Form submitted successfully',
            'formId': submission_id,
            'fileCount': len(submission_data['files'])
        })

    except Exception as e:
        app.logger.error(f"Error submitting form: {str(e)}")
        app.logger.exception("Full traceback:")
        return jsonify({
            'success': False,
            'message': f'Error submitting form: {str(e)}'
        }), 500

@app.route('/submission/<submission_id>')
@login_required
def submission_detail(submission_id):
    # Find the submission by ID in MongoDB
    submission = submissions_collection.find_one({"_id": ObjectId(submission_id)})
    
    if not submission:
        flash('Submission not found', 'danger')
        return redirect(url_for('index'))
    
    # Convert ObjectId to string for template
    submission['id'] = str(submission['_id'])
    
    # Fetch file details if there are any files
    file_details = {}
    if 'files' in submission and submission['files']:
        for file_id in submission['files']:
            # Convert string file_id to ObjectId if needed
            try:
                file_obj_id = ObjectId(file_id) if isinstance(file_id, str) else file_id
                file_doc = files_collection.find_one({"_id": file_obj_id})
                if file_doc:
                    file_details[file_id] = file_doc
            except Exception as e:
                print(f"Error fetching file {file_id}: {str(e)}")
    
    return render_template('submission_detail.html', submission=submission, file_details=file_details)

@app.route('/submission/<submission_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_submission(submission_id):
    try:
        # Find the submission by ID in MongoDB
        submission = submissions_collection.find_one({"_id": ObjectId(submission_id)})
        
        if not submission:
            print(f"Submission not found: {submission_id}")
            flash('Submission not found', 'danger')
            return redirect(url_for('index'))
        
        if request.method == 'POST':
            # Create update data with the correct field names for MongoDB
            update_data = {
                'email': request.form.get('email'),
                'subjectArea': request.form.get('subject_area'),
                'journalName': request.form.get('journal_name'),
                'orderInstructions': request.form.get('order_instructions'),
                'selectedService': request.form.get('service_type')
            }
            
            # Update the personalInfo nested object
            personalInfo = {
                'fullName': request.form.get('full_name'),
                'mobile': request.form.get('mobile'),
                'secondaryEmail': submission.get('personalInfo', {}).get('secondaryEmail', '')
            }
            update_data['personalInfo'] = personalInfo
            
            # Handle total price - ensure it's a float or set to 0
            try:
                total_price = float(request.form.get('total_price', 0))
                update_data['totalPrice'] = total_price
            except (ValueError, TypeError):
                update_data['totalPrice'] = 0.0
            
            # Add a status field if it doesn't exist
            update_data['status'] = request.form.get('status', 'pending')
            
            # Update the document in MongoDB
            submissions_collection.update_one(
                {"_id": ObjectId(submission_id)},
                {"$set": update_data}
            )
            
            flash('Submission updated successfully!', 'success')
            return redirect(url_for('admin_submission_detail', submission_id=submission_id))
        
        # Convert ObjectId to string for template
        submission['id'] = str(submission['_id'])
        
        return render_template('edit_submission.html', submission=submission)
        
    except Exception as e:
        print(f"Error in edit_submission: {str(e)}")
        flash('Error editing submission', 'danger')
        return redirect(url_for('index'))

# Admin routes
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    try:
        # If user is already logged in, redirect to dashboard
        if session.get('user_id'):
            return redirect(url_for('admin_dashboard'))

        if request.method == 'POST':
            email = request.form.get('email')
            password = request.form.get('password')
            
            app.logger.info(f"Login attempt for email: {email}")
            
            # Check admin credentials
            if email == 'admin@example.com' and password == 'admin123':
                session['user_id'] = 'admin'
                session.permanent = True  # Make session permanent
                app.logger.info(f"Admin login successful for {email}")
                flash('Welcome back, Admin!', 'success')
                return redirect(url_for('admin_dashboard'))
            else:
                app.logger.warning(f"Failed login attempt for {email}")
                flash('Invalid credentials', 'danger')
        
        return render_template('admin/login.html')
        
    except Exception as e:
        app.logger.error(f"Error in admin_login: {str(e)}")
        app.logger.exception("Full traceback:")
        flash('An error occurred. Please try again.', 'danger')
        return render_template('admin/login.html')

@app.route('/admin/logout')
def admin_logout():
    session.pop('user_id', None)
    flash('You have been logged out', 'info')
    return redirect(url_for('admin_login'))

@app.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    try:
        app.logger.info("Loading admin dashboard")
        app.logger.info(f"Current session: {session}")
        
        # Get recent submissions (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_submissions = list(submissions_collection.find({
            "submissionDate": {"$gte": thirty_days_ago}
        }).sort("submissionDate", -1))

        # Calculate statistics
        total_submissions = len(recent_submissions)
        total_revenue = sum(float(sub.get('totalPrice', 0)) for sub in recent_submissions)
        pending_count = sum(1 for sub in recent_submissions if sub.get('status') == 'pending')
        completed_count = sum(1 for sub in recent_submissions if sub.get('status') == 'completed')
        in_progress_count = sum(1 for sub in recent_submissions if sub.get('status') == 'in_progress')

        # Format submission data for display
        formatted_submissions = []
        for sub in recent_submissions:
            try:
                # Format service options
                service_options = {}
                if isinstance(sub.get('selectedService'), dict):
                    service_options = {
                        'urgentProcessing': sub['selectedService'].get('urgentProcessing', False),
                        'formatting': sub['selectedService'].get('formatting', False),
                        'plagiarismCheck': sub['selectedService'].get('plagiarismCheck', False),
                        'grammarCheck': sub['selectedService'].get('grammarCheck', False),
                        'nativeSpeaker': sub['selectedService'].get('nativeSpeaker', False)
                    }
                
                formatted_sub = {
                    'id': str(sub['_id']),
                    'email': sub.get('email', 'No Email'),
                    'personalInfo': sub.get('personalInfo', {}),
                    'subject_area': sub.get('subjectArea', ''),
                    'serviceOptions': service_options,
                    'selectedAddons': sub.get('selectedAddons', []),
                    'files': sub.get('files', []),
                    'status': sub.get('status', 'pending'),
                    'submission_date': sub.get('submissionDate', datetime.utcnow())
                }
                formatted_submissions.append(formatted_sub)
            except Exception as e:
                app.logger.error(f"Error formatting submission {str(sub.get('_id'))}: {str(e)}")
                continue

        app.logger.info(f"Loaded {len(formatted_submissions)} recent submissions for admin dashboard")
        
        return render_template(
            'admin/dashboard.html',
            recent_submissions=formatted_submissions,
            stats={
                'total_submissions': total_submissions,
                'total_revenue': "${:.2f}".format(total_revenue),
                'pending_submissions': pending_count,
                'in_progress_submissions': in_progress_count,
                'completed_submissions': completed_count
            }
        )

    except Exception as e:
        app.logger.error(f"Error in admin dashboard: {str(e)}")
        app.logger.exception("Full traceback:")
        return render_template(
            'admin/dashboard.html',
            recent_submissions=[],
            stats={
                'total_submissions': 0,
                'total_revenue': "$0.00",
                'pending_submissions': 0,
                'in_progress_submissions': 0,
                'completed_submissions': 0
            },
            error="Error loading dashboard data"
        )

@app.route('/admin/submissions')
@admin_required
def admin_submissions():
    try:
        app.logger.info("Accessing admin_submissions route")
        
        if submissions_collection is None:
            app.logger.error("MongoDB connection not available")
            flash('Database connection error. Please contact administrator.', 'error')
            return render_template('admin/submissions.html', submissions=[], page=1, total_pages=1, has_prev=False, has_next=False, error="Database connection error")
            
        page = request.args.get('page', 1, type=int)
        per_page = 20
        
        app.logger.info(f"Fetching submissions for page {page}")
        
        # Get total count for pagination
        try:
            # Verify MongoDB connection is still active
            mongo_client.server_info()
            
            total_submissions = submissions_collection.count_documents({})
            app.logger.info(f"Total submissions found: {total_submissions}")
        except Exception as e:
            app.logger.error(f"Error counting documents: {str(e)}")
            flash('Database connection error. Please contact administrator.', 'error')
            return render_template('admin/submissions.html', submissions=[], page=1, total_pages=1, has_prev=False, has_next=False, error="Database connection error")
            
        total_pages = (total_submissions + per_page - 1) // per_page
        
        # Get submissions for current page
        skip = (page - 1) * per_page
        try:
            # Use a more reliable approach to fetch submissions
            submissions_cursor = submissions_collection.find({}).sort('submissionDate', -1).skip(skip).limit(per_page)
            app.logger.info(f"Retrieved submissions cursor for page {page}")
        except Exception as e:
            app.logger.error(f"Error retrieving submissions: {str(e)}")
            flash('Error retrieving submissions from database.', 'error')
            return render_template('admin/submissions.html', submissions=[], page=1, total_pages=1, has_prev=False, has_next=False, error="Error retrieving submissions")
        
        # Format submission data
        submissions = []
        for submission in submissions_cursor:
            try:
                # Convert total_price to float, defaulting to 0.0 if not present or invalid
                try:
                    total_price = float(submission.get('totalPrice', 0.0))
                except (ValueError, TypeError):
                    app.logger.warning(f"Invalid total_price format for submission {submission.get('_id')}: {submission.get('totalPrice')}")
                    total_price = 0.0
                
                # Handle the actual data structure from MongoDB
                selected_service = submission.get('selectedService', {})
                if isinstance(selected_service, dict):
                    service_name = selected_service.get('name', '')
                else:
                    service_name = str(selected_service)
                    
                submission_data = {
                    'id': str(submission['_id']),
                    'email': submission.get('email', ''),
                    'subject_area': submission.get('subjectArea', ''),
                    'selected_service': service_name,
                    'total_price': total_price,
                    'status': submission.get('status', 'pending'),
                    'submission_date': submission.get('submissionDate', datetime.now())
                }
                submissions.append(submission_data)
            except Exception as e:
                app.logger.error(f"Error processing submission: {str(e)}")
                continue
        
        app.logger.info(f"Successfully processed {len(submissions)} submissions")
        
        return render_template('admin/submissions.html',
                             submissions=submissions,
                             page=page,
                             total_pages=total_pages,
                             has_prev=(page > 1),
                             has_next=(page < total_pages))
                             
    except Exception as e:
        app.logger.error(f"Error in admin_submissions: {str(e)}")
        flash('Error retrieving submissions.', 'error')
        return render_template('admin/submissions.html', submissions=[], page=1, total_pages=1, has_prev=False, has_next=False, error="Error retrieving submissions")

@app.route('/admin/submission/<submission_id>')
@admin_required
def admin_submission_detail(submission_id):
    try:
        app.logger.info("=== Accessing Submission Detail ===")
        app.logger.info(f"Submission ID: {submission_id}")
        
        if not ObjectId.is_valid(submission_id):
            app.logger.error(f"Invalid submission ID format: {submission_id}")
            flash("Invalid submission ID", "danger")
            return redirect(url_for('admin_submissions'))

        # Get submission details
        submission = submissions_collection.find_one({"_id": ObjectId(submission_id)})
        if not submission:
            app.logger.error(f"Submission not found with ID: {submission_id}")
            flash("Submission not found", "danger")
            return redirect(url_for('admin_submissions'))

        app.logger.info("=== Submission Data ===")
        app.logger.info(f"Files in submission: {submission.get('files', [])}")
        app.logger.info(f"Add-ons in submission: {submission.get('selectedAddons', [])}")
        
        # Format service options
        service_options = {}
        if isinstance(submission.get('selectedService'), dict):
            service_options = {
                'urgentProcessing': submission['selectedService'].get('urgentProcessing', False),
                'formatting': submission['selectedService'].get('formatting', False),
                'plagiarismCheck': submission['selectedService'].get('plagiarismCheck', False),
                'grammarCheck': submission['selectedService'].get('grammarCheck', False),
                'nativeSpeaker': submission['selectedService'].get('nativeSpeaker', False)
            }
        submission['serviceOptions'] = service_options

        # Get associated files
        files = []
        app.logger.info("=== Processing Files ===")
        
        # Method 1: Get files from submission's files array
        if 'files' in submission and submission['files']:
            app.logger.info(f"Found files array in submission: {submission['files']}")
        
            for file_id in submission['files']:
                try:
                    if isinstance(file_id, str) and ObjectId.is_valid(file_id):
                        file_doc = files_collection.find_one({"_id": ObjectId(file_id)})
                        
                        if not file_doc:
                            file_doc = files_collection.find_one({"frontend_file_id": file_id})
                
                        if file_doc:
                            # Format file size
                            file_size = file_doc.get('fileSize', 0)
                            size_str = (f"{(file_size / (1024 * 1024)):.2f} MB" 
                                     if file_size >= 1024 * 1024 
                                     else f"{(file_size / 1024):.2f} KB")
                            
                            files.append({
                                'id': str(file_doc.get('_id', '')),
                                'filename': file_doc.get('originalName', file_doc.get('fileName', 'Unknown File')),
                                'upload_date': file_doc.get('uploadDate', datetime.utcnow()),
                                'file_size': file_size,
                                'size_formatted': size_str,
                                'word_count': file_doc.get('wordCount', 0),
                                'file_type': file_doc.get('fileType', ''),
                                'file_path': file_doc.get('filePath', '')
                            })
                except Exception as e:
                    app.logger.error(f"Error processing file {file_id}: {str(e)}")
        
        # Method 2: Look up files by submission ID if no files found
        if not files:
            app.logger.info(f"Looking up files by submission ID: {submission_id}")
            file_docs = files_collection.find({"submissionId": submission_id})
            
            for file_doc in file_docs:
                try:
                    file_size = file_doc.get('fileSize', 0)
                    size_str = (f"{(file_size / (1024 * 1024)):.2f} MB" 
                             if file_size >= 1024 * 1024 
                             else f"{(file_size / 1024):.2f} KB")
                    
                    files.append({
                        'id': str(file_doc.get('_id', '')),
                        'filename': file_doc.get('originalName', file_doc.get('fileName', 'Unknown File')),
                        'upload_date': file_doc.get('uploadDate', datetime.utcnow()),
                        'file_size': file_size,
                        'size_formatted': size_str,
                        'word_count': file_doc.get('wordCount', 0),
                        'file_type': file_doc.get('fileType', ''),
                        'file_path': file_doc.get('filePath', '')
                    })
                except Exception as e:
                    app.logger.error(f"Error processing file document: {str(e)}")
        
        # Method 3: Try to find any files that contain this submission ID in their data
        if not files:
            app.logger.info(f"Searching all files for references to submission ID: {submission_id}")
            # Look for files that might be related but don't have the exact submissionId field
            all_files = files_collection.find({})
            for file_doc in all_files:
                try:
                    # Check if the file might be related to this submission
                    file_json = json.dumps(str(file_doc))
                    if submission_id in file_json:
                        file_size = file_doc.get('fileSize', 0)
                        size_str = (f"{(file_size / (1024 * 1024)):.2f} MB" 
                                 if file_size >= 1024 * 1024 
                                 else f"{(file_size / 1024):.2f} KB")
                        
                        files.append({
                            'id': str(file_doc.get('_id', '')),
                            'filename': file_doc.get('originalName', file_doc.get('fileName', 'Unknown File')),
                            'upload_date': file_doc.get('uploadDate', datetime.utcnow()),
                            'file_size': file_size,
                            'size_formatted': size_str,
                            'word_count': file_doc.get('wordCount', 0),
                            'file_type': file_doc.get('fileType', ''),
                            'file_path': file_doc.get('filePath', '')
                        })
                        app.logger.info(f"Found related file: {files[-1]}")
                except Exception as e:
                    app.logger.error(f"Error checking file relation: {str(e)}")
        
        app.logger.info(f"Total files found: {len(files)}")
        
        # Add the ID as a string to the submission dict
        submission['id'] = str(submission['_id'])
        
        # Ensure all required fields exist
        submission.setdefault('personalInfo', {})
        submission.setdefault('selectedAddons', [])
        submission.setdefault('totalPrice', 0.0)
        submission.setdefault('promoApplied', False)
        submission.setdefault('status', 'pending')
        
        # Log final data being sent to template
        app.logger.info("=== Final Template Data ===")
        app.logger.info(f"Files being sent to template: {files}")
        app.logger.info(f"Add-ons being sent to template: {submission.get('selectedAddons', [])}")
        
        return render_template('admin/submission_detail.html', 
                            submission=submission,
                            files=files)

    except Exception as e:
        app.logger.error(f"Error in admin_submission_detail: {str(e)}")
        app.logger.exception("Full traceback:")
        flash(f"Error retrieving submission details: {str(e)}", "danger")
        return redirect(url_for('admin_submissions'))

@app.route('/admin/submission/<submission_id>/update-status', methods=['POST'])
@login_required
@admin_required
def update_submission_status(submission_id):
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        # Define valid status values
        valid_statuses = ['pending', 'in_progress', 'completed', 'cancelled']
        
        if not new_status or new_status not in valid_statuses:
            return jsonify({
                'success': False, 
                'message': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            }), 400
        
        # Update the submission status in MongoDB
        result = submissions_collection.update_one(
            {"_id": ObjectId(submission_id)},
            {"$set": {"status": new_status}}
        )
        
        if result.modified_count > 0:
            return jsonify({
                'success': True, 
                'message': f'Status updated to {new_status} successfully'
            })
        else:
            # Check if submission exists
            submission = submissions_collection.find_one({"_id": ObjectId(submission_id)})
            if not submission:
                return jsonify({
                    'success': False, 
                    'message': 'Submission not found'
                }), 404
            else:
                return jsonify({
                    'success': False, 
                    'message': 'Status was already set to the requested value'
                }), 200
            
    except Exception as e:
        app.logger.error(f"Error updating status: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Error updating status: {str(e)}'
        }), 500

@app.route('/admin/file/<file_id>/download')
@login_required
@admin_required
def admin_file_download(file_id):
    try:
        # Find the file in MongoDB
        file_doc = files_collection.find_one({"_id": ObjectId(file_id)})
        if not file_doc:
            flash('File not found', 'error')
            return redirect(url_for('admin_submissions'))
        
        # Get the file path
        file_path = file_doc.get('filePath')
        if not file_path or not os.path.exists(file_path):
            flash('File not found on server', 'error')
            return redirect(url_for('admin_submissions'))
        
        # Send the file
        return send_file(
            file_path,
            as_attachment=True,
            download_name=file_doc.get('originalName', 'document')
        )
    except Exception as e:
        app.logger.error(f"Error downloading file: {str(e)}")
        flash('Error downloading file', 'error')
        return redirect(url_for('admin_submissions'))

@app.route('/admin/file/<file_id>/view')
@admin_required
def admin_file_view(file_id):
    try:
        app.logger.info(f"Attempting to view file with ID: {file_id}")
        
        # Find the file in MongoDB
        if not ObjectId.is_valid(file_id):
            app.logger.error(f"Invalid file ID format: {file_id}")
            flash('Invalid file ID', 'error')
            return redirect(url_for('admin_submissions'))
            
        file_doc = files_collection.find_one({"_id": ObjectId(file_id)})
        if not file_doc:
            app.logger.error(f"File not found with ID: {file_id}")
            flash('File not found', 'error')
            return redirect(url_for('admin_submissions'))
        
        # Get the file path
        file_path = file_doc.get('filePath')
        if not file_path or not os.path.exists(file_path):
            app.logger.error(f"File not found on server: {file_path}")
            flash('File not found on server', 'error')
            return redirect(url_for('admin_submissions'))
        
        # Get file extension
        file_ext = os.path.splitext(file_path)[1].lower()
        
        # Handle different file types
        if file_ext == '.pdf':
            return send_file(
                file_path,
                mimetype='application/pdf',
                as_attachment=False,
                download_name=file_doc.get('originalName', 'document.pdf')
            )
        elif file_ext in ['.txt', '.rtf']:
            return send_file(
                file_path,
                mimetype='text/plain',
                as_attachment=False,
                download_name=file_doc.get('originalName', 'document.txt')
            )
        elif file_ext in ['.doc', '.docx']:
            # For Word documents, we might want to convert to PDF first
            # For now, we'll just send it as a download
            return send_file(
                file_path,
                mimetype='application/msword',
                as_attachment=False,
                download_name=file_doc.get('originalName', 'document.doc')
            )
        else:
            flash('File type not supported for viewing', 'error')
            return redirect(url_for('admin_submissions'))
            
    except Exception as e:
        app.logger.error(f"Error viewing file: {str(e)}")
        app.logger.exception("Full traceback:")
        flash('Error viewing file', 'error')
        return redirect(url_for('admin_submissions'))

@app.route('/admin/submission/<id>/edit', methods=['GET', 'POST'])
@admin_required
def admin_edit_submission(id):
    try:
        app.logger.info(f"Accessing admin_edit_submission for ID: {id}")
        app.logger.info(f"Request method: {request.method}")
        
        # Find the submission by ID in MongoDB
        submission = submissions_collection.find_one({"_id": ObjectId(id)})
        
        if not submission:
            app.logger.error(f"Submission not found: {id}")
            flash('Submission not found', 'danger')
            return redirect(url_for('admin_submissions'))
        
        if request.method == 'POST':
            app.logger.info(f"Processing POST request for submission {id}")
            app.logger.info(f"Form data keys: {list(request.form.keys())}")
            
            # First, grab and log the status value - make this a priority
            status = request.form.get('status', '')
            status_backup = request.form.get('status_backup', '')
            
            # If status is empty or invalid, use the backup status
            if not status or status not in ['pending', 'in_progress', 'completed', 'cancelled']:
                app.logger.warning(f"Primary status field invalid or empty: '{status}', trying backup")
                status = status_backup
                
            # If both are invalid, default to pending    
            if not status or status not in ['pending', 'in_progress', 'completed', 'cancelled']:
                app.logger.warning(f"Both status fields invalid, defaulting to 'pending'")
                status = 'pending'
            
            app.logger.info(f"STATUS TO BE APPLIED: '{status}' (was: '{submission.get('status', 'unknown')}')")
            
            # First, update ONLY the status field - this is the most critical update
            try:
                status_update_result = submissions_collection.update_one(
                    {"_id": ObjectId(id)},
                    {"$set": {"status": status}}
                )
                
                app.logger.info(f"DIRECT STATUS UPDATE: matched={status_update_result.matched_count}, modified={status_update_result.modified_count}")
                
                if status_update_result.modified_count > 0:
                    app.logger.info(f"✅ STATUS SUCCESSFULLY UPDATED TO '{status}'")
                else:
                    app.logger.warning(f"⚠️ STATUS UPDATE SHOWED NO CHANGES (might be the same value)")
                
            except Exception as e:
                app.logger.error(f"❌ ERROR UPDATING STATUS: {str(e)}")
                
            # Log all other essential form fields
            app.logger.info(f"Email field: {request.form.get('email')}")
            app.logger.info(f"Subject area field: {request.form.get('subject_area')}")
            
            # Create update_data with status as the first field
            update_data = {
                'status': status,  # Place status first in the dictionary to emphasize importance
                'email': request.form.get('email', ''),
                'subjectArea': request.form.get('subject_area', ''),
                'journalName': request.form.get('journal_name', ''),
                'orderInstructions': request.form.get('order_instructions', '')
            }
            
            # Build service options from form
            service_options = {
                'urgentProcessing': request.form.get('urgentProcessing') == 'on',
                'formatting': request.form.get('formatting') == 'on',
                'plagiarismCheck': request.form.get('plagiarismCheck') == 'on',
                'grammarCheck': request.form.get('grammarCheck') == 'on',
                'nativeSpeaker': request.form.get('nativeSpeaker') == 'on',
                'name': request.form.get('selected_service', '')
            }
            update_data['selectedService'] = service_options
            
            # Update the personalInfo nested object
            personalInfo = {
                'fullName': request.form.get('full_name'),
                'mobile': request.form.get('mobile'),
                'secondaryEmail': submission.get('personalInfo', {}).get('secondaryEmail', '')
            }
            update_data['personalInfo'] = personalInfo
            
            # Handle total price - ensure it's a float or set to 0
            try:
                total_price = float(request.form.get('total_price', 0))
                update_data['totalPrice'] = total_price
            except (ValueError, TypeError):
                update_data['totalPrice'] = 0.0
            
            # Process file IDs from the form - AFTER handling status
            try:
                file_ids = request.form.getlist('file_ids[]')
                app.logger.info(f"Received file_ids: {file_ids}")
                
                if file_ids:
                    update_data['files'] = file_ids
                    app.logger.info(f"Setting files to: {file_ids}")
                    
                    # Update the files with the submission ID
                    for file_id in file_ids:
                        if ObjectId.is_valid(file_id):
                            files_collection.update_one(
                                {"_id": ObjectId(file_id)},
                                {"$set": {"submissionId": id}}
                            )
            except Exception as e:
                app.logger.error(f"Error processing file IDs: {str(e)}")
                # Continue with the update even if file IDs processing fails
            
            # Update the document in MongoDB
            app.logger.info(f"Updating submission with data: {json.dumps(update_data, default=str)}")
            
            # First, let's update just the status field to prioritize it
            status_update_result = submissions_collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": {"status": status}}
            )
            
            app.logger.info(f"Status update result: matched={status_update_result.matched_count}, modified={status_update_result.modified_count}")
            
            # Now update the rest of the fields
            result = submissions_collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": update_data}
            )
            
            app.logger.info(f"Full update result: matched={result.matched_count}, modified={result.modified_count}")
            
            # Verify the updated document
            updated_submission = submissions_collection.find_one({"_id": ObjectId(id)})
            app.logger.info(f"Updated submission status: {updated_submission.get('status', 'unknown')}")
            app.logger.info(f"Updated document: {json.dumps({k: v for k, v in updated_submission.items() if k != '_id'}, default=str)}")
            
            flash('Submission updated successfully!', 'success')
            return redirect(url_for('admin_submission_detail', submission_id=id))
        
        # Convert ObjectId to string for template
        submission['id'] = str(submission['_id'])
        
        # Format service options
        service_options = {}
        if isinstance(submission.get('selectedService'), dict):
            service_options = {
                'urgentProcessing': submission['selectedService'].get('urgentProcessing', False),
                'formatting': submission['selectedService'].get('formatting', False),
                'plagiarismCheck': submission['selectedService'].get('plagiarismCheck', False),
                'grammarCheck': submission['selectedService'].get('grammarCheck', False),
                'nativeSpeaker': submission['selectedService'].get('nativeSpeaker', False)
            }
        submission['serviceOptions'] = service_options
        
        # Get associated files
        files = []
        
        # Get files from submission's files array
        if 'files' in submission and submission['files']:
            app.logger.info(f"Found files array in submission: {submission['files']}")
            
            for file_id in submission['files']:
                if isinstance(file_id, str) and ObjectId.is_valid(file_id):
                    try:
                        file_doc = files_collection.find_one({"_id": ObjectId(file_id)})
                        
                        if file_doc:
                            # Format file size
                            file_size = file_doc.get('fileSize', 0)
                            size_str = (f"{(file_size / (1024 * 1024)):.2f} MB" 
                                    if file_size >= 1024 * 1024 
                                    else f"{(file_size / 1024):.2f} KB")
                            
                            files.append({
                                'id': str(file_doc.get('_id', '')),
                                'filename': file_doc.get('originalName', file_doc.get('fileName', 'Unknown File')),
                                'upload_date': file_doc.get('uploadDate', datetime.utcnow()),
                                'file_size': file_size,
                                'size_formatted': size_str,
                                'word_count': file_doc.get('wordCount', 0),
                                'file_type': file_doc.get('fileType', ''),
                                'file_path': file_doc.get('filePath', '')
                            })
                    except Exception as e:
                        app.logger.error(f"Error processing file {file_id}: {str(e)}")
        
        # If no files found by ID, look up files by submission ID
        if not files:
            app.logger.info(f"Looking up files by submission ID: {id}")
            file_docs = files_collection.find({"submissionId": id})
            
            for file_doc in file_docs:
                try:
                    file_size = file_doc.get('fileSize', 0)
                    size_str = (f"{(file_size / (1024 * 1024)):.2f} MB" 
                              if file_size >= 1024 * 1024 
                              else f"{(file_size / 1024):.2f} KB")
                    
                    files.append({
                        'id': str(file_doc.get('_id', '')),
                        'filename': file_doc.get('originalName', file_doc.get('fileName', 'Unknown File')),
                        'upload_date': file_doc.get('uploadDate', datetime.utcnow()),
                        'file_size': file_size,
                        'size_formatted': size_str,
                        'word_count': file_doc.get('wordCount', 0),
                        'file_type': file_doc.get('fileType', ''),
                        'file_path': file_doc.get('filePath', '')
                    })
                except Exception as e:
                    app.logger.error(f"Error processing file document: {str(e)}")
        
        app.logger.info(f"Total files found for submission {id}: {len(files)}")
        
        return render_template('admin/edit_submission.html', submission=submission, files=files)
        
    except Exception as e:
        app.logger.error(f"Error in edit_submission: {str(e)}")
        flash('Error editing submission', 'danger')
        return redirect(url_for('admin_submissions'))

@app.route('/admin/submission/<id>/delete', methods=['POST'])
@admin_required
def delete_submission(id):
    try:
        # Delete submission
        result = submissions_collection.delete_one({'_id': ObjectId(id)})
        
        if result.deleted_count > 0:
            flash('Submission deleted successfully.', 'success')
        else:
            flash('Submission not found.', 'error')
            
        return redirect(url_for('admin_submissions'))
        
    except Exception as e:
        app.logger.error(f"Error deleting submission: {str(e)}")
        flash('Error deleting submission.', 'error')
        return redirect(url_for('admin_submissions'))

# Template filters
@app.template_filter('format_date')
def format_date(date):
    if not date:
        return ''
    if isinstance(date, str):
        try:
            date = datetime.strptime(date, '%Y-%m-%d %H:%M:%S')
        except ValueError:
            try:
                date = datetime.strptime(date, '%Y-%m-%dT%H:%M:%S.%fZ')
            except ValueError:
                return date
    return date.strftime('%Y-%m-%d %H:%M:%S')

@app.template_filter('status_color')
def status_color(status):
    colors = {
        'pending': 'warning',
        'in_progress': 'info',
        'completed': 'success',
        'cancelled': 'danger'
    }
    return colors.get(status, 'secondary')

@app.template_filter('nl2br')
def nl2br(value):
    """Convert newlines to <br> tags"""
    if not value:
        return ''
    return value.replace('\n', '<br>')

@app.route('/admin/test-create-submission')
@admin_required
def test_create_submission():
    try:
        app.logger.info("Creating test submission")
        
        if submissions_collection is None:
            app.logger.error("MongoDB connection not available")
            flash('Database connection error. Please contact administrator.', 'error')
            return redirect(url_for('admin_submissions'))
            
        # Create a test submission with all required fields
        test_submission = {
            'email': 'test@example.com',
            'subjectArea': 'Test Subject',
            'journalName': 'Test Journal',
            'orderInstructions': 'This is a test submission',
            'personalInfo': {
                'fullName': 'Test User',
                'mobile': '1234567890'
            },
            'selectedService': {
                'name': 'Test Service',
                'id': 'test-service-id'
            },
            'totalPrice': 99.99,
            'status': 'pending',
            'submissionDate': datetime.now(),
            'files': []
        }
        
        # Insert the test submission
        result = submissions_collection.insert_one(test_submission)
        app.logger.info(f"Test submission created with ID: {result.inserted_id}")
        
        flash('Test submission created successfully.', 'success')
        return redirect(url_for('admin_submission_detail', submission_id=str(result.inserted_id)))
        
    except Exception as e:
        app.logger.error(f"Error creating test submission: {str(e)}")
        app.logger.error(f"Exception details: {type(e).__name__}: {str(e)}")
        import traceback
        app.logger.error(f"Traceback: {traceback.format_exc()}")
        flash('Error creating test submission.', 'error')
        return redirect(url_for('admin_submissions'))

@app.route('/admin/check-mongodb')
@admin_required
def check_mongodb():
    try:
        app.logger.info("Checking MongoDB connection status")
        
        if submissions_collection is None:
            app.logger.error("MongoDB connection not available")
            flash('Database connection error. Please contact administrator.', 'error')
            return redirect(url_for('admin_submissions'))
            
        # Check MongoDB connection
        server_info = mongo_client.server_info()
        app.logger.info(f"MongoDB server info: {server_info}")
        
        # Get database info
        db_info = {
            'name': app.config['MONGO_DB_NAME'],
            'collections': db.list_collection_names(),
            'forms_count': submissions_collection.count_documents({}),
            'files_count': files_collection.count_documents({}),
            'server_version': server_info.get('version', 'unknown'),
            'connection_status': 'Connected'
        }
        
        app.logger.info(f"MongoDB connection check successful: {db_info}")
        
        flash('MongoDB connection successful.', 'success')
        return render_template('admin/mongodb_status.html', db_info=db_info)
        
    except Exception as e:
        app.logger.error(f"Error checking MongoDB connection: {str(e)}")
        flash('Error checking MongoDB connection.', 'error')
        return redirect(url_for('admin_submissions'))

if __name__ == '__main__':
    with app.app_context():
        create_admin()
    # Disable auto-reloader and use host 0.0.0.0 to make it accessible from other devices
    app.run(debug=True, port=5000, use_reloader=False, host='127.0.0.1') 