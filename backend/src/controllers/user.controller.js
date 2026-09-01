import mongoose from 'mongoose';
import { OAuth2Client } from "google-auth-library";
import {asyncHandler} from '../utils/asyncHandler.js';
import {APIerror} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadToCloudinary, deleteOldImage} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiResponse.js"
import jwt from "jsonwebtoken";

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

// Cookie options used everywhere we set/clear the accessToken and refreshToken cookies.
// sameSite: "none" + secure: true is required for cross-site cookies to work
// (frontend on vercel.app, backend on onrender.com are different sites).
// Hardcoded rather than relying on NODE_ENV, since that isn't guaranteed to be set on the host.
const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
};

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new APIerror(500, "something went wrong while generating tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //get user details
    //validations - not null
    //user already exist : username, email
    //check for images - avatar(required) and coverimage
    //upload them to cloudinary
    //create user entry in db
    //remove pswd and refresh token from res to user
    //check for user creation
    //return res
    
    const {fullName, email, userName, password} = req.body;
    if (!userName?.trim()) {
        throw new APIerror(400, "Username is required");
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;

    if (!usernameRegex.test(userName.trim())) {
        throw new APIerror(
            400,
            "Username can only contain letters, numbers, underscores and hyphens."
        );
    }

    if(
        [fullName, email, userName, password].some((field)=>field?.trim() === "")
    ){
        throw new APIerror(400, "Fields should not be empty");
    }

    const existedUser = await User.findOne({
        $or: [{ userName },{ email }]
    })

    if(existedUser){
        throw new APIerror(409, "User with this email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path

    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new APIerror(400, "Avatar file is required");
    }

    const avatar = await uploadToCloudinary(avatarLocalPath);
    const coverImage = await uploadToCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new APIerror(400, "Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        userName: userName.toLowerCase(),
        email,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new APIerror(500, "Something went wrong while registering the user");
    }
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    //get username or email from the use
    //check if this username exists in db - no->throw error of register first
    //yes -> password check
    //accesstoken and refreshtoken 
    //send them through cookies
    //when accesstoken expires, get password info from rereshtoken


    const {userName, email, password} = req.body;
    if(!(userName || email)){
        throw new APIerror(400, "username or email is required")
    }
    const user = await User.findOne({
        $or: [{userName}, {email}]
    })
    if(!user){
        throw new APIerror(404, "user not registered")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new APIerror(404, "password is incorrect")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "Logged in Successfully"
        )
    )


})

const googleLogin = asyncHandler(async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            throw new APIerror(400, "Google credential is required");
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload) {
            throw new APIerror(401, "Invalid Google credential");
        }

        const {
            sub: googleId,
            email,
            name,
            picture,
            email_verified,
        } = payload;

        if (!email || !email_verified) {
            throw new APIerror(
                401,
                "Google email could not be verified"
            );
        }

        // Check if Google account already exists
        // Check if Google account already exists
        let user = await User.findOne({ googleId });

        // If Google account doesn't exist,
        // check whether this email already has an account.
        if (!user) {
            user = await User.findOne({ email });

            if (user) {
                user.googleId = googleId;

                // If this account doesn't have a proper avatar,
                // use Google's profile picture.
                if (
                    picture &&
                    (!user.avatar ||
                        user.avatar === "https://placehold.co/150x150" ||
                        user.avatar === "https://via.placeholder.com/150")
                ) {
                    user.avatar = picture;
                }

                await user.save({
                    validateBeforeSave: false,
                });
            }
        }

        // Create a new Google user
        if (!user) {
            let baseUsername = email
                .split("@")[0]
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");

            if (!baseUsername) {
                baseUsername = "user";
            }

            let userName = baseUsername;
            let counter = 1;

            // Make username unique
            while (await User.findOne({ userName })) {
                userName = `${baseUsername}${counter}`;
                counter++;
            }

            user = await User.create({
                userName,
                email: email.toLowerCase(),
                fullName: name || "Google User",
                googleId,
                authProvider: "google",

                // Use Google profile picture
                avatar: picture || "https://placehold.co/150x150",

                coverImage: "",
            });
        }

        // Generate your existing JWT tokens
        const {
            accessToken,
            refreshToken,
        } = await generateAccessAndRefreshToken(user._id);

        // Remove sensitive fields
        const loggedInUser = await User.findById(user._id)
            .select("-password -refreshToken");

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser,
                        accessToken,
                        refreshToken,
                    },
                    "Google login successful"
                )
            );
    } catch (error) {
        if (error instanceof APIerror) throw error;
        throw new APIerror(500, "Something went wrong during Google login");
    }
});

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $unset:{
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    return res.status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
        new ApiResponse(200, {}, "User Logged Out")
    )
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new APIerror(401, "Unauthorized request");
    }
    
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new APIerror(401, "Invalid refresh token")
        }

        if(incomingRefreshToken !== user?.refreshToken){
            throw new APIerror(401, "Refresh token is expired or used")
        }
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
        return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new APIerror(401, error?.message || "Invalid refresh Token")
    }


})

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new APIerror(
            400,
            "Current password and new password are required."
        );
    }

    if (newPassword.length < 6) {
        throw new APIerror(
            400,
            "New password must be at least 6 characters."
        );
    }

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new APIerror(404, "User not found.");
    }

    // Google accounts don't have an application password
    if (user.authProvider === "google" || !user.password) {
        throw new APIerror(
            400,
            "This account uses Google Sign-In. Password changes are managed by Google."
        );
    }

    const isCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isCorrect) {
        throw new APIerror(
            401,
            "Current password is incorrect."
        );
    }

    user.password = newPassword;

    await user.save({
        validateBeforeSave: false
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed successfully."
            )
        );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "Current user fetched successfully")
    ) 
})

const updateAccoutDetails = asyncHandler(async (req, res) => {

    const { fullName, userName } = req.body;

    if (!fullName?.trim() || !userName?.trim()) {
        throw new APIerror(
            400,
            "Full name and username are required"
        );
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;

    if (!usernameRegex.test(userName.trim())) {
        throw new APIerror(
            400,
            "Username can only contain letters, numbers, underscores and hyphens."
        );
    }

    const existingUser = await User.findOne({
        userName: userName.trim().toLowerCase(),
        _id: { $ne: req.user._id }
    });

    if (existingUser) {
        throw new APIerror(
            400,
            "Username is already taken."
        );
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName: fullName.trim(),
                userName: userName.trim().toLowerCase()
            }
        },
        {
            new: true,
            runValidators: true
        }
    ).select("-password");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Account details updated successfully"
            )
        );
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    const oldImage = await User.findById(req.user?._id).select("avatar");

    if(!avatarLocalPath){
        throw new APIerror(400, "Avatar not found");
    }
    const avatar = await uploadToCloudinary(avatarLocalPath);
    if(!avatar){
        throw new APIerror(400, "Something went wrong while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    await deleteOldImage({ file: oldImage?.avatar })
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    const oldImage = await User.findById(req.user?._id).select("coverImage");

    if(!coverImageLocalPath){
        throw new APIerror(400, "Cover Image not found");
    }
    const coverImage = await uploadToCloudinary(coverImageLocalPath);
    if(!coverImage){
        throw new APIerror(400, "Something went wrong while uploading cover image");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        }, 
        {new: true}
    ).select("-password")

    await deleteOldImage({ file: oldImage?.coverImage });
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {userName} = req.params;

    if(!userName?.trim()){
        throw new APIerror(400, "Username is missing");

    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase()
            }
        },
        {
            $lookup: {
                // NOTE: the Subscription model is registered as "Subsciption" (typo)
                // so mongoose pluralizes it to "subsciptions", not "subscriptions".
                // See backend/src/models/subscription.model.js for details.
                from: "subsciptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subsciptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        }, 
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond:{
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                userName: 1,
                fullName: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                authProvider: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])
    if(!channel?.length){
        throw new APIerror(400, "Channel not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )

})

const getUserWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        userName: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: "likes",
                            let: { videoId: "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: { $eq: ["$video", "$$videoId"] }
                                    }
                                },
                                { $count: "count" }
                            ],
                            as: "likeData"
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            },
                            likeCount: {
                                $ifNull: [
                                    { $arrayElemAt: ["$likeData.count", 0] },
                                    0
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            likeData: 0
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "WatchHistory fetched successfully")
    )
})

export { 
    registerUser,
    loginUser, 
    googleLogin,
    logOutUser, 
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccoutDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory
}