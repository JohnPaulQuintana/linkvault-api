const nodemailer = require("nodemailer");
const { supabase } = require("../config/supabase");
const generateOtp = require("../utils/generateOtp");
const { hash } = require("../utils/hash");

const RESEND_COOLDOWN = 60 * 1000; // 60 seconds

const sendOtp = async (email) => {
  // 1. Check last OTP (cooldown protection)
  const { data: lastOtp } = await supabase
    .from("otps")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastOtp) {
    const diff = Date.now() - new Date(lastOtp.created_at).getTime();

    if (diff < RESEND_COOLDOWN) {
      throw new Error("Please wait 60 seconds before requesting another OTP");
    }
  }

  // 2. Clean old OTPs (IMPORTANT)
  await supabase.from("otps").delete().eq("email", email);

  // 3. Generate new OTP
  const otp = generateOtp();
  const otpHash = await hash(otp);

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // 4. Save OTP
  const { error } = await supabase.from("otps").insert({
    email,
    code_hash: otpHash,
    expires_at: expiresAt,
    created_at: new Date(),
  });

  if (error) {
    throw new Error("Failed to save OTP");
  }

  // 5. Send email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"NaviLink" <${process.env.EMAIL}>`,
    to: email,
    subject: "Verify your NaviLink account",
    html: `
  <div style="
    background:#f4f7fb;
    padding:40px 20px;
    font-family:Arial, sans-serif;
  ">

    <div style="
      max-width:520px;
      margin:auto;
      background:#ffffff;
      border-radius:20px;
      overflow:hidden;
      box-shadow:0 12px 35px rgba(0,0,0,0.08);
    ">

      <!-- HEADER -->
      <div style="
        background:linear-gradient(135deg,#0077b6,#00b4d8);
        padding:32px 24px;
        text-align:center;
      ">
        <h1 style="
          color:#ffffff;
          margin:0;
          font-size:26px;
          letter-spacing:1px;
        ">
          NaviLink
        </h1>

        <p style="
          color:rgba(255,255,255,0.85);
          margin-top:6px;
          font-size:13px;
        ">
          Secure verification for your account
        </p>
      </div>

      <!-- BODY -->
      <div style="padding:36px 28px;">

        <h2 style="
          margin:0 0 10px 0;
          color:#0f172a;
          font-size:22px;
        ">
          Verify your email address
        </h2>

        <p style="
          color:#475569;
          font-size:14px;
          line-height:1.6;
          margin-bottom:26px;
        ">
          Use the verification code below to continue signing in to your NaviLink account.
          This helps us keep your account secure.
        </p>

        <!-- OTP GRID -->
<div style="
  text-align:center;
  margin:30px 0;
">

  <table role="presentation" align="center" cellspacing="0" cellpadding="0" style="margin:auto;">
    <tr>

      ${otp
        .split("")
        .map(
          (digit) => `
        <td style="
          width:48px;
          height:56px;
          border:2px solid #e2e8f0;
          border-radius:12px;
          background:#f8fafc;
          text-align:center;
          vertical-align:middle;
          font-size:22px;
          font-weight:700;
          color:#0077b6;
          font-family:Arial, sans-serif;
        ">
          ${digit}
        </td>
        <td style="width:10px;"></td>
      `,
        )
        .join("")}

    </tr>
  </table>

</div>

        <!-- INFO BOX -->
        <div style="
          background:#f8fafc;
          border-radius:14px;
          padding:16px 18px;
          border:1px solid #e2e8f0;
        ">
          <p style="
            margin:0;
            color:#475569;
            font-size:13px;
            line-height:1.7;
          ">
            This code expires in <b>5 minutes</b><br/>
            Never share this code with anyone<br/>
            If you did not request this, you can safely ignore this email
          </p>
        </div>

        <!-- HELP TEXT -->
        <p style="
          margin-top:24px;
          font-size:12px;
          color:#94a3b8;
          text-align:center;
        ">
          Need help? Contact NaviLink support anytime.
        </p>

      </div>

      <!-- FOOTER -->
      <div style="
        text-align:center;
        padding:18px;
        font-size:12px;
        color:#94a3b8;
        border-top:1px solid #eef2f7;
      ">
        © ${new Date().getFullYear()} NaviLink. All rights reserved.
      </div>

    </div>
  </div>
  `,
  });

  return true;
};

module.exports = { sendOtp };
