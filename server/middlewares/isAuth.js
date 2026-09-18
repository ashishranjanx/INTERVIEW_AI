import jwt from "jsonwebtoken"
import Session from "../models/session.model.js"


const isAuth = async (req,res,next) => {
    try {
        let {token} = req.cookies

        if(!token){
            return res.status(401).json({message:"Authentication required"})
        }
        const verifyToken = jwt.verify(token , process.env.JWT_SECRET, { algorithms: ["HS256"] })
        
        if(!verifyToken){
            return res.status(401).json({message:"Invalid authentication token"})
        }
        req.userId = verifyToken.userId
        req.sessionId = verifyToken.sessionId

        if (req.sessionId) {
            const session = await Session.findOneAndUpdate(
                { sessionId: req.sessionId, userId: req.userId, revokedAt: null },
                { lastActiveAt: new Date() },
                { new: true }
            )

            if (!session) {
                return res.status(401).json({message:"This session is no longer active"})
            }
        }

        next()
   

    } catch (error) {
        return res.status(401).json({message:"Authentication failed"})
    }
    
}

export default isAuth