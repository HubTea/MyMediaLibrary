const express = require('express');
const stream = require('stream/promises');

const mediaRepository = require('./repository/mediaRepository');
const userRepository = require('./repository/userRepository');
const checker = require('./checker');
const errorHandler = require('./errorhandler');


const mediaRouter = express.Router();

mediaRouter.get('/', function(req, res){

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

mediaRouter.get('/:mediaUuid/comments', function(req, res){

});

module.exports = {
    router: mediaRouter
};