const assert = require('assert');

const testUtil = require('./testUtil');
const dbInitializer = require('./dbInitializer');


async function testMediaEndpoint({title, description, type, content}){
    let {userId, token} = await testUtil.registerUserAndLogIn({
        accountId: 'tempId',
        accountPassword: 'tempPw',
        nickname: 'tempName'
    });

    let registerMediaRequest = testUtil.sendRegisterMediaRequest({
        userId: userId,
        token: token,
        description: description,
        type: type,
        title: title        
    });
    let registerMediaResponse = await registerMediaRequest.getResponse();

    assert.strictEqual(registerMediaResponse.statusCode, 201);
    assert.ok(registerMediaResponse.headers.location);

    console.log(registerMediaResponse.headers.location);

    let splittedPath = registerMediaResponse.headers.location.split('/');
    let mediaId = splittedPath[splittedPath.length - 1];

    let uploadMediaRequest = testUtil.sendUploadMediaRequest({
        mediaId: mediaId,
        content: content,
        type: type,
        token: token
    });
    let uploadMediaResponse = await uploadMediaRequest.getResponse();

    assert.strictEqual(uploadMediaResponse.statusCode, 200);

    let downloadMediaRequest = testUtil.sendDownloadMediaRequest({
        mediaId: mediaId
    });
    let downloadMediaResponse = await downloadMediaRequest.getResponse();
    let downloadedContent = await downloadMediaRequest.getBodyBuffer();

    assert.strictEqual(downloadMediaResponse.statusCode, 200);
    assert.strictEqual(downloadMediaResponse.headers['content-type'], type);
    assert.strictEqual(downloadedContent.toString(), content.toString());
}

describe('POST /v1/users/{userId}/media, POST /v1/medias/{mediaId}, GET /v1/medias/{mediaId} 테스트', function(){
    beforeEach(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });

    it('미디어 등록, 업로드, 다운로드 테스트', async function(){
        await testMediaEndpoint({
            title: 'media title',
            description: 'the first upload',
            type: 'image/jpeg',
            content: 'first file'
        });
    });
});