import nodemailer from "nodemailer"

export const sendVerificationOtp = async (email, otp) => {
    const requiredMailerEnv = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_FROM"]
    const missingMailerEnv = requiredMailerEnv.filter((key) => !process.env[key])

    if (missingMailerEnv.length > 0) {
        throw new Error(`Email service is not configured. Missing: ${missingMailerEnv.join(", ")}`)
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    })

    await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject: "Your QuantumAI verification code",
        text: `Verify your QuantumAI account\n\nYour verification code is ${otp}. It expires in 10 minutes.\n\nOpen QuantumAI: ${process.env.CLIENT_URL || "http://localhost:5173"}/auth\n\nIf you did not request this code, you can safely ignore this email.`,
        html: `
            <!doctype html>
            <html lang="en">
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <meta name="color-scheme" content="light" />
                    <title>Verify your QuantumAI account</title>
                </head>
                <body style="margin:0;background:#f5f7f2;font-family:Arial,Helvetica,sans-serif;color:#16201a;">
                    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your QuantumAI verification code expires in 10 minutes.</div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7f2;padding:32px 12px;">
                        <tr>
                            <td align="center">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #dce5d7;border-radius:24px;overflow:hidden;">
                                    <tr>
                                        <td style="background:#16201a;padding:26px 32px;">
                                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="color:#d7f36b;font-size:20px;font-weight:700;">QuantumAI</td>
                                                    <td align="right" style="color:#ffffff99;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Account security</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:38px 32px 34px;">
                                            <p style="margin:0 0 10px;color:#3f772f;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">One quick step</p>
                                            <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;color:#16201a;">Verify your email</h1>
                                            <p style="margin:0;color:#526159;font-size:16px;line-height:1.6;">Use this code to finish creating your account and start your interview practice.</p>
                                            <div style="margin:28px 0 24px;padding:24px 16px;background:#eff9e8;border:1px solid #dcebd4;border-radius:16px;text-align:center;">
                                                <p style="margin:0 0 8px;color:#718078;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;">Your verification code</p>
                                                <div style="color:#3f772f;font-size:36px;font-weight:700;letter-spacing:9px;line-height:1.2;">${otp}</div>
                                                <p style="margin:12px 0 0;color:#718078;font-size:13px;">Expires in 10 minutes</p>
                                            </div>
                                            <div style="text-align:center;margin:0 0 28px;">
                                                <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/auth" style="display:inline-block;background:#16201a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:12px;">Open QuantumAI</a>
                                            </div>
                                            <div style="border-top:1px solid #e7eee5;padding-top:20px;">
                                                <p style="margin:0;color:#718078;font-size:13px;line-height:1.6;">QuantumAI will never ask for this code by phone or email. If you did not request this verification, you can safely ignore this message.</p>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="background:#fbfdfb;padding:18px 32px;color:#9aa79e;font-size:12px;text-align:center;">AI-powered interview practice, built for your next opportunity.</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
            </html>
        `
    })
}
