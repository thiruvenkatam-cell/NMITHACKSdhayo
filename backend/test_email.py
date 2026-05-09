from utils.email import send_email

# Replace with an email address you can check, or just send it to yourself!
test_email = "vikashkumar221005@gmail.com"

print(f"Testing email setup by sending an email to {test_email}...")

success, message = send_email(
    to_email=test_email,
    subject="UniDrop Setup Test",
    text_body="If you are reading this, your Python email setup (Nodemailer equivalent) is working perfectly!",
    html_body="<h3>Success! 🎉</h3><p>If you are reading this, your Python email setup is working perfectly.</p>"
)

if success:
    print("✅ Email sent successfully! Check your inbox.")
else:
    print(f"❌ Failed to send email. Error: {message}")
