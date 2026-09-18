import multer from "multer";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: function(req, file , cb){
        cb(null , path.join(__dirname, "../public"))
    },
    filename: function(req , file , cb){
        const filename = `${crypto.randomUUID()}.pdf`;
        cb(null , filename)
    }
})


export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const isPdf = file.mimetype === "application/pdf" && path.extname(file.originalname).toLowerCase() === ".pdf";
        cb(isPdf ? null : new Error("Only PDF resumes are allowed"), isPdf);
    }
});