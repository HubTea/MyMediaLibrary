const assert = require('assert');

const testUtil = require('./testUtil');
const dbInitializer = require('./dbInitializer');


class GetBookmarkRequestFactory extends testUtil.RequestFactory{
    constructor(userUuid){
        super();
        this.userUuid = userUuid;
    }

    create(cursor){
        return testUtil.sendGetBookmarkRequest({
            userUuid: this.userUuid,
            cursor: cursor
        });
    }
}


async function testBookmark(testCase){
    let userUuidPromise = testUtil.registerUser({
        accountId: testCase.user.accountId,
        accountPassword: testCase.user.accountPassword,
        nickname: testCase.user.nickname
    });

    let uploaderUuidPromise = testUtil.registerUser({
        accountId: testCase.uploader.accountId,
        accountPassword: testCase.uploader.accountPassword,
        nickname: testCase.uploader.nickname
    });

    let userUuid = await userUuidPromise;
    let uploaderUuid = await uploaderUuidPromise;

    let userTokenPromise = testUtil.logIn({
        accountId: testCase.user.accountId,
        accountPassword: testCase.user.accountPassword,
    });

    let uploaderTokenPromise = testUtil.logIn({
        accountId: testCase.uploader.accountId,
        accountPassword: testCase.uploader.accountPassword
    });

    let userToken = await userTokenPromise;
    let uploaderToken = await uploaderTokenPromise;
    
    let mediaUuidPromiseList = [];
    
    for(let media of testCase.mediaList){
        mediaUuidPromiseList.push(
            testUtil.registerMedia({
                userUuid: uploaderUuid,
                token: uploaderToken,
                title: media.title,
                type: media.type,
                description: media.description
            })
        );
    }

    let mediaUuidList = await Promise.all(mediaUuidPromiseList);

    let requestList = [];

    for(let mediaUuid of mediaUuidList){
        requestList.push(
            testUtil.sendAppendBookmarkRequest({
                userUuid: userUuid,
                token: userToken,
                mediaUuid: mediaUuid
            })
        );
    }
    
    for(let request of requestList){
        let response = await request.getResponse();

        assert.strictEqual(response.statusCode, 200);
    }
    
    let factory = new GetBookmarkRequestFactory(userUuid);

    await testUtil.assertEqualPage(mediaUuidList, factory);
}

describe('/v1/users/{userUuid}/bookmark 테스트', function(){
    beforeEach(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });

    it('북마크 추가 후 북마크 목록 조회 테스트', async function(){
        let testCase = {
            user: {
                accountId: 'viewer',
                accountPassword: 'password',
                nickname: 'viewer'
            },

            uploader: {
                accountId: 'uploader',
                accountPassword: 'password',
                nickname: 'uploader'
            },

            mediaList: []
        };

        for(let i = 0; i < 60; i++){
            testCase.mediaList.push({
                title: `title${i}`,
                description: 'desc',
                type: 'image/png'
            });
        }

        await testBookmark(testCase);
    });
});