const express = require('express');

const auth = require('./authorizer');
const error = require('./error');
const errorHandler = require('./errorHandler');
const digest = require('./digest');
const security = require('./securityService');
const userRepository = require('./repository/userRepository');
const checker = require('./checker');


const router = express.Router();


//로그인
router.post('/', async function(req, res){
    try{
        let accountId = checker.checkAccountId(req.body.accountId, 'accountId');
        let accountPassword = checker.checkAccountPassword(req.body.accountPassword, 'accountPassword');
        let userEntity = new userRepository.UserEntity();
        let user = await userEntity.getUserByAccountId(accountId);

        const digestGenerator = new digest.Pbkdf2DigestGenerator(
            security.pbkdf2Option.iteration,
            security.pbkdf2Option.hash,
            security.digestOption.digestLength
        );
        const digestPair = new digest.DatabaseDigestPair(accountId, digestGenerator);
        
        if(await digestPair.isEqual(accountPassword) === false){
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
            userUuid: user.uuid,
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