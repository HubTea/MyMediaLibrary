const assert = require('assert');
const uuid = require('uuid');

const dbInitializer = require('./dbInitializer');
const testUtil = require('./testUtil');


class MyCommentListRequestFactory extends testUtil.RequestFactory{
    constructor(userUuid){
        super();
        this.userUuid = userUuid;
    }

    create(cursor){
        return testUtil.sendGetMyCommentListRequest({
            userUuid: this.userUuid,
            cursor: cursor
        });
    }
}

class MediaCommentListRequestFactory extends testUtil.RequestFactory{
    constructor(mediaUuid){
        super();
        this.mediaUuid = mediaUuid;
    }

    create(cursor){
        return testUtil.sendGetMediaCommentListRequest({
            mediaUuid: this.mediaUuid,
            cursor: cursor
        });
    }
}

async function testNotNestedComment(testCase){
    let userUuid = await testUtil.registerUser(testCase.user);
    let userToken = await testUtil.logIn(testCase.user);
    let uploaderUuid = await testUtil.registerUser(testCase.uploader);
    let uploaderToken = await testUtil.logIn(testCase.uploader);
    let mediaUuid = await testUtil.registerMedia({
        userUuid: uploaderUuid,
        token: uploaderToken,
        title: testCase.media.title,
        description: testCase.media.description,
        type: testCase.media.type
    });

    let commentUuidList = [];

    for(let comment of testCase.commentList){
        let registerCommentRequest = testUtil.sendRegisterCommentRequest({
            userUuid: userUuid,
            token: userToken,
            mediaUuid: mediaUuid,
            commentContent: comment.content
        });
        let registerCommentResponse = await registerCommentRequest.getResponse();

        assert.strictEqual(registerCommentResponse.statusCode, 201);
        assert.ok(uuid.validate(registerCommentResponse.headers.location));   
        
        commentUuidList.push(registerCommentResponse.headers.location);
    }
    
    let myCommentListRequestFactory = new MyCommentListRequestFactory(userUuid);

    await testUtil.assertEqualPage(commentUuidList, myCommentListRequestFactory);

    let mediaCommentListRequestFactory = new MediaCommentListRequestFactory(mediaUuid);

    await testUtil.assertEqualPage(commentUuidList, mediaCommentListRequestFactory);
}

describe('/v1/medias/{mediaUuid}/comments, /v1/users/{userUuid}/comments 테스트', function(){
    beforeEach(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });

    it('댓글 등록 및 댓글 목록 조회 테스트', async function(){
        let testCase = {
            user: {
                accountId: 'userAccount',
                accountPassword: 'password',
                nickname: 'userNickname'
            },

            uploader: {
                accountId: 'uploaderAccount',
                accountPassword: 'password',
                nickname: 'uploaderNickname'
            },

            media: {
                title: 'comment test',
                description: 'comment test',
                type: 'image/png'
            },

            commentList: []
        };

        for(let i = 0; i < 60; i++){
            testCase.commentList.push({
                content: `comment${i}`
            });
        }

        await testNotNestedComment(testCase);
    });
});