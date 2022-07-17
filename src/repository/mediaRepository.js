const s3 = require('@aws-sdk/client-s3');

const s3Client = require('../storageService');
const serverConfig = require('../serverConfig');
const error = require('../error');


class NotPreparedError extends error.ErrorResponse{
    constructor(){
        super(500, 'MEDIA_ENTITY_NOT_PREPARED', null);
    }
}

class MediaEntity{
    constructor(){
        this.id = null;
        this.modelInstance = null;
        this.model = serverConfig.model.Media;
    }

    static fromId(mediaId){
        let obj = new MediaEntity();

        obj.id = mediaId;
        return obj;
    }

    async getMetadata(){
        this.assertPrepared();

        try{
            let media = await this.model.findOne({
                where: {
                    mediaId: this.id
                }
            });

            if(media === null){
                throw new error.NotFoundError(null);
            }

            this.modelInstance = media;
            return mediaToValueObject(media);
        }
        catch(mediaFindError){
            throw error.wrapSequelizeError(mediaFindError);
        }
    }

    async setMetadata(mediaValueObject){
        this.assertPrepared();

        try{
            mediaValueObject = setUpdateTime(mediaValueObject);
            mediaValueObject.mediaId = this.id;

            if(this.modelInstance){
                await this.modelInstance.update(mediaValueObject);
            }
            else{
                let updateResult = await this.model.update(mediaValueObject, {
                    where: {
                        mediaId: this.id
                    }
                });
            }
        }
        catch(mediaUpdateError){
            throw error.wrapSequelizeError(mediaUpdateError);
        }
    }

    /**
     * 
     * @param {object} mediaSeed 
     * ```
     * {
     *  title: string,
     *  description: string,
     *  type: string,
     *  uploader: string
     * }
     * ```
     * @returns 
     */
    async createMetadata(mediaSeed){
        try{
            mediaSeed = setUpdateTime(mediaSeed);
            this.modelInstance = await this.model.create(mediaSeed);
            this.id = this.modelInstance.mediaId;
            return mediaToValueObject(this.modelInstance);
        }
        catch(mediaCreateError){
            throw error.wrapSequelizeError(mediaCreateError);
        }
    }

    async addViewCount(count){
        await this.add({
            viewCount: count
        });
    }

    async addDislikeCount(count){
        await this.add({
            dislikeCount: count
        });
    }

    async add(fields){
        try{
            await this.model.increment(fields, {
                where: {
                    mediaId: this.id
                }
            });
        }
        catch(err){
            throw error.wrapSequelizeError(err);
        }
    }

    async getViewCount(){
        await this.getMetadataIfNotCached();
        return this.modelInstance.viewCount;
    }

    async getDislikeCount(){
        await this.getMetadataIfNotCached();
        return this.modelInstance.dislikeCount;
    }

    async getMetadataIfNotCached(){
        if(!this.modelInstance){
            await this.getMetadata();
        }
    }

    async getDownloadStream(){
        this.assertPrepared();

        try{
            const mediaContent = await s3Client.client.send(new s3.GetObjectCommand({
                Bucket: s3Client.bucket,
                Key: this.getPath()
            }));
    
            return mediaContent.Body;
        }
        catch(streamFetchError){
            throw wrapStorageError(streamFetchError);
        }
    }

    async upload(content){
        this.assertPrepared();

        try{
            let upload = new s3Client.uploadFactory(this.getPath(), content);

            await upload.done();
        }   
        catch(uploadError){
            throw wrapStorageError(uploadError);
        }
    }

    getPath(){
        return `mediaContent/${this.id}`;
    }

    assertPrepared(){
        if(!this.id){
            throw new NotPreparedError();
        }
    }
}

function mediaToValueObject(media){
    return {
        mediaId: media.mediaId,
        title: media.title,
        description: media.description,
        type: media.type,
        uploader: media.uploader,
        updateTime: media.updateTime,
        thumbnailUrl: media.thumbnailUrl
    };
}

function setUpdateTime(mediaValueObject){
    mediaValueObject.updateTime = new Date().toISOString().replace('T', ' ');
    return mediaValueObject;
}

function wrapStorageError(err){
    if(err instanceof s3.NotFound || err instanceof s3.NoSuchKey){
        return error.NotFoundError(err);
    }
    else if(err instanceof s3.S3ServiceException){
        return error.FileStorageError(err);
    }
    else{
        return err;
    }
}

module.exports = {
    MediaEntity
};