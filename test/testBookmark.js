const assert = require('assert');
const axios = require('axios').default;

const testUtil = require('./testUtil');
const dbInitializer = require('./dbInitializer');
const { Controller } = require('../controller/controller');


class BookmarkPageGenerator extends testUtil.PageGenerator{
    constructor(controller){
        super(controller);
    }

    generate(cursor){
        return this.controller.getMyBookmarkList(cursor);
    }
}

async function testBookmark(testCase){
    let client = axios.create(testUtil.localhostRequestOption);
    let user = new Controller(client);
    let uploader = new Controller(client);

    await user.registerUser({
        accountId: testCase.user.accountId,
        accountPassword: testCase.user.accountPassword,
        nickname: testCase.user.nickname
    });

    await uploader.registerUser({
        accountId: testCase.uploader.accountId,
        accountPassword: testCase.uploader.accountPassword,
        nickname: testCase.uploader.nickname
    });

    await user.logIn(
        testCase.user.accountId, testCase.user.accountPassword
    );

    await uploader.logIn(
        testCase.uploader.accountId, testCase.uploader.accountPassword
    );

    let mediaUuidPromiseList = [];

    for(let media of testCase.mediaList){
        mediaUuidPromiseList.push(uploader.registerMedia({
            title: media.title,
            type: media.type,
            description: media.description
        }));
    }
    
    let mediaUuidList = await Promise.all(mediaUuidPromiseList);

    for(let mediaUuid of mediaUuidList){
        await user.addBookmark(mediaUuid);
        assert.strictEqual(user.recentResponse.status, 200);
    }

    let generator = new BookmarkPageGenerator(user);

    await testUtil.assertEqualPage(mediaUuidList, generator);
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
                accountPassword: 'passwordpassword',
                nickname: 'viewer'
            },

            uploader: {
                accountId: 'uploader',
                accountPassword: 'passwordpassword',
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