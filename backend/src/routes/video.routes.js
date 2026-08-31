import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    incrementVideoView,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import {optionalJwt, verifyJwt} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();
router
    .route("/")
    .get(optionalJwt, getAllVideos)
    .post(
        verifyJwt,
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
        ]),
        publishAVideo
    );

router
    .route("/:videoId")
    .get(optionalJwt, getVideoById)
    .delete(
        verifyJwt,
        deleteVideo
    )
    .patch(
        verifyJwt,
        upload.single("thumbnail"),
        updateVideo
    );

router
    .route("/:videoId/view")
    .post(optionalJwt, incrementVideoView);

router
    .route("/toggle/publish/:videoId")
    .patch(
        verifyJwt,
        togglePublishStatus
    );

export default router
