const assert = require('assert');
const uuid = require('uuid');

const testUtil = require('./testUtil');
const dbInitializer = require('./dbInitializer');


async function testMediaEndpoint(testCase){
    let [user] = await testUtil.createSignedControllerList(
        testUtil.localhostRequestOption,
        [testCase.user]
    );

    let mediaUuid = await user.registerMedia(testCase.media);

    assert.strictEqual(user.recentResponse.status, 201);
    assert.ok(uuid.validate(mediaUuid));

    await user.uploadMedia(mediaUuid, testCase.media.content);

    assert.strictEqual(user.recentResponse.status, 200);

    let content = await user.downloadMedia(mediaUuid);

    assert.strictEqual(user.recentResponse.status, 200);
    assert.strictEqual(user.recentResponse.headers['content-type'], testCase.media.type);
    assert.strictEqual(content.toString(), testCase.media.content.toString());
}

describe('POST /v1/users/{userId}/media, POST /v1/medias/{mediaId}, GET /v1/medias/{mediaId} 테스트', function(){
    beforeEach(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });

    it('미디어 등록, 업로드, 다운로드 테스트', async function(){
        let testCase = {
            user: {
                accountId: 'tempId',
                accountPassword: 'passwordpassword',
                nickname: 'tempName'
            },
            media: {
                title: 'media title',
                description: 'the first upload',
                type: 'image/jpeg',
                content: 'first file'
            }
        };

        await testMediaEndpoint(testCase);
    });
});