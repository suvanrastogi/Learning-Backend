import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  updateCoverImage,
  updateUserAvatar,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  // The frontend/Postman must send multipart fields named exactly "avatar"
  // and "coverImage". Multer then creates req.files.avatar and req.files.coverImage.
  upload.fields([
    { name: "avatar", maxCount: 1 },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser); //verifyJWT is a middleware just before controller

router.route("/refresh-access-token").post(refreshAccessToken);

// The frontend sends one file with field name "avatar"; Multer creates req.file.
router.route("/update-avatar").patch(upload.single("avatar"), updateUserAvatar);

// The frontend sends one file with field name "coverImage"; Multer creates req.file.
router
  .route("/update-coverimage")
  .patch(upload.single("coverImage"), updateCoverImage);

export default router;
