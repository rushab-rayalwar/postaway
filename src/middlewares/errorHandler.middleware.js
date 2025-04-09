//core

//third-party

//custom

export class ApplicationError extends Error{
    constructor(errCode,errMessage){
        super(errMessage);
        this.errorCode = errCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export function handleError(err,req,res,next) {
    if(err instanceof ApplicationError){
    console.error("ApplicationError caught in errorHandler middleware - ", err);
        return res.status(err.errorCode).json({
            errors:["Something went wrong!"],
            success:false
        });
    }

    console.error("UnexpectedError - ", err);
    res.status(500).json({
        errors:["Something went wrong!"],
        success:false
    });
}