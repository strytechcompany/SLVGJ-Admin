import nodemailer from "nodemailer";
import User from "./model/user.js";

const displayDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-IN", { // South Indian date and time
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
    });
}

const sendEmail = async ({ email, emailType, user }) => {
    try {
        const otp = Math.floor(100000 * Math.random() + 100000);
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.GMAIL_USERNAME,
                pass: process.env.GMAIL_PASSWORD
            }
        });
        let mailOptions;
        if(emailType == "Login") {
            await User.findOneAndUpdate(
                { email },
                { verifyOTP: otp, verifyOTPExpiry: Date.now() + 10 * 60 * 1000 }
            );
            mailOptions = {
                from: process.env.GMAIL_USERNAME,
                to: email,
                subject: 'Verify your email',
                html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", otp),
            }
        }
        else if(emailType === "REGISTER") {
            mailOptions = {
                from: process.env.GMAIL_USERNAME,
                to: email,
                subject: 'Welcome to Gold Shop',
                html: REGISTER_EMAIL_TEMPLATE.replace("{email}", email).replace("{name}", user.name),
            }
        }
        else if(emailType === "CHITFUND_CREATED") {
            mailOptions = {
                from: process.env.GMAIL_USERNAME,
                to: email,
                subject: 'Chitfund Created',
                html: CHITFUND_CREATED_EMAIL_TEMPLATE.replace("{email}", email).replace("{name}", user.name).replace("{chitfund_name}", user.chitfund_name).replace("{amount}", user.chitfund_amount).replace("{duration}", user.chitfund_duration).replace("{type}", user.chitfund_type),
            }
        }
        else if(emailType === "CHITFUND_ACCEPTED") {
            mailOptions = {
                from: process.env.GMAIL_USERNAME,
                to: email,
                subject: 'Chitfund Accepted',
                html: CHITFUND_ACCEPTED_EMAIL_TEMPLATE.replace("{email}", email).replace("{name}", user.name).replace("{chitfund_name}", user.chitfund_name).replace("{amount}", user.chitfund_amount).replace("{duration}", user.chitfund_duration).replace("{type}", user.chitfund_type),
            }
        }
        else if(emailType === "CHITFUND_REJECTED") {
            mailOptions = {
                from: process.env.GMAIL_USERNAME,
                to: email,
                subject: 'Chitfund Rejected',
                html: CHITFUND_REJECTED_EMAIL_TEMPLATE.replace("{email}", email).replace("{name}", user.name).replace("{chitfund_name", user.chitfund_name),
            }
        }
        else if(emailType === "CHITFUND_PAYMENT") {
            mailOptions = {
                from: process.env.GMAIL_USERNAME,
                to: email,
                subject: 'Chitfund Payment',
                html: CHITFUND_PAYMENT_EMAIL_TEMPLATE.replace("{email}", email).replace("{name}", user.name).replace("{chitfund_name}", user.chitfund_name).replace("{amount}", user.chitfund_amount).replace("{date}", displayDate(user.chitfund_date)).replace("{month_name}", user.month_name).replace("{months_paid}", String(user.months_paid)).replace("{remaining_months}", String(user.remaining_months)),
            }
        }
        else if(emailType === "CHITFUND_COMPLETED") {
            mailOptions = {
                from: process.env.GMAIL_USERNAME,
                to: email,
                subject: 'Chitfund Completed',
                html: CHITFUND_COMPLETED_EMAIL_TEMPLATE.replace("{email}", email).replace("{name}", user.name).replace("{chitfund_name}", user.chitfund_name).replace("{amount}", user.chitfund_amount).replace("{duration}", user.chitfund_duration).replace("{type}", user.chitfund_type),
            }
        }
        else if(emailType === "CHITFUND_COMPLETED_ADMIN") {
            mailOptions = {
                from: process.env.GMAIL_USERNAME,
                to: email,
                subject: 'Chitfund Completed',
                html: CHITFUND_COMPLETED_ADMIN_EMAIL_TEMPLATE.replace("{email}", email).replace("{name}", user.name).replace("{chitfund_name}", user.chitfund_name).replace("{amount}", user.chitfund_amount).replace("{duration}", user.chitfund_duration).replace("{type}", user.chitfund_type),
            }
        }
        const mailResponse = await transporter.sendMail(mailOptions);
        return mailResponse;
    }
    catch(err) {
        throw new Error(err.message);
    }
}

export default sendEmail;

const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Email - Gold Shop</title>
</head>
<body style="margin:0; padding:0; background-color:#0f0f0f; font-family: 'Georgia', serif; color:#333;">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 50px 0;">

        <table role="presentation" width="600" cellspacing="0" cellpadding="0"
          style="background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 8px 25px rgba(0,0,0,0.4);">

          <!-- HEADER -->
          <tr>
            <td align="center" style="padding:40px; background: linear-gradient(135deg, #c9a24a, #f5d27a);">
              <img src="https://mirajcandles.com/logo.png" alt="Gold Shop" width="85" style="display:block; margin-bottom:12px;" />
              <h1 style="margin:0; font-size:26px; color:#1a1a1a; letter-spacing:1px;">
                Premium Verification
              </h1>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px 45px; background-color:#ffffff;">

              <p style="font-size:17px; margin-bottom:15px; color:#222;">
                Greetings,
              </p>

              <p style="font-size:16px; line-height:1.6; margin-bottom:25px; color:#444;">
                Welcome to <strong style="color:#c9a24a;">Gold Shop</strong> — where elegance meets craftsmanship.
                To access your exclusive experience, kindly verify your email address using the code below.
              </p>

              <!-- CODE BOX -->
              <div style="text-align:center; margin:45px 0;">
                <div style="display:inline-block; padding:22px 50px; border-radius:10px;
                  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
                  border: 1px solid #c9a24a;">

                  <span style="font-size:38px; font-weight:bold; letter-spacing:8px; color:#f5d27a;">
                    {verificationCode}
                  </span>
                </div>
              </div>

              <p style="font-size:15px; margin-bottom:10px; color:#555;">
                Enter this code to securely activate your account.
              </p>

              <p style="font-size:14px; color:#777;">
                This code will expire in <strong style="color:#c9a24a;">15 minutes</strong>.
              </p>

              <p style="font-size:14px; margin-top:30px; color:#666;">
                If this wasn’t you, please disregard this message.
              </p>

              <p style="font-size:15px; margin-top:45px; color:#222;">
                With elegance,<br/>
                <strong style="color:#c9a24a;">Gold Shop Team</strong>
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:25px; background:#111; color:#aaa; font-size:12px;">
              <p style="margin:0;">© 2025 Gold Shop. All rights reserved.</p>
              <p style="margin:6px 0 0;">This is an automated message — please do not reply.</p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

const REGISTER_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome - Gold Shop</title>
</head>
<body style="margin:0; padding:0; background-color:#0f0f0f; font-family: 'Georgia', serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:50px 0;">

<table width="600" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:14px; overflow:hidden;">
<tr>
<td align="center" style="padding:40px; background: linear-gradient(135deg, #c9a24a, #f5d27a);">
<h1 style="margin:0;">Welcome to Gold Shop</h1>
</td>
</tr>

<tr>
<td style="padding:40px;">
<p>Hello <strong>{name}</strong>,</p>

<p>We're delighted to welcome you to <strong style="color:#c9a24a;">Gold Shop</strong>.</p>

<p>Your account has been successfully created with the email:</p>
<p><strong>{email}</strong></p>

<p>Start exploring premium gold plans and exclusive offers crafted just for you.</p>

<p style="margin-top:30px;">Warm regards,<br/><strong>Gold Shop Team</strong></p>
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

const CHITFUND_CREATED_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="background:#0f0f0f; font-family:Georgia;">
<table width="100%" align="center">
<tr><td align="center">

<table width="600" style="background:#fff; border-radius:14px;">
<tr>
<td style="padding:40px; background:linear-gradient(135deg,#c9a24a,#f5d27a); text-align:center;">
<h2>Chitfund Created</h2>
</td>
</tr>

<tr>
<td style="padding:40px;">
<p>Hello <strong>{name}</strong>,</p>

<p>Your chitfund has been successfully created.</p>

<ul>
<li><strong>Chitfund Name:</strong> {chitfund_name}</li>
<li><strong>Amount:</strong> ₹{amount}</li>
<li><strong>Duration:</strong> {duration} months</li>
<li><strong>Type:</strong> {type}</li>
</ul>

<p>We’ll keep you updated on your progress.</p>

<p>Regards,<br/><strong>Gold Shop Team</strong></p>
</td>
</tr>

</table>

</td></tr>
</table>
</body>
</html>
`;

const CHITFUND_ACCEPTED_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="background:#0f0f0f; font-family:Georgia;">
<table width="100%" align="center">
<tr><td align="center">

<table width="600" style="background:#fff; border-radius:14px;">
<tr>
<td style="padding:40px; background:linear-gradient(135deg,#c9a24a,#f5d27a); text-align:center;">
<h2>Chitfund Approved</h2>
</td>
</tr>

<tr>
<td style="padding:40px;">
<p>Hello <strong>{name}</strong>,</p>

<p>Great news! Your chitfund request has been <strong style="color:green;">approved</strong>.</p>

<ul>
<li><strong>Chitfund Name:</strong> {chitfund_name}</li>
<li><strong>Amount:</strong> ₹{amount}</li>
<li><strong>Duration:</strong> {duration} months</li>
<li><strong>Type:</strong> {type}</li>
</ul>

<p>You can now start your contributions and enjoy the benefits.</p>

<p>Regards,<br/><strong>Gold Shop Team</strong></p>
</td>
</tr>

</table>

</td></tr>
</table>
</body>
</html>
`;

const CHITFUND_REJECTED_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="background:#0f0f0f; font-family:Georgia;">
<table width="100%" align="center">
<tr><td align="center">

<table width="600" style="background:#fff; border-radius:14px;">
<tr>
<td style="padding:40px; background:linear-gradient(135deg,#c9a24a,#f5d27a); text-align:center;">
<h2>Chitfund Update</h2>
</td>
</tr>

<tr>
<td style="padding:40px;">
<p>Hello <strong>{name}</strong>,</p>

<p>We regret to inform you that your chitfund request <strong>{chitfund_name}</strong> was not approved.</p>

<p>If you have questions, feel free to contact support.</p>

<p>Regards,<br/><strong>Gold Shop Team</strong></p>
</td>
</tr>

</table>

</td></tr>
</table>
</body>
</html>
`;

const CHITFUND_PAYMENT_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="background:#0f0f0f; font-family:Georgia;">
<table width="100%" align="center">
<tr><td align="center">

<table width="600" style="background:#fff; border-radius:14px;">
<tr>
<td style="padding:40px; background:linear-gradient(135deg,#c9a24a,#f5d27a); text-align:center;">
<h2>Payment Received</h2>
</td>
</tr>

<tr>
<td style="padding:40px;">
<p>Hello <strong>{name}</strong>,</p>

<p>Your payment has been successfully received.</p>

<ul>
<li><strong>Chitfund Name:</strong> {chitfund_name}</li>
<li><strong>Amount:</strong> ₹{amount}</li>
<li><strong>Date:</strong> {date}</li>
<li><strong>Months Paid:</strong> {months_paid}</li>
<li><strong>Remaining Months:</strong> {remaining_months}</li>
</ul>

<p>Thank you for staying consistent with your chitfund plan.</p>

<p>Regards,<br/><strong>Gold Shop Team</strong></p>
</td>
</tr>

</table>

</td></tr>
</table>
</body>
</html>
`;

const CHITFUND_COMPLETED_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="background:#0f0f0f; font-family:Georgia;">
<table width="100%" align="center">
<tr><td align="center">

<table width="600" style="background:#fff; border-radius:14px; overflow:hidden;">
<tr>
<td style="padding:40px; background:linear-gradient(135deg,#c9a24a,#f5d27a); text-align:center;">
<h2 style="margin:0;">Chitfund Completed 🎉</h2>
</td>
</tr>

<tr>
<td style="padding:40px;">
<p>Hello <strong>{name}</strong>,</p>

<p>Congratulations! Your chitfund plan has been successfully completed.</p>

<ul>
<li><strong>Chitfund Name:</strong> {chitfund_name}</li>
<li><strong>Total Amount:</strong> ₹{amount}</li>
<li><strong>Duration:</strong> {duration} months</li>
<li><strong>Type:</strong> {type}</li>
</ul>

<p style="margin-top:20px;">
We appreciate your commitment and trust in <strong style="color:#c9a24a;">Gold Shop</strong>.
</p>

<p>
You can now proceed with your benefits or contact us for further assistance.
</p>

<p style="margin-top:30px;">
Warm regards,<br/>
<strong style="color:#c9a24a;">Gold Shop Team</strong>
</p>
</td>
</tr>

</table>

</td></tr>
</table>
</body>
</html>
`;

const CHITFUND_COMPLETED_ADMIN_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<body style="background:#0f0f0f; font-family:Georgia;">
<table width="100%" align="center">
<tr><td align="center">

<table width="600" style="background:#fff; border-radius:14px; overflow:hidden;">
<tr>
<td style="padding:40px; background:linear-gradient(135deg,#c9a24a,#f5d27a); text-align:center;">
<h2 style="margin:0;">Chitfund Completed (Admin Notice)</h2>
</td>
</tr>

<tr>
<td style="padding:40px;">
<p>Hello Admin,</p>

<p>A chitfund has been successfully completed. Below are the details:</p>

<ul>
<li><strong>User Name:</strong> {name}</li>
<li><strong>User Email:</strong> {email}</li>
<li><strong>Chitfund Name:</strong> {chitfund_name}</li>
<li><strong>Total Amount:</strong> ₹{amount}</li>
<li><strong>Duration:</strong> {duration} months</li>
<li><strong>Type:</strong> {type}</li>
</ul>

<p style="margin-top:20px;">
Please proceed with any required final processing or settlement.
</p>

<p style="margin-top:30px;">
Regards,<br/>
<strong style="color:#c9a24a;">Gold Shop System</strong>
</p>
</td>
</tr>

</table>

</td></tr>
</table>
</body>
</html>
`;
