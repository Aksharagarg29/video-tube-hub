import crypto from "crypto";
import path from "path";
import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp'); //cb = callback 
    },
    filename: function (req, file, cb) {
        cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
    }
})

export const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) return cb(null, true);
        return cb(new Error("Only image and video uploads are allowed"));
    },
})
