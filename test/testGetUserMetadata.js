const assert = require('assert');

const testUtil = require('./testUtil');
const dbInitializer = require('./dbInitializer');


async function testGetUserMetadata({accountId, nickname, introduction}){
    let tempPassword = 'passwordpassword';
    let tempNickname = 'tempNickname';

    let [user] = await testUtil.createSignedControllerList(
        testUtil.localhostRequestOption, [{
            accountId: accountId,
            accountPassword: tempPassword,
            nickname: tempNickname
        }]
    );

    await user.changeMyInfo({
        nickname: nickname,
        introduction: introduction
    });

    let myInfo = await user.getMyInfo();

    assert.strictEqual(user.recentResponse.status, 200);
    assert.strictEqual(myInfo.nickname, nickname);
    assert.strictEqual(myInfo.introduction, introduction);
}

describe('GET /v1/users/{userId}/info 테스트', function(){
    beforeEach(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });

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
