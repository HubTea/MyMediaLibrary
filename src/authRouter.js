const express = require('express');
const jwt = require('jsonwebtoken');

const auth = require('./authorizer');
const serverConfig = require('./serverConfig');
const error = require('./error');
const {handleError} = require('./errorHandler');
const authentication = require('./digest');


const router = express.Router();


router.get('/', async function(req, res){
    try{
        let user;
        try{
            user = await serverConfig.model.User.findOne({
                attributes: ['userId', 'accountPasswordHash', 'accountPasswordSalt'],
                where: {
                    accountId: req.body.accountId
                }
            });
        }
        catch(err){
            throw new error.InternalError(err);
        }

        if(user === null){
            throw error.UserNotExistError(null);
        }

        const digest = new authentication.ConstantDigestPair(
            Buffer.from(user.accountPasswordHash, 'base64'), 
            user.accountPasswordSalt
        );
        const digestGenerator = new authentication.Pbkdf2DigestGenerator(
            serverConfig.pbkdf2.iteration, serverConfig.pbkdf2.hash
        );
        
        replyAuth(req, res, digest, digestGenerator, user);
    }
    catch(err){
        handleError(res, err);
    }
});


async function replyAuth(req, res, digest, digestGenerator, userPromise){
    //인증
    if(await digest.isEqual(req.body.accountPassword, digestGenerator) === false){
        throw new error.PasswordNotMatchError(null);
    }

    //권한 부여
    const authorizer = new auth.Authorizer({});
    const user = await userPromise;

    authorizer.setAccessibleUser(user.userId);

    await sendAuthorizer(res, authorizer);
}


async function sendAuthorizer(res, authorizer){
    return new Promise(function(resolve, reject){
        jwt.sign(
            {
                authorizer: authorizer.export()
            }, 

            serverConfig.key.private, 

            {
                expiresIn: '7d'
            },

            function(err, token){
                if(err){
                    reject(new error.JwtSignFailedError(err));
                    return;
                }

                res.write(JSON.stringify({
                    token
                }));
                res.end();
                resolve();
            }
        );
    });
}


module.exports = {
    router
};