const {S3Client} = require('@aws-sdk/client-s3');


let bucket = process.env.AWS_S3_BUCKET;
let region = process.env.AWS_S3_REGION;
let client = new S3Client({
    region: region,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

module.exports = {
    client,
    bucket
};