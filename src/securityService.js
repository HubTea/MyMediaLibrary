const process = require('process');
const crypto = require('crypto');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const digest = require('./digest');
const error = require('./error');


let pbkdf2Option = {
    iteration: 30000,
    hash: 'sha512'
};

let digestOption = {
    digestLength: 32,
    saltByteLength: 18
};

let jwtOption = {
    algorithm: 'HS256',
    expiresIn: '7d'
};

const privateKey = crypto.createPrivateKey(
    fs.readFileSync(process.env.PrivateKeyPath)
);
const publicKey = crypto.createPublicKey(privateKey);
const hmacKey = fs.readFileSync(process.env.HmacKeyPath);
const key = {
    private: privateKey,
    public: publicKey,
    hmac: hmacKey
};

class JwtGenerator{
    constructor(){
        this.payload = null;
        this.resolve = null;
        this.reject = null;
    }

    generate(payload, key, option){
        this.payload = payload;
        this.key = key;
        this.option = option;
        return new Promise(this.fulfillGeneration.bind(this));
    }

    fulfillGeneration(resolve, reject){
        this.resolve = resolve;
        this.reject = reject;

        jwt.sign(this.payload, this.key, this.option, this.emitToken.bind(this));
    }

    emitToken(err, token){
        if(err){
            this.reject(new error.JwtSignFailedError(err));
            return;
        }

        this.resolve(token);
    }
}

class JwtVerifier{
    verify(token, key, option){
        this.token = token;
        this.key = key;
        this.option = option;

        return new Promise(this.fulfillVerification.bind(this));
    }

    fulfillVerification(resolve, reject){
        this.resolve = resolve;
        this.reject = reject;

        jwt.verify(this.token, this.key, this.option, this.emitPayload.bind(this));
    }

    emitPayload(err, payload){
        if(err){
            this.reject(new error.InvalidJwtError(err));
            return;
        }

        this.resolve(payload);
    }
}

module.exports = {
    pbkdf2Option,
    digestOption,
    jwtOption,
    key,
    JwtGenerator,
    JwtVerifier
};