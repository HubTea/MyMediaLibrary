const express = require('express');
const crypto = require('crypto');
const sequelize = require('sequelize');

const errorHandler = require('./errorHandler');
const security = require('./securityService');
const digest = require('./digest');
const userRepository = require('./repository/userRepository');
const mediaRepository = require('./repository/mediaRepository');
const mediaListRepository = require('./repository/mediaListRepository');
const followingListRepository = require('./repository/followingListRepository');
const bookmarkRepository = require('./repository/bookmarkRepository');
const checker = require('./checker');
const serverConfig = require('./serverConfig');
const pagination = require('./pagination');

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
    let digestGenerator = new digest.Pbkdf2DigestGenerator(
        security.pbkdf2Option.iteration,
        security.pbkdf2Option.hash,
        security.digestOption.digestLength
    );

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


router.get('/:userUuid/medias', async function(req, res){
    try{
        let userUuid = checker.checkUuid(req.params.userUuid, 'user uuid');
        let length = checker.checkPaginationLength(req.query.length, 'length');
        let [date, random] = checker.checkDateRandomCursor(req.query.cursor, '_', pagination.endingDate, 'cursor');

        let paginator = new pagination.Paginator({
            length: length,
            mapper: function (myUpload){
                return {
                    uuid: myUpload.uuid,
                    title: myUpload.title,
                    type: myUpload.type,
                    updateTime: myUpload.updateTime,
                    viewCount: myUpload.viewCount,
                    dislikeCount: myUpload.dislikeCount
                };
            },
            cursorFactory: function(myUpload){
                let nextTime = myUpload.updateTime.getTime();
                let nextRandom = myUpload.random;
    
                return `${nextTime}_${nextRandom}`;
            }
        });

        let user = new userRepository.UserEntity();
        let userValueObject = await user.getUserByUuid(userUuid);

        let myUploadList = await mediaListRepository.getLatestUploadList(
            userValueObject.id, date, random, paginator.getRequiredLength()
        );

        let resBody = paginator.buildResponseBody(myUploadList);
    
        res.set('Content-Type', 'application/json');
        res.write(JSON.stringify(resBody));
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});


router.get('/:userUuid/following', async function(req, res){
    let userUuid = checker.checkUuid(req.params.userUuid, 'user uuid');
    let length = checker.checkPaginationLength(req.query.length, 'length');
    let order = checker.checkOrderCursor(req.query.cursor, pagination.maximumOrder, 'cursor');
    let paginator = new pagination.Paginator({
        length: length,
        mapper: function(subscribeInfo){
            let uploader = subscribeInfo.SubscribedUploader;
            return {
                uuid: uploader.uuid,
                nickname: uploader.nickname
            };
        },
        cursorFactory: function(subscribeInfo){
            return subscribeInfo.order.toString();
        }
    });
    let userEntity = new userRepository.UserEntity();
    let userValueObject = await userEntity.getUserByUuid(userUuid);

    let uploaderList = await followingListRepository.getFollowingUserDescendingList(
        userValueObject.id, order, paginator.getRequiredLength()
    );

    let resBody = paginator.buildResponseBody(uploaderList);

    res.set('Content-Type', 'application/json');
    res.write(JSON.stringify(resBody, null, 5));
    res.end();
});

router.post('/:userUuid/following', async function(req, res){
    try{
        let userUuid = checker.checkUuid(req.params.userUuid, 'user uuid');
        let authorizer = await checker.checkAuthorizationHeader(req);

        checker.checkUserAuthorization(authorizer, userUuid);

        let uploaderUuid = checker.checkUuid(req.body.uploaderUuid, 'uploader uuid');
        
        let uploaderEntity = new userRepository.UserEntity();
        let uploaderValueObjectPromise = uploaderEntity.getUserByUuid(uploaderUuid);

        let subscriberEntity = new userRepository.UserEntity();
        let subscriberValueObjectPromise = subscriberEntity.getUserByUuid(userUuid);

        let uploaderValueObject = await uploaderValueObjectPromise;
        let subscriberValueObject = await subscriberValueObjectPromise;

        try{
            await serverConfig.model.Subscribe.create({
                uploaderId: uploaderValueObject.id,
                subscriberId: subscriberValueObject.id
            });
        }
        catch(err){
            if(err instanceof sequelize.UniqueConstraintError){
                //아무것도 안 함.
            }
            else{
                throw error.wrapSequelizeError(err);
            }
        }
        
        res.status(200).end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});


router.get('/:userUuid/bookmarks', async function(req, res){
    try{
        let userUuid = checker.checkUuid(req.params.userUuid, 'user uuid');
        let length = checker.checkPaginationLength(req.query.length, 'length');
        let order = checker.checkOrderCursor(req.query.cursor, pagination.maximumOrder, 'order');

        let paginator = new pagination.Paginator({
            length: length,
            mapper: function(bookmarkInstance){
                let collection = bookmarkInstance.Media;

                return {
                    uuid: collection.uuid,
                    title: collection.title,
                    type: collection.type,
                    updateTime: collection.updateTime,
                    viewCount: collection.viewCount,
                    dislikeCount: collection.dislikeCount,
                    uploader: {
                        uuid: collection.Uploader.uuid,
                        nickname: collection.Uploader.nickname
                    }
                };
            },
            cursorFactory: function(bookmarkInstance){
                return bookmarkInstance.order.toString();
            }
        });

        let userEntity = new userRepository.UserEntity();
        let userValueObject = await userEntity.getUserByUuid(userUuid);

        let bookmarkList = await bookmarkRepository.getBookmarkList(
            userValueObject.id, order, paginator.getRequiredLength()
        );

        let resBody = paginator.buildResponseBody(bookmarkList);

        res.json(resBody);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});

router.post('/:userUuid/bookmarks', async function(req, res){
    try{
        let userUuid = checker.checkUuid(req.params.userUuid, 'user uuid');
        let mediaUuid = checker.checkUuid(req.body.mediaUuid, 'media uuid');
    
        let authorizer = await checker.checkAuthorizationHeader(req);
    
        checker.checkUserAuthorization(authorizer, userUuid);
    
        let userEntity = new userRepository.UserEntity();
        let mediaEntity = mediaRepository.MediaEntity.fromUuid(mediaUuid);

        let userValueObjectPromise = userEntity.getUserByUuid(userUuid);
        let mediaValueObjectPromise = mediaEntity.getMetadata();

        let userValueObject = await userValueObjectPromise;
        let mediaValueObject = await mediaValueObjectPromise;

        await bookmarkRepository.createBookmark({
            userId: userValueObject.id,
            mediaId: mediaValueObject.id
        });

        res.status(200).end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});


/**
 * length: 1 이상의 정수
 * cursor: `${정수}_${정수}`형식의 문자열
 * parentUuid: uuid
 */
router.get('/:userUuid/comments', async function(req, res){
    let userUuid = req.params.userUuid;
    let length = req.query.length;
    let cursor = req.query.cursor;
    let parentUuid = req.query.parentUuid;

    let date;
    let random;
    let limit;
    if(cursor){
        let stringCursor = cursor.split('_');
        date = new Date().setTime(parseInt(stringCursor[0]));
        random = parseInt(stringCursor[1]);
    }

    date = date || new Date('2000-01-01T00:00Z');
    random = random || -1;
    limit = parseInt(length || 50) + 1;
    if(parentUuid){
        let parentComment = await serverConfig.model.Comment.findOne({
            attributes: ['id'],
            where: {
                uuid: parentUuid
            }
        });
        let childCommentList = await serverConfig.model.Comment.findAll({
            attributes: ['uuid', 'content', 'createdAt', 'updatedAt', 'random'],
            where: {
                parentId: parentComment.id,
                [sequelize.Op.or]: [{
                    createdAt: {
                        [sequelize.Op.gt]: date
                    }
                }, {
                    [sequelize.Op.and]: [{
                        createdAt: date
                    }, {
                        random: {
                            [sequelize.Op.gte]: random
                        }
                    }]
                }]
            },
            include: [{
                model: serverConfig.model.Media,
                as: 'CommentTarget',
                attributes: ['uuid', 'title']
            }, {
                model: serverConfig.model.User,
                as: 'CommentWriter',
                attributes: ['uuid', 'nickname']
            }],
            order: [
                ['createdAt', 'ASC'],
                ['random', 'ASC']
            ],
            limit: limit
        });
        
        let resBody = {
            list: []
        };

        if(childCommentList.length === 0){
            res.json(resBody);
            res.end();
            return;
        }

        if(childCommentList[limit - 1]){
            let nextComment = childCommentList[limit - 1];
            let utcMs = nextComment.createdAt.getTime();
            let random = nextComment.random;

            resBody.nextCursor = `${utcMs}_${random}`;
        }

        let bound = Math.min(childCommentList.length, limit - 1);

        for(let i = 0; i < bound; i++){
            let comment = childCommentList[i];

            resBody.list.push({
                uuid: comment.uuid,
                writer: {
                    uuid: comment.CommentWriter.uuid,
                    nickname: comment.CommentWriter.nickname
                },
                media: {
                    uuid: comment.CommentTarget.uuid,
                    title: comment.CommentTarget.title
                },
                content: comment.content,
                createdAt: comment.createdAt.toISOString(),
                updatedAt: comment.updatedAt.toISOString()
            });
        }
        res.set('Content-Type', 'application/json');
        res.write(JSON.stringify(resBody, null, 5));
        res.end();
    }
    else{
        let userEntity = new userRepository.UserEntity();
        let userValueObject = await userEntity.getUserByUuid(userUuid);

        let parentCommentList = await serverConfig.model.Comment.findAll({
            attributes: ['uuid', 'content', 'createdAt', 'updatedAt', 'random'],
            where: {
                writerId: userValueObject.id,
                [sequelize.Op.or]: [{
                    createdAt: {
                        [sequelize.Op.gt]: date
                    }
                }, {
                    [sequelize.Op.and]: [{
                        createdAt: date
                    }, {
                        random: {
                            [sequelize.Op.gte]: random
                        }
                    }]
                }]
            },
            include: [{
                model: serverConfig.model.Media,
                as: 'CommentTarget',
                attributes: ['uuid', 'title']
            }, {
                model: serverConfig.model.User,
                as: 'CommentWriter',
                attributes: ['uuid', 'nickname']
            }],
            order: [
                ['createdAt', 'ASC'],
                ['random', 'ASC']
            ],
            limit: limit
        });
        
        let resBody = {
            list: []
        };

        if(parentCommentList[limit - 1]){
            let nextComment = parentCommentList[limit - 1];
            let utcMs = nextComment.createdAt.getTime();
            let random = nextComment.random;

            resBody.nextCursor = `${utcMs}_${random}`;
        }

        let bound = Math.min(parentCommentList.length, limit - 1);

        for(let i = 0; i < bound; i++){
            let comment = parentCommentList[i];

            resBody.list.push({
                commentUuid: comment.uuid,
                writer: {
                    userUuid: comment.CommentWriter.uuid,
                    nickname: comment.CommentWriter.nickname
                },
                media: {
                    mediaUuid: comment.CommentTarget.uuid,
                    title: comment.CommentTarget.title
                },
                content: comment.content,
                createdAt: comment.createdAt.toISOString(),
                updatedAt: comment.updatedAt.toISOString()
            });
        }
        res.set('Content-Type', 'application/json');
        res.write(JSON.stringify(resBody, null, 5));
        res.end();
    }
    
});


router.patch('/:userId/thumbnail');





module.exports = {
    router
};