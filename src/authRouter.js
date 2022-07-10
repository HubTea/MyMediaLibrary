const express = require('express');
const jwt = require('jsonwebtoken');
const sequelize = require('sequelize');

const auth = require('./authorizer');
const serverConfig = require('./serverConfig');
const error = require('./error');
const errorHandler = require('./errorHandler');
const digest = require('./digest');
const security = require('./securityService');


const router = express.Router();


//로그인
router.post('/', async function(req, res){
    try{
        let accountId = req.body.accountId;
        let userId = await getUserIdFromAccountId(accountId);

        const digestGenerator = security.digestGenerator;
        const digestPair = new digest.DatabaseDigestPair(accountId, digestGenerator);
        
        await replyAuth(req, res, digestPair, userId);
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});

async function getUserIdFromAccountId(accountId){
    try{
        user = await serverConfig.model.User.findOne({
            attributes: ['userId'],
            where: {
                accountId: accountId
            }
        });
    }
    catch(userFindError){
        wrapUserFindError(userFindError);
    }

    if(user === null){
        throw new error.UserNotExistError(null);
    }

    return user.userId;
}

function wrapUserFindError(userFindError){
    if(userFindError instanceof sequelize.BaseError){
        throw new error.DatabaseError(userFindError);
    }
    else{
        throw userFindError;
    }
}


/**
 * 유저를 인증하고 Authorizer 객체를 생성하여 응답으로 보냄.
 * @param {*} req 
 * @param {*} res 
 * @param {DigestPair} digestPair 
 * @param {DigestGenerator} digestGenerator 
 * @param {String} userId 
 */
async function replyAuth(req, res, digestPair, userId){
    //인증
    if(await digestPair.isEqual(req.body.accountPassword) === false){
        throw new error.PasswordNotMatchError(null);
    }

    //권한 부여
    const authorizer = new auth.Authorizer({});

    authorizer.setAccessibleUser(userId);

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
        let key = security.key.hmac;
        let options = {
            algorithm: 'HS256',
            expiresIn: '7d'
        };

        jwt.sign(payload, key, options,
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