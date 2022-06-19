const express = require('express');
const jwt = require('jsonwebtoken');

const auth = require('./authorizer');
const serverConfig = require('./serverConfig');
const error = require('./error');
const digest = require('./digest');
const security = require('./securityService');


const router = express.Router();


//로그인
router.get('/', async function(req, res){
    let user;
    try{
        user = await serverConfig.model.User.findOne({
            attributes: ['userId'],
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

    const digestGenerator = security.digestGenerator;
    const digestPair = new digest.DatabaseDigestPair(req.body.accountId, digestGenerator);
    
    await replyAuth(req, res, digestPair, digestGenerator, user);
});


/**
 * 유저를 인증하고 Authorizer 객체를 생성하여 응답으로 보냄.
 * @param {*} req 
 * @param {*} res 
 * @param {DigestPair} digestPair 
 * @param {DigestGenerator} digestGenerator 
 * @param {User} userPromise 
 */
async function replyAuth(req, res, digestPair, userPromise){
    //인증
    if(await digestPair.isEqual(req.body.accountPassword) === false){
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
function sendAuthorizer(res, authorizer){
    return new Promise(function(resolve, reject){
        let payload = {
            authorizer: authorizer.export()
        };
        let privateKey = security.key.private.export({
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