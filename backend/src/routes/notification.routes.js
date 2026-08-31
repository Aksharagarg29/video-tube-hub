import { Router } from "express";
import {
    getNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from "../controllers/notification.controller.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

router.route("/").get(getNotifications);
router.route("/unread-count").get(getUnreadCount);
router.route("/read-all").patch(markAllNotificationsAsRead);
router.route("/:notificationId/read").patch(markNotificationAsRead);

export default router