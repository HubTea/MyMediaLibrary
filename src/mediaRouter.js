const express = require('express');
const stream = require('stream/promises');
const sequelize = require('sequelize');

const mediaRepository = require('./repository/mediaRepository');
const userRepository = require('./repository/userRepository');
const commentRepository = require('./repository/commentRepository');
const checker = require('./checker');
const errorHandler = require('./errorhandler');
const serverConfig = require('./serverConfig');
const pagination = require('./pagination');


const mediaRouter = express.Router();

/**
 * sort: 'new' | 'old' | 'most_watched'
 */
mediaRouter.get('/', async function(req, res){
    // let sort = req.query.sort || 'new';
    // let cursor = req.query.cursor;
    // let length = req.query.length;
    // let tagString = req.query.tagString;
    // let tagList = [];
    // let limit;

    // if(length){
    //     length = parseInt(length);
    // }
    // else{
    //     length = 50;
    // }
    // limit = length + 1;

    // if(tagString){
    //     tagList = tagString.split('_');
    // }

    // if(sort === 'new'){
    //     let date = new Date('9999-01-01T00:00:00');
    //     let random = -1;

    //     if(cursor){
    //         let splittedCursor = cursor.split('_');

    //         date = new Date().getSetTime(parseInt(splittedCursor[0]));
    //         random = parseInt(splittedCursor[1]);
    //     }
        
    //     let searchList = await serverConfig.model.Media.findAll({
    //         include: [{
    //             model: serverConfig.model.User,
    //             as: 'Uploader',
    //             attributes: ['uuid', 'nickname']
    //         }, {
    //             model: serverConfig.model.Tag,
    //             as: 'MediaTags',
    //             where: {
    //                 tag: {
    //                     [sequelize.Op.in]: tagList
    //                 }
    //             }
    //         }],
    //         group: 'Media.id',
    //         having: sequelize.literal(`count("MediaTags"."tag") = ${tagList.length}`)
    //     });

    //     console.log(searchList.map(x => x.toJSON()));
    // }
    // else if(sort === 'old'){

    // }
    // else if(sort === 'most_watched'){

    // }
});

mediaRouter.get('/:mediaUuid/info', async function(req, res){
    try{
        let mediaUuid = req.params.mediaUuid;
        let mediaEntity = mediaRepository.MediaEntity.fromUuid(mediaUuid);
        
        await mediaEntity.addViewCount(1);

        let mediaValueObject = await mediaEntity.getMetadataWithUploader();
        let viewCount = await mediaEntity.getViewCount();
        let dislikeCount = await mediaEntity.getDislikeCount();
        
        res.status(200);
        res.set('Content-Type', 'application/json');
        res.write(JSON.stringify({
            title: mediaValueObject.title,
            description: mediaValueObject.description,
            type: mediaValueObject.type,
            updateTime: mediaValueObject.updateTime,
            viewCount: viewCount,
            dislikeCount: dislikeCount,
            uploader: {
                uuid: mediaValueObject.uploader.uuid,
                nickname: mediaValueObject.uploader.nickname
            }
        }));
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
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
        errorHandler.handleError(res, err);
    }
});

mediaRouter.post('/:mediaUuid', async function(req, res){
    try{
        let mediaUuid = req.params.mediaUuid;
        let authorizer = await checker.checkAuthorizationHeader(req);

        await checker.checkMediaAuthorization(authorizer, mediaUuid);

        let entity = mediaRepository.MediaEntity.fromUuid(mediaUuid);

        await entity.upload(req);

        res.status(200);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});

mediaRouter.get('/:mediaUuid/comments', async function(req, res){
    try{
        let mediaUuid = checker.checkUuid(req.params.mediaUuid, 'media uuid');
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
                        userUuid: comment.CommentWriter.uuid,
                        nickname: comment.CommentWriter.nickname
                    },
                    content: comment.content,
                    createdAt: comment.createdAt.toISOString(),
                    updatedAt: comment.updatedAt.toISOString()
                };
            },
            cursorFactory: function(comment){
                let utcMs = comment.createdAt.getTime();
                let random = comment.random;

                return `${utcMs}_${random}`;
            }
        });
        let requiredLength = paginator.getRequiredLength();

        if(parentUuid){
            checker.checkUuid(parentUuid, 'parent uuid');

            let parentComment = await commentRepository.getCommentByUuid(parentUuid);

            commentList = await commentRepository.getChildCommentList(
                date, random, requiredLength, parentComment.id
            );
        }
        else{
            let mediaEntity = mediaRepository.MediaEntity.fromUuid(mediaUuid);
            let mediaValueObject = await mediaEntity.getMetadata();

            commentList = await commentRepository.getCommentListOfMedia(
                date, random, requiredLength, mediaValueObject.id
            );
        }

        let resBody = paginator.buildResponseBody(commentList);
        
        res.json(resBody);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
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

        let mediaEntity = mediaRepository.MediaEntity.fromUuid(mediaUuid);
        let mediaValueObjectPromise = mediaEntity.getMetadata();

        let userEntity = new userRepository.UserEntity();
        let userValueObject = await userEntity.getUserByUuid(writerUuid);
        let mediaValueObject = await mediaValueObjectPromise;
        
        let commentSeed = {
            writerId: userValueObject.id,
            mediaId: mediaValueObject.id,
            content: content,
            random: Math.floor(pagination.maximumRandom * Math.random())
        };

        if(parentUuid){
            checker.checkUuid(parentUuid);

            let parentComment = await serverConfig.model.Comment.findOne({
                where: {
                    uuid: parentUuid
                }
            });

            commentSeed.parentId = parentComment.id;
        }

        let comment = await serverConfig.model.Comment.create(commentSeed);

        res.set('Location', comment.uuid);
        res.status(201);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});

module.exports = {
    router: mediaRouter
};