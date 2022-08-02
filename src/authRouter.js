const express = require('express');
const jwt = require('jsonwebtoken');

const auth = require('./authorizer');
const error = require('./error');
const errorHandler = require('./errorHandler');
const digest = require('./digest');
const security = require('./securityService');
const userRepository = require('./repository/userRepository');


const router = express.Router();


//로그인
router.post('/', async function(req, res){
    try{
        let accountId = req.body.accountId;
        let userEntity = new userRepository.UserEntity();
        let user = await userEntity.getUserByAccountId(accountId);

        const digestGenerator = new digest.Pbkdf2DigestGenerator(
            security.pbkdf2Option.iteration,
            security.pbkdf2Option.hash,
            security.digestOption.digestLength
        );
        const digestPair = new digest.DatabaseDigestPair(accountId, digestGenerator);
        
        if(await digestPair.isEqual(req.body.accountPassword) === false){
            throw new error.PasswordNotMatchError(null);
        }
    
        const authorizer = new auth.Authorizer({});
    
        authorizer.setAccessibleUser(user.uuid);
    
        let jwtGenerator = new security.JwtGenerator();
        let payload = {
            authorizer: authorizer.export()
        };
        let key = security.key.hmac;
        let option = {
            algorithm: security.jwtOption.algorithm,
            expiresIn: security.jwtOption.expiresIn
        };
        let token = await jwtGenerator.generate(payload, key, option);

        res.write(JSON.stringify({
            token: token
        }));
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});

module.exports = {
    router
};