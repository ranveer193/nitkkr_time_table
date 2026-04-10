const sendApprovalEmail = async ({ name, email, departmentName }) => {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || apiKey === 're_your_key_here') {
      console.log(
        `[Email] Skipping approval email for ${email} — RESEND_API_KEY not configured`
      );
      return;
    }

    const { Resend } = require('resend');
    const resend = new Resend(apiKey);

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;

    await resend.emails.send({
      from: 'TimeTabl <onboarding@resend.dev>',
      to: [email],
      subject: 'Your TimeTabl Admin Account Has Been Approved!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
            <div style="background:white;border-radius:12px;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
              <h1 style="color:#1a1a2e;margin:0 0 16px;font-size:24px;">Welcome to TimeTabl!</h1>
              <p style="color:#4a4a68;font-size:16px;line-height:1.6;margin:0 0 16px;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="color:#4a4a68;font-size:16px;line-height:1.6;margin:0 0 16px;">
                Your admin account has been approved! You have been assigned to the
                <strong>${departmentName}</strong> department.
              </p>
              <p style="color:#4a4a68;font-size:16px;line-height:1.6;margin:0 0 24px;">
                You can now log in and start managing your department's timetable.
              </p>
              <a href="${loginUrl}" style="display:inline-block;background:#3B82F6;color:white;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:bold;font-size:16px;">
                Login Now
              </a>
              <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0 16px;" />
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                This is an automated message from TimeTabl. Please do not reply.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log(`[Email] Approval email sent to ${email}`);
  } catch (err) {
    console.error(`[Email] Failed to send approval email to ${email}:`, err.message);
  }
};

module.exports = { sendApprovalEmail };
