const express = require('express');
const stream = require('stream/promises');

const mediaRepository = require('./repository/mediaRepository');
const checker = require('./checker');
const errorHandler = require('./errorhandler');


const mediaRouter = express.Router();

mediaRouter.get('/', function(req, res){

});

mediaRouter.get('/:mediaId/info', async function(req, res){

});

mediaRouter.get('/:mediaId', async function(req, res){
    try{
        let mediaId = req.params.mediaId;
        let entity = mediaRepository.MediaEntity.fromId(mediaId);
        let download = await entity.getDownloadStream();
        let mediaValueObject = await entity.getMetadata();

        res.set('Content-Type', mediaValueObject.type);
        await stream.pipeline(download, res);
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});

mediaRouter.post('/:mediaId', async function(req, res){
    try{
        let mediaId = req.params.mediaId;
        let authorizer = await checker.checkAuthorizationHeader(req);

        await checker.checkMediaAuthorization(authorizer, mediaId);

        let entity = mediaRepository.MediaEntity.fromId(mediaId);

        await entity.upload(req);

        res.status(200);
        res.end();
    }
    catch(err){
        errorHandler.handleError(res, err);
    }
});

mediaRouter.get('/:mediaId/comments', function(req, res){

});

module.exports = {
    router: mediaRouter
};