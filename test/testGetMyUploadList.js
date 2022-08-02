const assert = require('assert');

const testUtil = require('./testUtil');
const dbInitializer = require('./dbInitializer');


class GetMyUploadListRequestFactory extends testUtil.RequestFactory{
    constructor(uploaderUuid){
        super();
        this.uploaderUuid = uploaderUuid;
    }

    create(cursor){
        return testUtil.sendGetMyUploadListRequest({
            userUuid: this.uploaderUuid,
            cursor: cursor
        });
    }
}

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
    let factory = new GetMyUploadListRequestFactory(userUuid);

    await testUtil.assertEqualPage(mediaUuidList, factory);
}

describe('GET /v1/users/{userUuid}/medias 테스트', function(){
    beforeEach(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });

    it('미디어 등록 후 업로드 목록 조회 테스트', async function(){
        let testCase = {
            user: {
                accountId: 'tempAccount',
                accountPassword: 'passwordpassword',
                nickname: 'tempNickname'
            },
            uploadList: []
        };

        for(let i = 0; i < 60; i++){
            testCase.uploadList.push({
                title: `video${i}`,
                type: 'video/mp4',
                description: ''
            });
        }

        await testGetMyUploadList(testCase);
    });
});