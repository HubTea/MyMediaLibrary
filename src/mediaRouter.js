const express = require('express');
const stream = require('stream/promises');

const mediaRepository = require('./repository/mediaRepository');
const userRepository = require('./repository/userRepository');
const commentRepository = require('./repository/commentRepository');
const mediaListRepository = require('./repository/mediaListRepository');
const mediaPaginationSessionRepository = 
    require('./repository/mediaPaginationSessionRepository');
const checker = require('./checker');
const errorHandler = require('./errorHandler');
const serverConfig = require('./serverConfig');
const pagination = require('./pagination');
const tagManipulator = require('./tag');
const error = require('./error');


const mediaRouter = express.Router();

mediaRouter.get('/', async function(req, res){
    try{
        let length = checker.checkPaginationLength(req.query.length, 'length');
        let sort = checker.checkMediaSortOption(req.query.sort, 'sort');
        let tagList = checker.checkTagList(req.query.tag, 'tag');
        let mediaList = [];
        let paginator;
        let resBody = {};

        if(sort === 'new'){
            let [date, uuid] = checker.checkDateUuidCursor(
                req.query.cursor, '_', pagination.endingDate, pagination.maximumUuid, 'cursor'
            );
            paginator = new pagination.Paginator({
                length: length,
                mapper: pagination.mediaToSimpleFormat,
                cursorFactory: pagination.createDateUuidCursor
            }); 

            mediaList = await mediaListRepository.getDateDescendingMediaList(
                date, uuid, tagList, paginator.getRequiredLength()
            );

            resBody = paginator.buildResponseBody(mediaList);
        }
        else if(sort === 'old'){
            let [date, uuid] = checker.checkDateUuidCursor(
                req.query.cursor, '_', pagination.beginningDate, pagination.minimumUuid, 'cursor'
            );
            paginator = new pagination.Paginator({
                length: length,
                mapper: pagination.mediaToSimpleFormat,
                cursorFactory: pagination.createDateUuidCursor
            });

            mediaList = await mediaListRepository.getDateAscendingMediaList(
                date, uuid, tagList, paginator.getRequiredLength()
            );

            resBody = paginator.buildResponseBody(mediaList);
        }
        else if(sort === 'most_watched'){
            let [viewCount, uuid] = checker.checkViewCountUuidCursor(
                req.query.cursor, '_', pagination.maximumViewCount, pagination.maximumUuid, 'cursor'
            );

            paginator = new pagination.Paginator({
                length: length,
                mapper: pagination.mediaToSimpleFormat,
                cursorFactory: pagination.createViewCountUuidCursor
            });

            mediaList = await mediaListRepository.getViewCountDescendingMediaList(
                viewCount, uuid, tagList, paginator.getRequiredLength()
            );
            
            resBody = paginator.buildResponseBody(mediaList);

            let session = null;

            if(req.query.session === undefined) {
                session = new mediaPaginationSessionRepository.MediaPaginationSessionEntity();

                //session.create와 아래의 session.append는 
                //트랜잭션으로 묶지 않음.
                await session.create();
            }
            else {
                if(isNaN(req.query.session)) {
                    throw new error.IllegalParameter(null, 'session');
                }

                session = new mediaPaginationSessionRepository.MediaPaginationSessionEntity(
                    parseInt(req.query.session)
                );
            }
            
            let omittedList = await session.getOmittedMedia(viewCount, uuid, tagList, 50);
            
            await session.append([
                ...omittedList.map(x => x.id),
                ...paginator.croppedList.map(x => x.id)
            ]);

            resBody.omittedList = omittedList.map(x => pagination.mediaToSimpleFormat(x));
            resBody.session = session.sessionId;    
        }

        res.json(resBody);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res,err, errorHandler.filterRequest(req));
    }
});

mediaRouter.get('/:mediaUuid/info', async function(req, res){
    try{
        let mediaUuid = checker.checkUuid(req.params.mediaUuid, 'media uuid');
        let mediaEntity = mediaRepository.MediaEntity.fromUuid(mediaUuid);
        
        await mediaEntity.addViewCount(1);

        let mediaValueObject = await mediaEntity.getMetadataWithUploader();
        let viewCount = await mediaEntity.getViewCount();
        let dislikeCount = await mediaEntity.getDislikeCount();
        
        res.json({
            title: mediaValueObject.title,
            description: mediaValueObject.description,
            type: mediaValueObject.type,
            updateTime: mediaValueObject.updateTime,
            viewCount: viewCount,
            dislikeCount: dislikeCount,
            tagList: tagManipulator.splitTagString(mediaValueObject.tagString),
            uploader: {
                uuid: mediaValueObject.uploader.uuid,
                nickname: mediaValueObject.uploader.nickname
            }
        });
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err, errorHandler.filterRequest(req));
    }
});

mediaRouter.get('/:mediaUuid', async function(req, res){
    try{
        let mediaUuid = req.params.mediaUuid;
        let entity = mediaRepository.MediaEntity.fromUuid(mediaUuid);
        let download = await entity.getDownloadStream();
        let mediaValueObject = await entity.getMetadata();

        res.set('Content-Type', mediaValueObject.type);
        await stream.pipeline(download, res);
    }
    catch(err){
        errorHandler.handleError(res, err, errorHandler.filterRequest(req));
    }
});

mediaRouter.post('/:mediaUuid', async function(req, res){
    try{
        let mediaUuid = checker.checkUuid(req.params.mediaUuid, 'media uuid');
        let authorizer = await checker.checkAuthorizationHeader(req);

        await checker.checkMediaAuthorization(authorizer, mediaUuid);

        let entity = mediaRepository.MediaEntity.fromUuid(mediaUuid);

        await entity.upload(req);

        res.status(200);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err, errorHandler.filterRequest(req));
    }
});

mediaRouter.get('/:mediaUuid/comments', async function(req, res){
    try{
        let mediaUuid = checker.checkUuid(req.params.mediaUuid, 'media uuid');
        let length = checker.checkPaginationLength(req.query.length, 'length');
        let [date, random] = checker.checkDateRandomCursor(req.query.cursor, '_', pagination.beginningDate, 'cursor');
        let parentUuid = req.query.parentUuid;

        let mediaEntity = mediaRepository.MediaEntity.fromUuid(mediaUuid);
        let mediaValueObject = await mediaEntity.getMetadata();
        
        let paginator = new pagination.Paginator({
            length: length,
            mapper: function(comment){
                return {
                    uuid: comment.uuid,
                    writer: {
                        uuid: comment.writerUuid,
                        nickname: comment.writerNickname
                    },
                    content: comment.content,
                    createdAt: comment.createdAt.toISOString(),
                    updatedAt: comment.updatedAt.toISOString()
                };
            },
            cursorFactory: pagination.createDateRandomCursor
        });
        let requiredLength = paginator.getRequiredLength();
        let commentList;

        if(parentUuid){
            checker.checkUuid(parentUuid, 'parent uuid');

            let parentComment = await commentRepository.getCommentByUuid(parentUuid, mediaValueObject.id);
            
            commentList = await commentRepository.getChildCommentList(
                date, random, requiredLength, parentComment.id, mediaValueObject.id
            );
        }
        else{
            commentList = await commentRepository.getCommentListOfMedia(
                date, random, requiredLength, mediaValueObject.id
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

mediaRouter.post('/:mediaUuid/comments', async function(req, res){
    try{
        let mediaUuid = checker.checkUuid(req.params.mediaUuid, 'media uuid');
        let content = checker.checkPlaintext(req.body.content, 'comment content');
        let writerUuid = checker.checkUuid(req.body.writerUuid, 'writer uuid');
        let parentUuid = req.body.parentUuid;

        let authorizer = await checker.checkAuthorizationHeader(req);

        checker.checkUserAuthorization(authorizer, writerUuid);

        let comment = await createComment(mediaUuid, writerUuid, parentUuid, content);
        
        res.set('Location', comment.uuid);
        res.status(201);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err, errorHandler.filterRequest(req));
    }
});

async function createComment(mediaUuid, writerUuid, parentUuid, content) {
    let mediaEntity = mediaRepository.MediaEntity.fromUuid(mediaUuid);
    let mediaValueObjectPromise = mediaEntity.getMetadata();

    let userEntity = new userRepository.UserEntity();
    let userValueObject = await userEntity.getUserByUuid(writerUuid);
    let mediaValueObject = await mediaValueObjectPromise;
    let model = commentRepository.getCommentShardModel(mediaValueObject.id);
    let commentSeed = {
        writerId: userValueObject.id,
        writerNickname: userValueObject.nickname,
        writerUuid,
        mediaId: mediaValueObject.id,
        content: content,
        random: Math.floor(pagination.maximumRandom * Math.random())
    };

    if(parentUuid){
        checker.checkUuid(parentUuid);

        let parentComment = await model.Comment.findOne({
            where: {
                uuid: parentUuid
            }
        });

        commentSeed.parentId = parentComment.id;
    }

    let comment = await model.Comment.create(commentSeed);

    let oldNickname = userValueObject.nickname;
    userValueObject = await userEntity.getUserByUuid(writerUuid);

    let newNickname = userValueObject.nickname;
    if(oldNickname === newNickname) {
        await commentRepository.confirm(comment.id, null, mediaValueObject.id);
    }
    else {
        await commentRepository.confirm(comment.id, newNickname, mediaValueObject.id);
    }

    return comment;
}

module.exports = {
    router: mediaRouter,
    createComment
};