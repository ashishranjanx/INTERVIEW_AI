import jwt from "jsonwebtoken"

const genToken = async (userId, sessionId) => {
    try {
        const token = jwt.sign({userId, sessionId} , process.env.JWT_SECRET , {expiresIn:"7d", algorithm:"HS256"})
return token
    } catch (error) {
        console.log(error)
    }

}

export default genToken