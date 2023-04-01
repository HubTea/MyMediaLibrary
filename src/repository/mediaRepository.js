const s3 = require('@aws-sdk/client-s3');
const s3Upload = require('@aws-sdk/lib-storage');

const storage = require('../storageService');
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
     *  uploaderId: number,
     *  tagString: string
     * }
     * ```
     * @returns 
     */
    async createMetadata(mediaSeed){
        let transaction = null;
        try{
            mediaSeed = setUpdateTime(mediaSeed);
            mediaSeed = setRandom(mediaSeed);

            transaction = await serverConfig.sequelize.transaction();   

            this.modelInstance = await this.model.create(mediaSeed, {
                transaction: transaction
            });

            await serverConfig.model.MediaViewCount.create({
                mediaId: this.modelInstance.id
            }, {
                transaction: transaction
            });

            await transaction.commit();

            this.uuid = this.modelInstance.uuid;
            return converter.mediaToValueObject(this.modelInstance);
        }
        catch(mediaCreateError){
            this.uuid = null;
            this.modelInstance = null;
            if(!transaction) {
                await transaction.rollback();
            }
            throw error.wrapSequelizeError(mediaCreateError);
        }
    }

    async addViewCount(count){
        await this.getMetadataIfNotCached();
        await increase(serverConfig.model.MediaViewCount, {
            mediaId: this.modelInstance.id
        }, {
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
        try{
            const mediaContent = await storage.client.send(new s3.GetObjectCommand({
                Bucket: storage.bucket,
                Key: this.getPath()
            }));

            return mediaContent.Body;
        }
        catch(err){
            throw wrapStorageError(err);
        }
    }

    async upload(content){
        let upload = new s3Upload.Upload({
            client: storage.client,
            params: {
                Bucket: storage.bucket,
                Key: this.getPath(),
                Body: content
            }
        });

        try{
            await upload.done();
        }
        catch(err){
            throw wrapStorageError(err);
        }
    }

    getPath(){
        return `original/${this.uuid}`;
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
        return new error.NotFoundError(err);
    }
    else if(err instanceof s3.S3ServiceException){
        return new error.FileStorageError(err);
    }
    else{
        return err;
    }
}

async function increase(model, where, fields) {
    try{
        await model.increment(fields, {
            where: where
        });
    }
    catch(err){
        throw error.wrapSequelizeError(err);
    }
}


module.exports = {
    MediaEntity
};