import multer from "multer";
import crypto from "node:crypto";

// Multer handles multipart/form-data file uploads before the controller runs.
// The uploaded files are temporarily saved here so Cloudinary can read them.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    // file.fieldname is the field name sent by the frontend, such as "avatar".
    crypto.randomBytes(16, function (err, raw) {
      if (err) return cb(err);
      cb(null, file.fieldname + "-" + raw.toString("hex"));
    });
  },
});

// The exported upload object is used by routes to choose single or multiple files.
export const upload = multer({ storage });

/*
  Complete Multer flow:

  1. The frontend/Postman sends a multipart/form-data request, for example:

       avatar: <image file>
       coverImage: <image file>

     These are multipart field names, not normal JSON fields.

  2. The route tells Multer which file field names are allowed:

       upload.single("avatar")
       // accepts one file and creates req.file

       upload.fields([
         { name: "avatar", maxCount: 1 },
         { name: "coverImage", maxCount: 1 }
       ])
       // accepts named files and creates req.files

  3. Multer reads the multipart request and matches each incoming field name
     with the names configured in the route. If a name is not allowed, Multer
     rejects the upload.

  4. For every accepted file, Multer calls destination() and filename().
     The file is saved in public/temp with a generated filename. Multer then
     stores information about that saved file on the request object.

  5. With upload.single("avatar"):

       req.file = {
         fieldname: "avatar",
         path: "public/temp/avatar-...",
         originalname: "photo.jpg",
         mimetype: "image/jpeg",
         ...
       }

     With upload.fields(...):

       req.files = {
         avatar: [{ path: "public/temp/avatar-...", ... }],
         coverImage: [{ path: "public/temp/coverImage-...", ... }]
       }

  6. After Multer finishes, it calls next(). Express then runs the controller.
     The controller reads req.file.path or req.files.avatar[0].path and sends
     the temporary file to Cloudinary.

  Multer does not send a response to the browser and does not save anything
  directly to MongoDB. It prepares the request and passes control onward.
*/
