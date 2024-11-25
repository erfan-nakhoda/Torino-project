const autoBind = require("auto-bind");
const userModel = require("../Users/user.model");
const crypto = require('crypto');
const createHttpError = require("http-errors");
const AuthMessages = require("../../common/Messages/Auth.messages");

class AuthService {
    #Db;
    constructor() {
        autoBind(this)
        this.#Db = userModel
    }
    async SendOTP(number) {
        const user = await this.#Db.findOne({number});
        const otpCode = {
            code : crypto.randomInt(10000,99999),
            expiresIn : Date.now() + (1000 * 60 * 2)
        }

        if(!user) {
            const newUser = await this.#Db.create({number, otpCode});
            return newUser;
        }
        if(user?.otpCode?.expiresIn > Date.now()) throw new createHttpError.BadRequest(AuthMessages.OTPavailable);
        user.otpCode = otpCode;
        await user.save();
        return user;
        
    }
    async CheckOTP(code, number) {
        const user = await this.#Db.findOne({number});
        if(!user) throw new createHttpError.NotFound(AuthMessages.NotFound);
        if(user?.IsVerified) throw new createHttpError.BadRequest(AuthMessages.VerifiedAlready)
        if(user?.otpCode?.expiresIn < Date.now()) throw new createHttpError.BadRequest(AuthMessages.OTPnotAvailable);
        if(user?.otpCode?.code != code) throw new createHttpError.BadRequest(AuthMessages.OTPIncorrect);
        user.IsVerified = true;
        await user.save();
        return true;
    }
}

module.exports = new AuthService();