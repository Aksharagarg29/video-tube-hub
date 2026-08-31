import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});   

// Every upload path in this app (avatar, cover image, video, thumbnail) goes
// through uploadToCloudinary() below, so a missing/wrong credential here
// breaks all of them at once. Fail loudly at startup instead of only
// discovering it the first time someone tries to upload something.
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn(
        "⚠️  Cloudinary is not fully configured (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET). " +
        "Avatar, cover image, video, and thumbnail uploads will all fail until these are set in your .env."
    );
}

const uploadToCloudinary = async (localFilePath)=>{
    try{
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto",
        });
        await fs.promises.unlink(localFilePath);
        return response;
    } catch (error) {
        if (localFilePath && fs.existsSync(localFilePath)) {
            await fs.promises.unlink(localFilePath);
        }
        // Don't swallow this silently — without logging it, every failed
        // upload (bad credentials, oversized file, network issue, etc.)
        // just looks like a generic 400 with no way to diagnose it.
        console.error("Cloudinary upload failed:", error?.message || error);
        return null;
    }
}

const deleteOldImage = async (oldImage, resourceType = "image") => {
    try {
        if(!oldImage) return null;
        const url = oldImage.file;
        if (!url) return null 
            
        const urlParts = url.split("/");
        const publicId = urlParts.slice(-2).join("/").split(".")[0]; 
        await cloudinary.uploader.destroy(publicId,{
            resource_type: resourceType
        });

        
    } catch (error) {
        return null
    }
}

export {uploadToCloudinary, deleteOldImage};
