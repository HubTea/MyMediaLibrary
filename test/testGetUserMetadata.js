const assert = require('assert');

const testUtil = require('./testUtil');


async function testGetUserMetadata({accountId, nickname, introduction}){
    let password = 'tempPassword';

    let registerUserRequest = testUtil.sendRegisterUserRequest({
        accountId: accountId,
        accountPassword: password,
        nickname: 'tempNickname'
    });
    let registerUserResponse = await registerUserRequest.getResponse();
    let userPath = registerUserResponse.headers.location;
    let splittedPath = userPath.split('/');
    let userId = splittedPath[splittedPath.length - 1];

    console.log(`userID: ${userId}`);

    let logInRequest = testUtil.sendLogInRequest({
        accountId: accountId,
        accountPassword: password
    });
    let logInBody = await logInRequest.getBodyObject();
    let token = logInBody.token;

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
