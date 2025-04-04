from app import app, db, Submission

with app.app_context():
    submissions = Submission.query.all()
    print(f"Total submissions: {len(submissions)}")
    
    if submissions:
        for sub in submissions:
            print(f"ID: {sub.id}, Email: {sub.email}, Status: {sub.status}")
    else:
        print("No submissions found in the database") 