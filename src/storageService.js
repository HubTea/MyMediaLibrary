const {S3Client} = require('@aws-sdk/client-s3');
const {Upload} = require('@aws-sdk/lib-storage');
const {fromEnv} = require('@aws-sdk/credential-providers');

const bucket = process.env.AWS_BUCKET;
const region = process.env.AWS_REGION;
const client = new S3Client({
    region: region,
    credentials: fromEnv()
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