import genToken from "../config/token.js"
import User from "../models/user.model.js"
import Session from "../models/session.model.js"
import crypto from "crypto"
import { sendVerificationOtp } from "../config/mailer.js"

const getClientDetails = (req) => ({
    userAgent: req.headers["user-agent"] || "Unknown browser",
    ipAddress: req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "Unknown IP",
    deviceLabel: /mobile|android|iphone/i.test(req.headers["user-agent"] || "") ? "Mobile device" : "Desktop browser"
})

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
    const hash = crypto.scryptSync(password, salt, 64).toString("hex")
    return `${salt}:${hash}`
}

const verifyPassword = (password, storedHash) => {
    if (!storedHash) return false
    const [salt, key] = storedHash.split(":")
    const derivedKey = crypto.scryptSync(password, salt, 64)
    const storedKey = Buffer.from(key, "hex")
    return storedKey.length === derivedKey.length && crypto.timingSafeEqual(storedKey, derivedKey)
}

const createSession = async (user, req, res) => {
    const sessionId = crypto.randomUUID()
    await Session.create({
        userId: user._id,
        sessionId,
        ...getClientDetails(req)
    })

    const token = await genToken(user._id, sessionId)
    res.cookie("token" , token , {
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
        sameSite:"strict",
        maxAge:7 * 24 * 60 * 60 * 1000
    })
}

const publicUser = (user) => {
    const userData = user.toObject ? user.toObject() : { ...user }
    delete userData.passwordHash
    delete userData.resetPasswordTokenHash
    delete userData.resetPasswordExpiresAt
    delete userData.verificationOtpHash
    delete userData.verificationOtpExpiresAt
    return userData
}


export const googleAuth = async (req,res) => {
    try {
        const {name , email} = req.body
        let user = await User.findOne({email}).select("+passwordHash")
        if(!user){
            user = await User.create({
                name , 
                email,
                emailVerified: true
            })
        } else if (!user.emailVerified && !user.passwordHash) {
            user.emailVerified = true
            await user.save()
        }
        await createSession(user, req, res)

        return res.status(200).json(publicUser(user))



    } catch (error) {
        return res.status(500).json({message:`Google auth error ${error}`})
    }
    
}

export const logOut = async (req,res) => {
    try {
        if (req.sessionId) {
            await Session.findOneAndUpdate(
                { sessionId: req.sessionId, userId: req.userId, revokedAt: null },
                { revokedAt: new Date() }
            )
        }
        await res.clearCookie("token")
        return res.status(200).json({message:"LogOut Successfully"})
    } catch (error) {
         return res.status(500).json({message:`Logout error ${error}`})
    }
    
}

export const getSessions = async (req, res) => {
    try {
        const sessions = await Session.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select("sessionId deviceLabel ipAddress createdAt lastActiveAt revokedAt")

        return res.status(200).json(sessions.map((session) => ({
            ...session.toObject(),
            isCurrent: session.sessionId === req.sessionId
        })))
    } catch (error) {
        return res.status(500).json({message:`Failed to load sessions ${error}`})
    }
}

export const revokeSession = async (req, res) => {
    try {
        const session = await Session.findOneAndUpdate(
            { sessionId: req.params.sessionId, userId: req.userId, revokedAt: null },
            { revokedAt: new Date() },
            { new: true }
        )

        if (!session) {
            return res.status(404).json({message:"Session not found or already revoked"})
        }

        if (session.sessionId === req.sessionId) {
            await res.clearCookie("token")
        }

        return res.status(200).json({message:"Session revoked"})
    } catch (error) {
        return res.status(500).json({message:`Failed to revoke session ${error}`})
    }
}

export const revokeOtherSessions = async (req, res) => {
    try {
        await Session.updateMany(
            { userId: req.userId, sessionId: { $ne: req.sessionId }, revokedAt: null },
            { revokedAt: new Date() }
        )

        return res.status(200).json({message:"Other sessions revoked"})
    } catch (error) {
        return res.status(500).json({message:`Failed to revoke other sessions ${error}`})
    }
}

export const registerWithPassword = async (req, res) => {
    try {
        const { name, email, password } = req.body
        if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
            return res.status(400).json({message:"Name, email, and a password of at least 8 characters are required."})
        }

        const normalizedEmail = email.trim().toLowerCase()
        const existingUser = await User.findOne({ email: normalizedEmail })
            .select("+verificationOtpHash +verificationOtpExpiresAt")
        if (existingUser) {
            if (!existingUser.emailVerified) {
                const otp = String(crypto.randomInt(100000, 1000000))
                existingUser.verificationOtpHash = crypto.createHash("sha256").update(otp).digest("hex")
                existingUser.verificationOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
                await existingUser.save()
                await sendVerificationOtp(normalizedEmail, otp)

                return res.status(200).json({
                    requiresVerification: true,
                    email: normalizedEmail,
                    message: "A fresh verification code was sent to your email."
                })
            }
            return res.status(409).json({message:"An account with this email already exists."})
        }

        const otp = String(crypto.randomInt(100000, 1000000))
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash: hashPassword(password),
            verificationOtpHash: crypto.createHash("sha256").update(otp).digest("hex"),
            verificationOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
        })
        await sendVerificationOtp(normalizedEmail, otp)

        return res.status(201).json({
            requiresVerification: true,
            email: normalizedEmail,
            message: "Verification code sent to your email."
        })
    } catch (error) {
        return res.status(500).json({message:`Registration error ${error}`})
    }
}

export const loginWithPassword = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email: email?.trim().toLowerCase() }).select("+passwordHash")

        if (!user || !verifyPassword(password || "", user.passwordHash)) {
            return res.status(401).json({message:"Invalid email or password."})
        }

        if (!user.emailVerified) {
            return res.status(403).json({message:"Please verify your email before signing in.", requiresVerification:true, email:user.email})
        }

        await createSession(user, req, res)
    return res.status(200).json(publicUser(user))
    } catch (error) {
        return res.status(500).json({message:`Login error ${error}`})
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const normalizedEmail = req.body.email?.trim().toLowerCase()
        const user = await User.findOne({ email: normalizedEmail })
        const response = {message:"If an account exists, a reset link has been prepared."}

        if (!user) return res.status(200).json(response)

        const resetToken = crypto.randomBytes(32).toString("hex")
        user.resetPasswordTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex")
        user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
        await user.save()

        if (process.env.NODE_ENV !== "production") {
            response.resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/auth?reset=${resetToken}`
        }

        return res.status(200).json(response)
    } catch (error) {
        return res.status(500).json({message:`Forgot password error ${error}`})
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body
        if (!token || !password || password.length < 8) {
            return res.status(400).json({message:"A valid reset token and password of at least 8 characters are required."})
        }

        const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
        const user = await User.findOne({
            resetPasswordTokenHash: tokenHash,
            resetPasswordExpiresAt: { $gt: new Date() }
        }).select("+resetPasswordTokenHash +resetPasswordExpiresAt")

        if (!user) return res.status(400).json({message:"This reset link is invalid or expired."})

        user.passwordHash = hashPassword(password)
        user.resetPasswordTokenHash = undefined
        user.resetPasswordExpiresAt = undefined
        await user.save()
        await Session.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() })

        return res.status(200).json({message:"Password reset successfully. Please sign in again."})
    } catch (error) {
        return res.status(500).json({message:`Reset password error ${error}`})
    }
}

export const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body
        if (!email || !/^\d{6}$/.test(String(otp || ""))) {
            return res.status(400).json({message:"Enter the six-digit verification code."})
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() })
            .select("+verificationOtpHash +verificationOtpExpiresAt")
        if (!user) {
            return res.status(404).json({message:"No account was found for this email."})
        }
        if (user.emailVerified) {
            return res.status(409).json({message:"This email is already verified. Please sign in."})
        }

        const otpHash = crypto.createHash("sha256").update(String(otp)).digest("hex")
        if (user.verificationOtpExpiresAt < new Date() || user.verificationOtpHash !== otpHash) {
            return res.status(400).json({message:"The verification code is invalid or expired."})
        }

        user.emailVerified = true
        user.verificationOtpHash = undefined
        user.verificationOtpExpiresAt = undefined
        await user.save()
        await createSession(user, req, res)

        return res.status(200).json(publicUser(user))
    } catch (error) {
        return res.status(500).json({message:`Email verification error ${error}`})
    }
}

export const resendVerificationOtp = async (req, res) => {
    try {
        const normalizedEmail = req.body.email?.trim().toLowerCase()
        const user = await User.findOne({ email: normalizedEmail })
            .select("+verificationOtpHash +verificationOtpExpiresAt")

        if (!user || user.emailVerified) {
            return res.status(200).json({message:"If the account needs verification, a new code has been sent."})
        }

        const otp = String(crypto.randomInt(100000, 1000000))
        user.verificationOtpHash = crypto.createHash("sha256").update(otp).digest("hex")
        user.verificationOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
        await user.save()
        await sendVerificationOtp(normalizedEmail, otp)

        return res.status(200).json({message:"A new verification code has been sent."})
    } catch (error) {
        return res.status(500).json({message:`Resend verification error ${error}`})
    }
}