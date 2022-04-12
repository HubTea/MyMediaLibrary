const express = require('express');
const jwt = require('jsonwebtoken');

const auth = require('./authorizer');
const serverConfig = require('./serverConfig');
const error = require('./error');
const {handleError} = require('./errorHandler');
const authentication = require('./digest');


const router = express.Router();


//로그인
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
        
        await replyAuth(req, res, digest, digestGenerator, user);
    }
    catch(err){
        handleError(res, err);
    }
});


/**
 * 유저를 인증하고 Authorizer 객체를 생성하여 응답으로 보냄.
 * @param {*} req 
 * @param {*} res 
 * @param {DigestPair} digest 
 * @param {DigestGenerator} digestGenerator 
 * @param {User} userPromise 
 */
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


/**
 * Authorizer 객체를 담은 jwt를 생성하여 응답으로 보냄.
 * @param {*} res 
 * @param {Authorizer} authorizer 
 * @returns {Promise<void>}
 */
async function sendAuthorizer(res, authorizer){
    return new Promise(function(resolve, reject){
        let payload = {
            authorizer: authorizer.export()
        };
        let privateKey = serverConfig.key.private.export({
            type: 'pkcs1',
            format: 'pem'
        });
        let options = {
            expiresIn: '7d'
        };


        jwt.sign(payload, privateKey, options,
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