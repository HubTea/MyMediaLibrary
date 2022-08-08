const {S3Client} = require('@aws-sdk/client-s3');
const {Upload} = require('@aws-sdk/lib-storage');

const bucket = process.env.AWS_S3_BUCKET;
const region = process.env.AWS_S3_REGION;
const client = new S3Client({
    region: region,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

/**
 * 
 * @param {string} key 
 * @param {stream.Readable | string | Buffer} content 
 * @returns 
 */
function uploadFactory(key, content){
    return new Upload({
        client: client,
        params: {
            Bucket: bucket,
            Key: key,
            Body: content
        }
    });
}

module.exports = {
    client,
    bucket,
    uploadFactory
};