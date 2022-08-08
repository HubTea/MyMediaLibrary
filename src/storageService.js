const {S3Client} = require('@aws-sdk/client-s3');


let bucket;
let region;
let client;

try{
    bucket = process.env.AWS_S3_BUCKET;
    region = process.env.AWS_S3_REGION;
    client = new S3Client({
        region: region,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    });
}
catch(err){
    if(process.env.NODE_ENV === 'production'){
        throw err;
    }
}

module.exports = {
    client,
    bucket
};