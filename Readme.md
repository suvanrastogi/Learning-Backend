# Chai Aur Backend

A learning backend built with Node.js, Express, MongoDB, Mongoose, Multer, and Cloudinary. The currently implemented feature is user registration with avatar and optional cover-image uploads.

## Start here

The complete file map and connected request diagrams are in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

Read that file first, then use this README as the quick reference for running and reviewing the code.

## What is implemented?

```text
Client
	→ POST /api/v1/users/register
	→ Express app and global middleware
	→ Multer parses text fields and image files
	→ registerUser validates the request
	→ Cloudinary stores the images
	→ User model hashes the password
	→ MongoDB stores the user in videotube.users
	→ JSON response returns the safe user data
```

## Project structure

```text
src/
├── index.js                    # Loads configuration, connects DB, starts server
├── app.js                      # Express setup and route mounting
├── constants.js                # Shared values; DB_NAME is videotube
├── db/index.js                 # MongoDB connection
├── routes/user.routes.js       # POST /register route
├── controllers/user.controller.js
│                               # Registration workflow
├── middlewares/multer.middleware.js
│                               # Temporary multipart file storage
├── models/user.model.js        # User schema and password hashing
├── models/video.model.js       # Planned video model
└── utils/
		├── asyncHandler.js         # Async error forwarding
		├── apiError.js             # Custom error object
		├── apiResponse.js          # Standard response object
		└── cloudinary.js           # Image upload helper
```

## Setup

Install dependencies:

```text
npm install
```

Create `.env` in the project root. Keep real secrets out of Git:

```text
PORT=8000
MONGODB_URL=your_mongodb_connection_url
CORS_ORIGIN=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start development mode:

```text
npm run dev
```

The server listens on `PORT`, or `8000` when `PORT` is not set.

## Registration request

Send a `multipart/form-data` request to:

```text
POST http://localhost:8000/api/v1/users/register
```

Form fields:

| Field | Type | Required | Purpose |
| --- | --- | --- | --- |
| `fullname` | text | yes | User's display name |
| `email` | text | yes | Unique email |
| `username` | text | yes | Unique username |
| `password` | text | yes | Hashed before storage |
| `avatar` | file | yes | Main profile image |
| `coverImage` | file | no | Cover image |

The `avatar` and `coverImage` field names must match the names configured in `src/routes/user.routes.js`.

## Where data is stored

- Database: `videotube`
- User collection: `users`
- Temporary upload directory: `public/temp/`
- Final images: Cloudinary
- Stored image values: Cloudinary URLs
- Stored password: bcrypt hash, never the plain-text password

## How to study the flow

1. Start at `src/index.js` to see how the process begins.
2. Read `src/app.js` to see global middleware and route mounting.
3. Follow `/api/v1/users/register` in `src/routes/user.routes.js`.
4. Read Multer's `upload.fields(...)` configuration.
5. Trace validation and database work in `registerUser`.
6. Read `uploadCloudinary` to see temporary-file handling.
7. Read `user.model.js` to understand schema validation and password hashing.
8. Compare the final response with `ApiResponse`.

## Current known issues

See the detailed notes in [`ARCHITECTURE.md`](./ARCHITECTURE.md). The most important ones are:

- Remove the top-level test upload in `src/utils/cloudinary.js`; importing a module should not trigger a network upload.
- Import `Schema` or use `mongoose.Schema` in `src/models/video.model.js` before using that model.
- Avoid logging request data in production, especially passwords.
- Keep `.env` private and rotate credentials if they have been exposed.

## Reference

- [Original learning model](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)
- [Detailed architecture and diagrams](./ARCHITECTURE.md)

