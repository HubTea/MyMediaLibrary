const express = require('express');
const crypto = require('crypto');

const errorHandler = require('./errorHandler');
const security = require('./securityService');
const digest = require('./digest');
const userRepository = require('./repository/userRepository');
const mediaRepository = require('./repository/mediaRepository');
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
        let userEntity = new userRepository.UserEntity();

        let userValueObject = await userEntity.createUser(userSeed);

        res.status(201);
        res.setHeader('Location', `/v1/users/${userValueObject.uuid}`);
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


router.put('/:userUuid/password', function(req, res){

});


router.get('/:userUuid/info', async function(req, res){
    try{
        let userUuid = req.params.userUuid;
        let userEntity = new userRepository.UserEntity();
        let userValueObject = await userEntity.getUserByUuid(userUuid);

        res.write(JSON.stringify({
            nickname: userValueObject.nickname || '',
            introduction: userValueObject.introduction || ''
        }));
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});


router.patch('/:userUuid/info', async function(req, res){
    try{
        let userUuid = req.params.userUuid;
        let userInfo = req.body;
        let nickname = userInfo.nickname;
        let introduction = userInfo.introduction;

        let authorizer = await checker.checkAuthorizationHeader(req);

        checker.checkUserAuthorization(authorizer, userUuid);

        let userEntity = new userRepository.UserEntity();
        let user = await userEntity.getUserByUuid(userUuid);

        user.nickname = nickname;
        user.introduction = introduction;
    
        await userEntity.updateUser(user);
    
        res.status(200);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});


router.post('/:userUuid/medias', async function(req, res){
    try{
        let userUuid = req.params.userUuid;
        let title = req.body.title;
        let description = req.body.description;
        let type = req.body.type;

        let authorizer = await checker.checkAuthorizationHeader(req);

        checker.checkUserAuthorization(authorizer, userUuid);

        let userEntity = new userRepository.UserEntity();
        let userValueObject = await userEntity.getUserByUuid(userUuid);

        let mediaEntity = new mediaRepository.MediaEntity();
        let mediaValueObject = await mediaEntity.createMetadata({
            title: title,
            description: description,
            type: type,
            uploaderId: userValueObject.id
        });

        res.status(201);
        res.setHeader('Location', `/v1/medias/${mediaValueObject.uuid}`);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
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