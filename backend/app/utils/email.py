"""
Email service using Brevo (SendinBlue)
"""
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from app.config import settings


def get_brevo_api():
    """Get configured Brevo API instance"""
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = settings.BREVO_API_KEY
    return sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))


def send_semester_request_email(
    to_email: str,
    to_name: str,
    department_name: str,
    semester_name: str,
    access_url: str,
    deadline: str = None,
    custom_message: str = None
):
    """
    Send semester request email to department chair

    Args:
        to_email: Recipient email address
        to_name: Recipient name
        department_name: Name of the department
        semester_name: Semester display name (e.g., "Fall 2025")
        access_url: Unique URL for the chair to access the form
        deadline: Optional deadline string
        custom_message: Optional custom message from admin
    """
    try:
        api = get_brevo_api()

        # Build email body
        deadline_text = f"\n\n**Deadline:** {deadline}" if deadline else ""
        custom_text = f"\n\n**Message from Administration:**\n{custom_message}" if custom_message else ""

        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #10069F; color: white; padding: 20px; text-align: center; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }}
                .button {{ display: inline-block; background-color: #FFCD00; color: #030F3C; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                .deadline {{ background-color: #fff3cd; padding: 10px; border-left: 4px solid #FFCD00; margin: 15px 0; }}
                .custom-message {{ background-color: #e7f3ff; padding: 15px; border-left: 4px solid #10069F; margin: 15px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>SUSCC Adjunct Instructor Request</h1>
                </div>
                <div class="content">
                    <p>Dear {to_name},</p>

                    <p>The Adjunct Faculty Committee is requesting your department's adjunct instructor assignments for <strong>{semester_name}</strong>.</p>

                    <p><strong>Department:</strong> {department_name}</p>

                    {'<div class="deadline"><strong>⏰ Deadline:</strong> ' + deadline + '</div>' if deadline else ''}

                    {'<div class="custom-message"><strong>📝 Message from Administration:</strong><br>' + custom_message.replace('\n', '<br>') + '</div>' if custom_message else ''}

                    <p>Please click the button below to access the secure form and submit your department's adjunct instructor information:</p>

                    <div style="text-align: center;">
                        <a href="{access_url}" class="button">Submit Adjunct Information</a>
                    </div>

                    <p style="font-size: 12px; color: #666;">Or copy and paste this link into your browser:<br>
                    <a href="{access_url}">{access_url}</a></p>

                    <p>This link is unique to your department and should not be shared.</p>

                    <p>If you have any questions, please contact the Adjunct Faculty Committee.</p>

                    <p>Thank you,<br>
                    <strong>SUSCC Adjunct Faculty Committee</strong></p>
                </div>
                <div class="footer">
                    <p>Southern Union State Community College<br>
                    This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Plain text version
        text_content = f"""
SUSCC Adjunct Instructor Request

Dear {to_name},

The Adjunct Faculty Committee is requesting your department's adjunct instructor assignments for {semester_name}.

Department: {department_name}
{deadline_text}
{custom_text}

Please visit the following link to access the secure form and submit your department's adjunct instructor information:

{access_url}

This link is unique to your department and should not be shared.

If you have any questions, please contact the Adjunct Faculty Committee.

Thank you,
SUSCC Adjunct Faculty Committee

---
Southern Union State Community College
This is an automated message. Please do not reply to this email.
        """

        # Create email object
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": to_email, "name": to_name}],
            sender={"email": settings.FROM_EMAIL, "name": settings.FROM_NAME},
            subject=f"Adjunct Instructor Request - {semester_name} - {department_name}",
            html_content=html_content,
            text_content=text_content
        )

        # Send email
        api.send_transac_email(send_smtp_email)
        return True

    except ApiException as e:
        print(f"Error sending email via Brevo: {e}")
        raise Exception(f"Failed to send email: {str(e)}")


def send_reminder_email(
    to_email: str,
    to_name: str,
    department_name: str,
    semester_name: str,
    access_url: str,
    deadline: str = None
):
    """
    Send reminder email to department chair

    Args:
        to_email: Recipient email address
        to_name: Recipient name
        department_name: Name of the department
        semester_name: Semester display name (e.g., "Fall 2025")
        access_url: Unique URL for the chair to access the form
        deadline: Optional deadline string
    """
    try:
        api = get_brevo_api()

        deadline_text = f"\n\n**Deadline:** {deadline}" if deadline else ""

        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #E74C3C; color: white; padding: 20px; text-align: center; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }}
                .button {{ display: inline-block; background-color: #FFCD00; color: #030F3C; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
                .deadline {{ background-color: #fff3cd; padding: 10px; border-left: 4px solid #E74C3C; margin: 15px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚠️ REMINDER: Adjunct Instructor Request</h1>
                </div>
                <div class="content">
                    <p>Dear {to_name},</p>

                    <p><strong>This is a reminder</strong> that we have not yet received your department's adjunct instructor assignments for <strong>{semester_name}</strong>.</p>

                    <p><strong>Department:</strong> {department_name}</p>

                    {'<div class="deadline"><strong>⏰ Deadline:</strong> ' + deadline + '</div>' if deadline else ''}

                    <p>Please click the button below to access the form and submit your information as soon as possible:</p>

                    <div style="text-align: center;">
                        <a href="{access_url}" class="button">Submit Now</a>
                    </div>

                    <p style="font-size: 12px; color: #666;">Or copy and paste this link into your browser:<br>
                    <a href="{access_url}">{access_url}</a></p>

                    <p>If you have already submitted your information, please disregard this reminder.</p>

                    <p>Thank you,<br>
                    <strong>SUSCC Adjunct Faculty Committee</strong></p>
                </div>
                <div class="footer">
                    <p>Southern Union State Community College<br>
                    This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
⚠️ REMINDER: Adjunct Instructor Request

Dear {to_name},

This is a reminder that we have not yet received your department's adjunct instructor assignments for {semester_name}.

Department: {department_name}
{deadline_text}

Please visit the following link to submit your information as soon as possible:

{access_url}

If you have already submitted your information, please disregard this reminder.

Thank you,
SUSCC Adjunct Faculty Committee

---
Southern Union State Community College
This is an automated message. Please do not reply to this email.
        """

        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": to_email, "name": to_name}],
            sender={"email": settings.FROM_EMAIL, "name": settings.FROM_NAME},
            subject=f"REMINDER: Adjunct Request - {semester_name} - {department_name}",
            html_content=html_content,
            text_content=text_content
        )

        api.send_transac_email(send_smtp_email)
        return True

    except ApiException as e:
        print(f"Error sending reminder email via Brevo: {e}")
        raise Exception(f"Failed to send reminder: {str(e)}")
