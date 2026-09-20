import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import {
  deleteOldFileOnCloudinary,
  uploadCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    if (!accessToken || !refreshToken) {
      throw new ApiError(500, "Token could not be generated");
    }

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    console.log(err);
    throw err instanceof ApiError
      ? err
      : new ApiError(500, err?.message || "Token generation failed");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation
  //check if user already exists: username,email
  //check for images, check for avatar
  //upload them to cloudinary, avatar
  //create user object - create entry in db
  //remove password and refresh token field from response
  //check for user creation
  //return res

  const { fullname, email, username, password } = req.body;
  console.log(email);

  if (
    [fullname, email, username, password].some((field) => {
      return field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "all field are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist");
  }

  console.log("consoling req.files", req.files);
  console.log("consoling req.body", req.body);

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadCloudinary(avatarLocalPath);
  const coverImage = await uploadCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: {
      url: avatar.url,
      publicId: avatar.public_id,
    },
    coverImage: {
      url: coverImage?.url || "",
      publicId: coverImage?.public_id || "",
    },
    email,
    password,
    username: username.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res, next) => {
  //req body -> take data
  //username or email
  //find the user
  //password check
  //access and refreshToken generate
  //send the Token in cookies
  //send a response of successfull Login

  const { username, email, password } = req.body;

  if ([{ username }, { email }].some((field) => !field)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }], //finds based on any one of them
  });

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshTokens(
    user._id
  );

  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.refreshToken;

  // or we can also use

  // const userObject=await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true,
    //above two settings allow cookies to be only modified through server/backend
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: userObject,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res, next) => {
  //we cannot logout anyone through thier email or anything, orelse anyone would logout anyone
  await User.findByIdAndUpdate(
    req.user._id, //findbyid
    {
      //update
      $set: {
        refreshToken: undefined,
      },
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User loggedout successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res, next) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "refresh token is missing");
  }

  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded?._id);

    if (!user || user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const newAccessToken = user.generateAccessToken();

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", newAccessToken, options)
      .json(new ApiResponse(200, {}, "Access token refreshed"));
  } catch (err) {
    throw new ApiError(401, err?.message || "Invalid refresh token");
  }
});

const changeCurrentUserPassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res, next) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res, next) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // upload.single("avatar") places the uploaded file in req.file.
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is missing");
  }

  const user = await User.findById(req.user._id);
  const oldAvatarPublicId = user?.avatar?.publicId;
  const avatar = await uploadCloudinary(avatarLocalPath);

  if (!avatar?.url) {
    throw new ApiError(400, "error while uploading on avatar");
  }

  if (oldAvatarPublicId) {
    await deleteOldFileOnCloudinary(oldAvatarPublicId);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        "avatar.url": avatar.url,
        "avatar.publicId": avatar.public_id,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "avatar updated successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  // upload.single("coverImage") also uses req.file because only one file is accepted.
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "coverImage file is missing");
  }

  const user = await User.findById(req.user._id);
  const oldCoverImagePublicId = user?.coverImage?.publicId;
  const coverImage = await uploadCloudinary(coverImageLocalPath);

  if (!coverImage?.url) {
    throw new ApiError(400, "error while uploading on coverImage");
  }

  if (oldCoverImagePublicId) {
    await deleteOldFileOnCloudinary(oldCoverImagePublicId);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        "coverImage.url": coverImage.url,
        "coverImage.publicId": coverImage.public_id,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Cover image updated successfully")
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateCoverImage,
};
