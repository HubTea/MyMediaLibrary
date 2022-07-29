const assert = require('assert');

const testUtil = require('./testUtil');
const dbInitializer = require('./dbInitializer');


class GetFollowingListRequestFactory extends testUtil.RequestFactory{
    constructor(subscriberUuid){
        super();
        this.subscriberUuid = subscriberUuid;
    }

    create(cursor){
        return testUtil.sendGetFollowingListRequest({
            subscriberUuid: this.subscriberUuid,
            cursor: cursor
        });
    }
}


async function testSubscribe(option){
    let subscriberPromise = testUtil.registerUserAndLogIn({
        accountId: option.subscriber.accountId,
        accountPassword: option.subscriber.accountPassword,
        nickname: option.subscriber.nickname
    });
    let uploaderUuidPromiseList = [];

    for(let i = 0; i < option.uploaderList.length; i++){
        let uploader = option.uploaderList[i];

        uploaderUuidPromiseList.push(
            testUtil.registerUser({
                accountId: uploader.accountId,
                accountPassword: uploader.accountPassword,
                nickname: uploader.nickname
            })
        );                
    }

    let uploaderUuidList = await Promise.all(uploaderUuidPromiseList);
    let subscriber = await subscriberPromise;
    let subscribeRequestList = [];

    for(let uploaderUuid of uploaderUuidList){
        subscribeRequestList.push(
            testUtil.sendSubscribeRequest({
                subscriberUuid: subscriber.userId,
                uploaderUuid: uploaderUuid,
                subscriberToken: subscriber.token
            })
        );
    }
    
    for(let subscribeRequest of subscribeRequestList){
        let subscribeResponse = await subscribeRequest.getResponse();

        assert.strictEqual(subscribeResponse.statusCode, 200);
    }

    let factory = new GetFollowingListRequestFactory(subscriber.userId);
    let assembler = new testUtil.PageAssembler(factory);
    
    let fullList = await assembler.assemble();
    
    testUtil.assertPage(uploaderUuidList, fullList);
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
                accountPassword: 'password',
                nickname: 'subscriber'
            },
            uploaderList: []
        };

        for(let i = 0; i < 123; i++){
            testCase.uploaderList.push({
                accountId: `uploader#${i}`,
                accountPassword: 'password',
                nickname: 'uploader'
            });
        }

        await testSubscribe(testCase);
    });
});

