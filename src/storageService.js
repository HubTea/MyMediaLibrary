const {S3Client} = require('@aws-sdk/client-s3');
const {fromEnv} = require('@aws-sdk/credential-providers');

const bucket = process.env.AWS_BUCKET;
const region = process.env.AWS_REGION;
const client = new S3Client({
    region: region,
    credentials: fromEnv()
});

module.exports = {
    client,
    bucket
};