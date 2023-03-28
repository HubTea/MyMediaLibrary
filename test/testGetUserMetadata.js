const assert = require('assert');

const testUtil = require('./testUtil');
const dbInitializer = require('./dbInitializer');


async function testGetUserMetadata(testCase){
    let [user] = await testUtil.createSignedControllerList(
        testUtil.localhostRequestOption, [testCase.user]
    );

    await user.changeMyInfo(testCase.newInfo);

    let myInfo = await user.getMyInfo();

    assert.strictEqual(user.recentResponse.status, 200);
    assert.strictEqual(myInfo.nickname, testCase.newInfo.nickname);
    assert.strictEqual(myInfo.introduction, testCase.newInfo.introduction);
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
            let testCase = {
                user: {
                    accountId: 'tempAccountId',
                    accountPassword: 'tempPassword',
                    nickname: 'tempNickname'
                },

                newInfo: {
                    nickname: 'alpha',
                    introduction: 'beta'
                }
            };

            await testGetUserMetadata(testCase);
        }
    );
});
