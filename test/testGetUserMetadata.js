const assert = require('assert');

const testUtil = require('./testUtil');


async function testGetUserMetadata({accountId, nickname, introduction}){
    let tempPassword = 'tempPassword';
    let tempNickname = 'tempNickname';

    let { userId, token } = await testUtil.registerUserAndLogIn({
        accountId: accountId,
        accountPassword: tempPassword,
        nickname: tempNickname
    });

    console.log(`userId: ${userId}`);

    let patchUserMetadataRequest = testUtil.sendPatchUserMetadataRequest({
        userId: userId,
        token: token,
        nickname: nickname,
        introduction: introduction
    });
    await patchUserMetadataRequest.getResponse();

    let getUserMetadataRequest = testUtil.sendGetUserMetadataRequest({
        userId: userId
    });
    let response = await getUserMetadataRequest.getResponse();
    let body = await getUserMetadataRequest.getBodyObject();

    assert.strictEqual(response.statusCode, 200);

    assert.strictEqual(body.nickname, nickname);
    assert.strictEqual(body.introduction, introduction);
    assert.ok(typeof body.thumbnailUrl === 'string');

    console.log(body);
}

describe('GET /v1/users/{userId}/info 테스트', function(){
    it(
        '응답으로 PATCH /v1/users/{userId}/info로 전달했던 값이 제대로 오는지 테스트',
        async function(){
            await testGetUserMetadata({
                accountId: 'tempAccountId',
                nickname: 'alpha',
                introduction: 'beta'
            });
        }
    );
});
