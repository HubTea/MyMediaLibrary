const testUtil = require('./testUtil');
const dbInitializer = require('./dbInitializer');


class MyUploadPageGenerator extends testUtil.PageGenerator{
    constructor(controller){
        super(controller);
    }

    generate(cursor){
        return this.controller.getMyMediaList(cursor);
    }
}

async function testGetMyUploadList(testCase){
    let [user] = await testUtil.createSignedControllerList(
        testUtil.localhostRequestOption,
        [testCase.user]
    );
    
    let mediaUuidList = [];

    for(let media of testCase.uploadList){
        let mediaUuid = await user.registerMedia({
            title: media.title,
            description: media.description,
            type: media.type
        });
        mediaUuidList.push(mediaUuid);
    }

    let generator = new MyUploadPageGenerator(user);

    await testUtil.assertEqualOrderPage(mediaUuidList.reverse(), generator);
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