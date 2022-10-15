const assert = require('assert');

const testUtil = require('./testUtil');
const dbInitializer = require('./dbInitializer');


class SubscriptionPageGenerator extends testUtil.PageGenerator{
    constructor(controller){
        super(controller);
    }

    generate(cursor){
        return this.controller.getMySubscriptionList(cursor);
    }
}

async function testSubscribe(testCase){
    let userList = await testUtil.createSignedControllerList(
        testUtil.localhostRequestOption,
        [testCase.subscriber, ...testCase.uploaderList]
    );

    let user = userList[0];
    let uploaderList = userList.slice(1);
    let uploaderUuidList = [];

    for(let uploader of uploaderList){
        let uploaderUuid = uploader.session.userUuid;

        uploaderUuidList.push(uploaderUuid);
        await user.subscribe(uploaderUuid);

        assert.strictEqual(user.recentResponse.status, 200);
    }

    let generator = new SubscriptionPageGenerator(user);

    await testUtil.assertEqualPage(uploaderUuidList, generator);
}

describe('/v1/users/{userUuid}/following 테스트', function(){
    beforeEach(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });

    it('구독 후 구독 목록 조회', async function(){
        let testCase = {
            subscriber: {
                accountId: 'subscriber',
                accountPassword: 'passwordpassword',
                nickname: 'subscriber'
            },
            uploaderList: []
        };

        for(let i = 0; i < 60; i++){
            testCase.uploaderList.push({
                accountId: `uploader${i}`,
                accountPassword: 'passwordpassword',
                nickname: 'uploader'
            });
        }

        await testSubscribe(testCase);
    });
});

