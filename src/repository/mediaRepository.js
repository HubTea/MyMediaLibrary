const s3 = require('@aws-sdk/client-s3');
const s3Upload = require('@aws-sdk/lib-storage');
const fsPromise = require('fs/promises');
const streamPromise = require('stream/promises');

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

        let file = await fsPromise.open(this.getPath());
        return file.createReadStream();
    }

    async upload(content){
        this.assertPrepared();

        let file = await fsPromise.open(this.getPath(), 'w');
        await streamPromise.pipeline(
            content, file.createWriteStream()
        );
        return;
    }

    getPath(){
        return `C:\\storage\\mediaContent\\${this.uuid}`;
    }

    assertPrepared(){
        if(!this.uuid){
            throw new NotPreparedError();
        }
    }
}

class AwsS3MediaEntity extends MediaEntity{
    constructor(){
        super();
    }

    static fromUuid(uuid){
        let obj = new AwsS3MediaEntity();

        obj.uuid = uuid;
        return obj;
    }

    async getDownloadStream(){
        const mediaContent = await storage.client.send(new s3.GetObjectCommand({
            Bucket: storage.bucket,
            Key: this.getPath()
        }));

        return mediaContent.Body;
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

        await upload.done();
    }

    getPath(){
        return `original/${this.uuid}`;
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

if(process.env.NODE_ENV === 'production'){
    module.exports = {
        MediaEntity: AwsS3MediaEntity
    };
}
else{
    module.exports = {
        MediaEntity
    };
}
