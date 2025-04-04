from app import app, db, Submission
from datetime import datetime

with app.app_context():
    # Create a test submission
    test_submission = Submission(
        full_name="Test User",
        email="test@example.com",
        subject_area="Computer Science",
        journal_name="Journal of Computer Science",
        order_instructions="This is a test submission with complete details.",
        mobile="1234567890",
        service_type="editing",
        total_price=150.00,
        promo_applied=False,
        status="pending",
        timestamp=datetime.utcnow()
    )
    
    db.session.add(test_submission)
    db.session.commit()
    
    print(f"Test submission created with ID: {test_submission.id}")
    print(f"You can now view it at: http://localhost:5000/submission/{test_submission.id}") 