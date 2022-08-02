const assert = require('assert');

const testUtil = require('./testUtil');
const dbInitializer = require('./dbInitializer');


async function testGetMediaMetadata({title, description, type}){
    let tempAccount = 'tempAccount';
    let tempPassword = 'passwordpassword';
    let tempNickname = 'tempNickname';

    let { userId, token } = await testUtil.registerUserAndLogIn({
        accountId: tempAccount,
        accountPassword: tempPassword,
        nickname: tempNickname
    });

    let registerMediaRequest = testUtil.sendRegisterMediaRequest({
        userId: userId,
        token: token,
        description: description,
        type: type,
        title: title        
    });
    let registerMediaResponse = await registerMediaRequest.getResponse();
    let mediaUuid = registerMediaResponse.headers.location;

    let getMediaMetadataRequest = testUtil.sendGetMediaMetadataRequest({
        mediaId: mediaUuid
    });
    let getMediaMetadataResponse = await getMediaMetadataRequest.getResponse();
    let metadata = await getMediaMetadataRequest.getBodyObject();

    assert.strictEqual(getMediaMetadataResponse.statusCode, 200);
    assert.strictEqual(metadata.title, title);
    assert.strictEqual(metadata.description, description);
    assert.strictEqual(metadata.type, type);
    assert.strictEqual(metadata.viewCount, 1);
    assert.strictEqual(metadata.dislikeCount, 0);
    assert.strictEqual(metadata.uploader.uuid, userId);
    assert.strictEqual(metadata.uploader.nickname, tempNickname);

    let updatedMs = new Date(metadata.updateTime).getTime();
    let now = new Date().getTime();
    assert.ok(Math.abs(updatedMs - now) < 5 * 1000);
}


describe('GET /v1/medias/{mediaId}/info 테스트', function(){
    beforeEach(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });

    it('정상적인 값 테스트', async function(){
        await testGetMediaMetadata({
            title: 'title title',
            description: 'description description',
            type: 'image/jpeg'
        });
    });
});