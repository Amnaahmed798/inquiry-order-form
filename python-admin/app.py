from flask import Flask, render_template, request, redirect, url_for, flash, session
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime, timedelta
from pymongo import MongoClient

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)  # Generate a secure secret key
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=2)  # Session expires after 2 hours

# MongoDB connection
mongo_client = MongoClient('mongodb://localhost:27017/')
db = mongo_client['formSubmission']
users_collection = db['users']
forms_collection = db['forms']

# Create admin user function
def create_admin():
    admin = users_collection.find_one({'email': 'admin@example.com'})
    if not admin:
        admin = {
            'email': 'admin@example.com',
            'password': generate_password_hash('admin123'),
            'role': 'admin',
            'created_at': datetime.utcnow()
        }
        users_collection.insert_one(admin)

# Authentication decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in first.', 'error')
            return redirect(url_for('login'))
        
        user = users_collection.find_one({'_id': session['user_id']})
        if not user or user['role'] != 'admin':
            flash('Access denied.', 'error')
            return redirect(url_for('login'))
            
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/admin/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = users_collection.find_one({'email': email})
        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['_id']
            session.permanent = True
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
            
        flash('Invalid email or password.', 'error')
    return render_template('login.html')

@app.route('/admin/logout')
def logout():
    session.pop('user_id', None)
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))

@app.route('/admin/dashboard')
@admin_required
def dashboard():
    total_submissions = forms_collection.count_documents({})
    pending_orders = forms_collection.count_documents({'status': 'pending'})
    recent_submissions = list(forms_collection.find().sort('submittedAt', -1).limit(5))
    
    return render_template('dashboard.html',
                         total_submissions=total_submissions,
                         pending_orders=pending_orders,
                         recent_submissions=recent_submissions)

@app.route('/admin/submissions')
@admin_required
def submissions():
    page = request.args.get('page', 1, type=int)
    status_filter = request.args.get('status', '')
    search_query = request.args.get('search', '')
    
    # Build the query
    query = {}
    if status_filter:
        query['status'] = status_filter
    if search_query:
        query['$or'] = [
            {'email': {'$regex': search_query, '$options': 'i'}},
            {'fullName': {'$regex': search_query, '$options': 'i'}}
        ]
    
    # Calculate pagination
    per_page = 10
    skip = (page - 1) * per_page
    
    # Get total count for pagination
    total = forms_collection.count_documents(query)
    
    # Get submissions for current page
    submissions_cursor = forms_collection.find(query).sort('submittedAt', -1).skip(skip).limit(per_page)
    submissions = list(submissions_cursor)
    
    # Create pagination object
    total_pages = (total + per_page - 1) // per_page
    has_prev = page > 1
    has_next = page < total_pages
    
    pagination = {
        'page': page,
        'per_page': per_page,
        'total': total,
        'pages': total_pages,
        'has_prev': has_prev,
        'has_next': has_next
    }
    
    return render_template('submissions.html', submissions=submissions, pagination=pagination)

@app.route('/admin/submission/<submission_id>')
@admin_required
def submission_detail(submission_id):
    from bson.objectid import ObjectId
    submission = forms_collection.find_one({'_id': ObjectId(submission_id)})
    if not submission:
        flash('Submission not found.', 'error')
        return redirect(url_for('submissions'))
    return render_template('submission_detail.html', submission=submission)

@app.route('/admin/users')
@admin_required
def users():
    users = list(users_collection.find())
    return render_template('users.html', users=users)

@app.route('/admin/settings')
@admin_required
def settings():
    return render_template('settings.html')

if __name__ == '__main__':
    create_admin()  # Create admin user if not exists
    app.run(debug=True, port=5000)  # Run on port 5000 