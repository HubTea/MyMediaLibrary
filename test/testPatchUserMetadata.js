const assert = require('assert');

const testUtil = require('./testUtil');


async function testPatchUserMetadata({accountId, nickname, introduction}){
    let password = 'tempPassword';

    let registerUserRequest = testUtil.sendRegisterUserRequest({
        accountId: accountId,
        accountPassword: password
    });
    let registerUserResponse = await registerUserRequest.getResponse();
    let userPath = registerUserResponse.headers.location;
    let splittedPath = userPath.split('/');
    let userId = splittedPath[splittedPath.length - 1];

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
    let response = await patchUserMetadataRequest.getResponse();

    assert.strictEqual(response.statusCode, 200);
}

describe('PATCH /v1/users/{userId}/info 테스트', function(){
    it(
        '유효한 값으로 유저 정보 변경 요청 시 정상 응답 오는지 테스트(요청한 값이 DB에 반영되는지는 테스트 안 함)', 
        async function(){
            await testPatchUserMetadata({
                accountId: 'tempAccountId',
                nickname: 'tempNickname',
                introduction: 'hello'
            });
        }
    );
});