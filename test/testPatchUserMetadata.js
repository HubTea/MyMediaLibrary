const assert = require('assert');

const testUtil = require('./testUtil');


async function testPatchUserMetadata({accountId, nickname, introduction}){
    let password = 'password';
    let tempNickname = 'tempNickname';

    let { userId, token } = await testUtil.registerUserAndLogIn({
        accountId: accountId,
        accountPassword: password,
        nickname: tempNickname
    });

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