const express = require('express');
const crypto = require('crypto');
const sequelize = require('sequelize');
const jwt = require('jsonwebtoken');

const serverConfig = require('./serverConfig');
const error = require('./error');
const errorHandler = require('./errorHandler');
const security = require('./securityService');
const digest = require('./digest');
const authorizer = require('./authorizer');

const router = express.Router();


//유저 등록
router.post('/', async function(req, res){
    let userObject = await createUserObject({
        accountId: req.body.accountId,
        accountPw: req.body.accountPassword,
        nickname: req.body.nickname
    });
    
    try{
        let newUser = await registerUser(userObject);

        res.status(201);
        res.setHeader('Location', '/v1/users/' + newUser.userId);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});

async function createUserObject({accountId, accountPw, nickname}){
    let digestGenerator = security.digestGenerator;

    let randomBytes = crypto.randomBytes(security.digestOption.saltByteLength);
    let salt = new digest.Codec();
    salt.setBuffer(randomBytes);

    let saltString = salt.getBase64();

    let generatedDigest = await digestGenerator.generateDigest(accountPw, salt);
    let digestString = generatedDigest.getBase64();

    return {
        accountId: accountId,
        nickname: nickname,
        accountPasswordHash: digestString,
        accountPasswordSalt: saltString
    };
}

async function registerUser(userObject){
    try{
        let newUser = await serverConfig.model.User.create(userObject);
        return newUser;
    }
    catch(userCreationError){
        handleUserCreationError(userCreationError);
    }
}

function handleUserCreationError(userCreationError){
    if(userCreationError instanceof sequelize.UniqueConstraintError){
        throw new error.UserAlreadyExistError(userCreationError);
    }
    else if (userCreationError instanceof sequelize.BaseError){
        throw new error.DatabaseError(userCreationError);
    }
    else{
        throw userCreationError;
    }
}


router.put('/:userId/password', function(req, res){

});


router.get('/:userId/info', async function(req, res){
    let userId = req.params.userId;

    try{
        let user = await getUserInstance(userId, ['nickname', 'introduction', 'thumbnailUrl']);

        if(!user.nickname){
            user.nickname = '';
        }

        if(!user.introduction){
            user.introduction = '';
        }

        if(!user.thumbnailUrl){
            user.thumbnailUrl = '';
        }

        res.write(JSON.stringify({
            nickname: user.nickname,
            introduction: user.introduction,
            thumbnailUrl: user.thumbnailUrl
        }));
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});


router.patch('/:userId/info', async function(req, res){
    let userId = req.params.userId;
    let userInfo = req.body;
    let nickname = userInfo.nickname;
    let introduction = userInfo.introduction;

    //이 부분은 별도 미들웨어로 분리할 것
    try{
        let token = req.get('Authorization');
        if(!token){
            throw new error.OmittedParameterError().appendParameter('Authorization header');
        }

        let tokenObject = await getTokenPayload(token);
        let auth = new authorizer.Authorizer(tokenObject.authorizer);

        if(!auth.testUserAccessibility(userId)){
            throw new error.InvalidJwtError(null);
        }
    }
    catch(err){
        errorHandler.handleError(res, err);
        return;
    }
    
    try{
        let user = await getUserInstance(userId, ['userId', 'nickname', 'introduction']);

        user.nickname = nickname;
        user.introduction = introduction;
    
        await user.save();
    
        res.status(200);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});

function getTokenPayload(token){
    return new Promise(function(resolve, reject){
        jwt.verify(
            token, security.key.hmac, 
            {
                algorithms: 'HS256'
            }, 
            function(err, decoded){
                if(err){
                    reject(err);
                }

                resolve(decoded);
            }
        );
    });
}

async function getUserInstance(userId, attributes){
    let user;
    try{
        user = await serverConfig.model.User.findOne({
            attributes: attributes,
            where: {
                userId: userId
            }
        });
    }
    catch(userFindError){
        wrapUserFindError(userFindError);
    }

    if(user === null){
        throw new error.UserNotExistError(null);
    }

    return user;
}

function wrapUserFindError(userFindError){
    if(userFindError instanceof sequelize.BaseError){
        throw new error.DatabaseError(userFindError);
    }
    else{
        throw userFindError;
    }
}

router.post('/:userId/medias', function(req, res){

});


router.get('/:userId/medias', function(req, res){
    
});


router.get('/:userId/subscribers', function(req, res){

});


router.get('/:userId/bookmarks', function(req, res){

});


router.get('/:userId/comments', function(req, res){

});


router.patch('/:userId/thumbnail');


module.exports = {
    router
};