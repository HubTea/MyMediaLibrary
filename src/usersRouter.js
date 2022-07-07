const express = require('express');
const crypto = require('crypto');
const sequelize = require('sequelize');

const serverConfig = require('./serverConfig');
const error = require('./error');
const errorHandler = require('./errorHandler');
const security = require('./securityService');
const digest = require('./digest');

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
    let userId = req.userId;

    let user = await serverConfig.model.User.findOne({
        attributes: ['nickname', 'description', 'thumbnailUrl'],
        where: {
            userID: userId
        }
    });

    if(user === null){
        throw new error.UserNotExistError(null);
    }

    res.write(JSON.stringify({
        nickname: user.nickname,
        description: user.description,
        thmbnailUrl: user.thumbnailUrl
    }));
    res.end();
});


router.patch('/:userId/info', async function(req, res){
    let userId = req.userId;
    let userInfo = req.body;
    let nickname = userInfo.nickname;
    let description = userInfo.description;

    let user = serverConfig.model.User.findOne({
        where: {
            userID: userId
        }
    });

    if(user === null){
        throw new error.UserNotExistError(null);
    }

    user.nickname = nickname;
    user.description = description;

    await user.save();
});


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


module.exports = {
    router
};