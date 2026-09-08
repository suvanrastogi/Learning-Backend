// const asyncHandler = () => {
    

// }

export { asyncHandler }

/*try catch style*/
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(error.code || 500).json({success:false,message:error.message})
//     }
// }

/*promise style*/
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).reject((err) => next(err));
    };
};

export { asyncHandler };