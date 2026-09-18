import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    deviceLabel: {
        type: String,
        default: "Unknown device"
    },
    userAgent: String,
    ipAddress: String,
    lastActiveAt: {
        type: Date,
        default: Date.now
    },
    revokedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const Session = mongoose.model("Session", sessionSchema);

export default Session;
