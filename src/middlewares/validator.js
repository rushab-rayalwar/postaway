//core

//third-party
import { body, validationResult } from "express-validator";

//custom

let rules = {
    registration: [
        body("email").isEmail().withMessage("Email is not valid"),
        body("password").isLength({ min: 5 }).withMessage("Password must be at least 5 characters long"),
    ],
    login: [
        body("email").isEmail().withMessage("Invalid email."),
        body("password").isString().withMessage("Invalid password.")
    ]
};

export async function validateRegistration(req,res,next){
    await Promise.all(rules.registration.map((rule) => rule.run(req)));
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errorMessages = errors.array().map(e=>e.msg);
        return res.status(400).json({success:false, errors:errorMessages});
    }
    next();
}

export async function validateLogin(req,res,next){
    await Promise.all(rules.login.map((rule) => rule.run(req)));
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        let errorMessages = errors.array().map(e=>e.msg);
        return res.status(400).json({success:false, errors:errorMessages});
    }
    next();
}