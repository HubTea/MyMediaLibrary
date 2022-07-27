const assert = require('assert');

const testUtil = require('./testUtil');
const dbInitializer = require('./dbInitializer');



async function testGetMyUploadList(option){
    let {userId: userUuid, token} = await testUtil.registerUserAndLogIn({
        accountId: option.user.accountId,
        accountPassword: option.user.accountPassword,
        nickname: option.user.nickname
    });
    
    let mediaUuidPromiseList = [];

    for(let media of option.uploadList){
        mediaUuidPromiseList.push(
            testUtil.registerMedia({
                userUuid: userUuid,
                token: token,
                title: media.title,
                type: media.type,
                description: media.description
            })
        );
    }

    let mediaUuidList = await Promise.all(mediaUuidPromiseList);
    let totalLength = 0;
    let cursor;

    while(true){
        let request = testUtil.sendGetMyUploadListRequest({
            userUuid: userUuid,
            cursor: cursor
        });
        let response = await request.getResponse();
        let body = await request.getBodyObject();
    
        assert.strictEqual(response.statusCode, 200);
        assert.ok(body);
        assert.ok(body.list);
        totalLength += body.list.length;

        for(let media of body.list){
            let index = mediaUuidList.indexOf(media.uuid);

            assert.notStrictEqual(index, -1);
            mediaUuidList.splice(index, 1);
        }

        if(body.cursor){
            cursor = body.cursor;
        }
        else{
            break;
        }
    }
    assert.strictEqual(totalLength, option.uploadList.length);
    
    assert.ok(!mediaUuidList.length);
}

describe('GET /v1/users/{userUuid}/medias 테스트', function(){
    beforeEach(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });

    it('123개의 미디어 등록 후 업로드 목록 조회 테스트', async function(){
        let testCase = {
            user: {
                accountId: 'tempAccount',
                accountPassword: 'tempPassword',
                nickname: 'tempNickname'
            },
            uploadList: []
        };

        for(let i = 0; i < 123; i++){
            testCase.uploadList.push({
                title: `video#${i}`,
                type: 'video/mp4',
                description: ''
            });
        }

        await testGetMyUploadList(testCase);
    });
});