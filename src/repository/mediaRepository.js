//const s3 = require('@aws-sdk/client-s3');
const fs = require('fs');

//const s3Client = require('../storageService');
const serverConfig = require('../serverConfig');
const error = require('../error');
const converter = require('./converter');


class MediaEntity{
    constructor(){
        this.uuid = null;
        this.modelInstance = null;
        this.model = serverConfig.model.Media;
    }

    static fromUuid(uuid){
        let obj = new MediaEntity();

        obj.uuid = uuid;
        return obj;
    }

    async getOneMedia(){
        try{
            let media = await this.model.findOne({
                where: {
                    uuid: this.uuid
                }
            });

            if(media === null){
                throw new error.NotFoundError(null);
            }

            return media;
        }
        catch(mediaFindError){
            throw error.wrapSequelizeError(mediaFindError);
        }
    }

    async getMetadata(){
        this.assertPrepared();
        this.modelInstance = await this.getOneMedia();
        return converter.mediaToValueObject(this.modelInstance);
    }

    async getMetadataWithUploader(){
        this.assertPrepared();

        this.modelInstance = await this.getOneMedia();

        let valueObject = converter.mediaToValueObject(this.modelInstance);
        let uploader = await this.modelInstance.getUploader();

        valueObject.uploader = converter.userToValueObject(uploader);
        return valueObject;
    }

    async setMetadata(mediaValueObject){
        try{
            mediaValueObject = setUpdateTime(mediaValueObject);
            
            let media = converter.mediaValueObjectToMedia(mediaValueObject);

            if(this.modelInstance){
                let updateResult = await this.modelInstance.update(media);
            }
            else{
                let updateResult = await this.model.update(media, {
                    where: {
                        id: this.id
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
     *  uploaderId: number
     * }
     * ```
     * @returns 
     */
    async createMetadata(mediaSeed){
        try{
            mediaSeed = setUpdateTime(mediaSeed);
            mediaSeed = setRandom(mediaSeed);
            this.modelInstance = await this.model.create(mediaSeed);
            this.uuid = this.modelInstance.uuid;
            return converter.mediaToValueObject(this.modelInstance);
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
                    uuid: this.uuid
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

        return fs.createReadStream(`C:\\storage\\${this.getPath()}`);

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

        content.pipe(fs.createWriteStream(`C:\\storage\\${this.getPath()}`));
        return;

        try{
            let upload = new s3Client.uploadFactory(this.getPath(), content);

            await upload.done();
        }   
        catch(uploadError){
            throw wrapStorageError(uploadError);
        }
    }

    getPath(){
        return `mediaContent/${this.uuid}`;
    }

    assertPrepared(){
        if(!this.uuid){
            throw new NotPreparedError();
        }
    }
}

function setUpdateTime(mediaValueObject){
    mediaValueObject.updateTime = new Date().toISOString().replace('T', ' ');
    return mediaValueObject;
}

function setRandom(mediaValueObject){
    mediaValueObject.random = Math.round(0x3fffffff * Math.random());
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