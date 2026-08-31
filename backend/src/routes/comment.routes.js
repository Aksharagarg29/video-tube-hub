import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import {optionalJwt, verifyJwt} from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/:videoId").get(optionalJwt, getVideoComments).post(verifyJwt, addComment);
router.route("/c/:commentId").delete(verifyJwt, deleteComment).patch(verifyJwt, updateComment);

export default router
