const express = require('express');
const crypto = require('crypto');
const sequelize = require('sequelize');
const jwt = require('jsonwebtoken');

const error = require('./error');
const errorHandler = require('./errorHandler');
const security = require('./securityService');
const digest = require('./digest');
const authorizer = require('./authorizer');
const userRepository = require('./repository/userRepository');
const checker = require('./checker');

const router = express.Router();


//유저 등록
router.post('/', async function(req, res){
    try{
        let userSeed = await createUserSeed({
            accountId: req.body.accountId,
            accountPw: req.body.accountPassword,
            nickname: req.body.nickname
        });

        let newUser = await userRepository.createUser(userSeed);

        res.status(201);
        res.setHeader('Location', `/v1/users/${newUser.userId}`);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});

async function createUserSeed({accountId, accountPw, nickname}){
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
        hash: digestString,
        salt: saltString
    };
}


router.put('/:userId/password', function(req, res){

});


router.get('/:userId/info', async function(req, res){
    try{
        let userId = req.params.userId;
        let user = await userRepository.getUserByUserId(userId);

        res.write(JSON.stringify({
            nickname: user.nickname || '',
            introduction: user.introduction || '',
            thumbnailUrl: user.thumbnailUrl || ''
        }));
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});


router.patch('/:userId/info', async function(req, res){
    try{
        let userId = req.params.userId;
        let userInfo = req.body;
        let nickname = userInfo.nickname;
        let introduction = userInfo.introduction;

        let authorizer = await checker.checkAuthorizationHeader(req);

        checker.checkUserAuthorization(authorizer, userId);

        let user = await userRepository.getUserByUserId(userId);

        user.nickname = nickname;
        user.introduction = introduction;
    
        await userRepository.setUser(user);
    
        res.status(200);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
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


router.patch('/:userId/thumbnail');


module.exports = {
    router
};