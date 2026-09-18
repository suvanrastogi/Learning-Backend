// files will come through a file system . 
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

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
            resource_type: "auto"
        })
        //file hasbeen  uploaded successfully
        console.log("file is uploaded on cloudinary", response.url);
        return response;
    } catch (err) {
        //if localFilePath has appeared that means it is on server already . so catching an err after that we remove the file first 
        fs.unlinkSync(localFilePath)//removes locally saved temporary file as upload operation got failed.
        return null;
    }
}

cloudinary.v2.uploader.upload("https://someting",
    { public_id: "" },
    function (error, result) { console.log(result); });


export{uploadCloudinary}