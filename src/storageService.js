const {S3Client} = require('@aws-sdk/client-s3');


const bucket = process.env.AWS_BUCKET;
const region = process.env.AWS_REGION;
const client = new S3Client({
    region: region
});

module.exports = {
    client,
    bucket
};