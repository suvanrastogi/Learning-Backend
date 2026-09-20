import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./apiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file hasbeen  uploaded successfully
    // console.log("file is uploaded on cloudinary", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (err) {
    //if localFilePath has appeared that means it is on server already . so catching an err after that we remove the file first
    fs.unlinkSync(localFilePath); //removes locally saved temporary file as upload operation got failed.
    return null;
  }
};

const deleteOldFileOnCloudinary = async (publicId) => {
  if (!publicId) return null;

  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    throw new ApiError(500, "Couldn't delete the old file");
  }
};
// cloudinary.uploader.upload("https://someting",
// { public_id: "" },
// function (error, result) { console.log(result); });

export { uploadCloudinary, deleteOldFileOnCloudinary };
