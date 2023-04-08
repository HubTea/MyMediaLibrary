const express = require('express');
const crypto = require('crypto');

const errorHandler = require('./errorHandler');
const security = require('./securityService');
const digest = require('./digest');
const userRepository = require('./repository/userRepository');
const mediaRepository = require('./repository/mediaRepository');
const mediaListRepository = require('./repository/mediaListRepository');
const followingListRepository = require('./repository/followingListRepository');
const bookmarkRepository = require('./repository/bookmarkRepository');
const commentRepository = require('./repository/commentRepository');
const checker = require('./checker');
const pagination = require('./pagination');
const tagManipulator = require('./tag');

const router = express.Router();


//유저 등록
router.post('/', async function(req, res){
    try{
        let accountId = checker.checkAccountId(req.body.accountId, 'accountId');
        let accountPassword = checker.checkAccountPassword(req.body.accountPassword, 'accountPassword');
        let nickname = checker.checkPlaintext(req.body.nickname, 'nickname');
        
        let userSeed = await createUserSeed({
            accountId: accountId,
            accountPw: accountPassword,
            nickname: nickname
        });
        let userEntity = new userRepository.UserEntity();

        let userValueObject = await userEntity.createUser(userSeed);

        res.status(201);
        res.setHeader('Location', `${userValueObject.uuid}`);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err, errorHandler.filterRequest(req));
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


router.get('/:userUuid/info', async function(req, res){
    try{
        let userUuid = checker.checkUuid(req.params.userUuid);
        let userEntity = new userRepository.UserEntity();
        let userValueObject = await userEntity.getUserByUuid(userUuid);

        res.write(JSON.stringify({
            nickname: userValueObject.nickname || '',
            introduction: userValueObject.introduction || ''
        }));
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err, errorHandler.filterRequest(req));
    }
});


router.patch('/:userUuid/info', async function(req, res){
    try{
        let userUuid = checker.checkUuid(req.params.userUuid);
        let nickname = checker.checkPlaintext(req.body.nickname);
        let introduction = checker.checkPlaintext(req.body.introduction);

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
        errorHandler.handleError(res, err, errorHandler.filterRequest(req));
    }
});


router.post('/:userUuid/medias', async function(req, res){
    try{
        let userUuid = checker.checkUuid(req.params.userUuid, 'user uuid');
        let title = checker.checkPlaintext(req.body.title, 'title');
        let description = checker.checkPlaintext(req.body.description, 'description');
        let type = checker.checkMimeType(req.body.type, 'type');
        let tagList = checker.checkTagList(req.body.tagList, 'tag list');

        let authorizer = await checker.checkAuthorizationHeader(req);

        checker.checkUserAuthorization(authorizer, userUuid);

        let userEntity = new userRepository.UserEntity();
        let userValueObject = await userEntity.getUserByUuid(userUuid);

        let mediaEntity = new mediaRepository.MediaEntity();
        let mediaValueObject = await mediaEntity.createMetadata({
            title: title,
            description: description,
            type: type,
            uploaderId: userValueObject.id,
            tagString: tagManipulator.concatenateTagList(tagList)
        });

        res.status(201);
        res.setHeader('Location', `${mediaValueObject.uuid}`);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err, errorHandler.filterRequest(req));
    }
});


router.get('/:userUuid/medias', async function(req, res){
    try{
        let userUuid = checker.checkUuid(req.params.userUuid, 'user uuid');
        let length = checker.checkPaginationLength(req.query.length, 'length');
        let [date, uuid] = checker.checkDateUuidCursor(
            req.query.cursor, '_', pagination.endingDate, pagination.maximumUuid, 'cursor'
        );

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
            cursorFactory: pagination.createDateUuidCursor
        });

        let user = new userRepository.UserEntity();
        let userValueObject = await user.getUserByUuid(userUuid);

        let myUploadList = await mediaListRepository.getLatestUploadList(
            userValueObject.id, date, uuid, paginator.getRequiredLength()
        );

        let resBody = paginator.buildResponseBody(myUploadList);
    
        res.json(resBody);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err, errorHandler.filterRequest(req));
    }
});


router.get('/:userUuid/following', async function(req, res){
    try{
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
            cursorFactory: pagination.createOrderCursor
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
    }
    catch(err){
        errorHandler.handleError(res, err, errorHandler.filterRequest(req));
    }
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

        await followingListRepository.createFollowing(uploaderValueObject.id, subscriberValueObject.id);
        
        res.status(200).end();
    }
    catch(err){
        errorHandler.handleError(res, err, errorHandler.filterRequest(req));
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

                return pagination.mediaToSimpleFormat(collection);
            },
            cursorFactory: pagination.createOrderCursor
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
        errorHandler.handleError(res, err, errorHandler.filterRequest(req));
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
        errorHandler.handleError(res, err, errorHandler.filterRequest(req));
    }
});


router.get('/:userUuid/comments', async function(req, res){
    try{
        let userUuid = checker.checkUuid(req.params.userUuid, 'user uuid');
        let length = checker.checkPaginationLength(req.query.length, 'length');
        let [date, random] = checker.checkDateRandomCursor(req.query.cursor, '_', pagination.beginningDate, 'cursor');
        let parentUuid = req.query.parentUuid;
        let commentList;
    
        let paginator = new pagination.Paginator({
            length: length,
            mapper: function(comment){
                return {
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
                };
            },
            cursorFactory: pagination.createDateRandomCursor
        });
        let requiredLength = paginator.getRequiredLength();
    
        if(parentUuid){
            checker.checkUuid(parentUuid, 'parent uuid');
    
            let parentComment = await commentRepository.getCommentByUuid(parentUuid);
    
            commentList = await commentRepository.getChildCommentListWithMediaReference(
                date, random, requiredLength, parentComment.id
            );
        }
        else{
            let userEntity = new userRepository.UserEntity();
            let userValueObject = await userEntity.getUserByUuid(userUuid);
    
            commentList = await commentRepository.getMyCommentListWithMediaReference(
                date, random, requiredLength, userValueObject.id
            );
        }
        
        let resBody = paginator.buildResponseBody(commentList);
    
        res.json(resBody);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err, errorHandler.filterRequest(req));
    }
});


module.exports = {
    router
};