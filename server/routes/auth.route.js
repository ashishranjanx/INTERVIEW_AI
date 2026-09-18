import express from "express"
import { googleAuth, registerWithPassword, loginWithPassword, verifyEmail, resendVerificationOtp, forgotPassword, resetPassword, logOut, getSessions, revokeSession, revokeOtherSessions } from "../controllers/auth.controller.js"
import isAuth from "../middlewares/isAuth.js"

const authRouter = express.Router()


authRouter.post("/google",googleAuth)
authRouter.post("/register",registerWithPassword)
authRouter.post("/login",loginWithPassword)
authRouter.post("/verify-email",verifyEmail)
authRouter.post("/resend-verification",resendVerificationOtp)
authRouter.post("/forgot-password",forgotPassword)
authRouter.post("/reset-password",resetPassword)
authRouter.get("/logout",isAuth,logOut)
authRouter.get("/sessions",isAuth,getSessions)
authRouter.delete("/sessions/:sessionId",isAuth,revokeSession)
authRouter.post("/sessions/revoke-others",isAuth,revokeOtherSessions)


export default authRouter