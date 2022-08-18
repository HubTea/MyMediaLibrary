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

class ChildCommentListRequestFactory extends testUtil.RequestFactory{
    constructor(mediaUuid, parentCommentUuid){
        super();
        this.mediaUuid = mediaUuid;
        this.parentCommentUuid = parentCommentUuid;
    }

    create(cursor){
        return testUtil.sendGetMediaCommentListRequest({
            mediaUuid: this.mediaUuid,
            parentCommentUuid: this.parentCommentUuid,
            cursor: cursor
        });
    }
}

/**
 * 업로더가 올린 컨텐츠에 유저가 댓글 여러 개를 작성함.
 * 컨텐츠에 달린 댓글 목록 조회 api와 유저가 단 댓글 목록 
 * 조회 api 각각에서 작성했던 댓글이 모두 조회가 되는지 검사함.
 * @param {*} testCase 
 */
async function testNotNestedComment(testCase){
    let userUuid = await testUtil.registerUser(testCase.user);
    let userToken = (await testUtil.logIn(testCase.user)).token;
    let uploaderUuid = await testUtil.registerUser(testCase.uploader);
    let uploaderToken = (await testUtil.logIn(testCase.uploader)).token;
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

/**
 * 업로더가 올린 컨텐츠에 유저가 하나의 댓글을 작성함.
 * 그 댓글에 업로더가 여러 개의 답글을 작성함.
 * 컨텐츠에 달린 댓글 조회 api를 통해서 답글이 모두
 * 조회되는지 검사함.
 * @param {*} option 
 */
async function testNestedComment(option){
    await testUtil.registerUser(option.user);
    await testUtil.registerUser(option.uploader);
    
    let userSession = await testUtil.logIn(option.user);
    let uploaderSession = await testUtil.logIn(option.uploader);
    let mediaUuid = await testUtil.registerMedia({
        userUuid: uploaderSession.userUuid,
        token: uploaderSession.token,
        title: option.media.title,
        description: option.media.description,
        type: option.media.type
    });
    let parentCommentUuid = await testUtil.comment({
        userUuid: userSession.userUuid,
        token: userSession.token,
        mediaUuid: mediaUuid,
        content: option.parentComment.content
    });

    let childCommentUuidList = [];

    for(let comment of option.childCommentList){
        let request = testUtil.sendRegisterCommentRequest({
            userUuid: uploaderSession.userUuid,
            token: uploaderSession.token,
            mediaUuid: mediaUuid,
            commentContent: comment.content,
            parentUuid: parentCommentUuid
        });
        let response = await request.getResponse();

        assert.strictEqual(response.statusCode, 201);
        assert.ok(uuid.validate(response.headers.location));

        childCommentUuidList.push(response.headers.location);
    }
    
    let factory = new ChildCommentListRequestFactory(mediaUuid, parentCommentUuid);
    
    await testUtil.assertEqualPage(childCommentUuidList, factory);
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
                accountPassword: 'passwordpassword',
                nickname: 'userNickname'
            },

            uploader: {
                accountId: 'uploaderAccount',
                accountPassword: 'passwordpassword',
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

    it('댓글에 달린 답글 작성 및 목록 조회 테스트', async function(){
        let testCase = {
            user: {
                accountId: 'user',
                accountPassword: 'passwordpassword',
                nickname: 'user'
            },
            uploader: {
                accountId: 'uploader',
                accountPassword: 'passwordpassword',
                nickname: 'uploader'
            },
            media: {
                title: 'media',
                description: 'media',
                type: 'image/png'
            },
            parentComment: {
                content: 'parent'
            },
            childCommentList: []
        };

        for(let i = 0; i < 60; i++){
            testCase.childCommentList.push({
                content: `child${i}`
            });
        }

        await testNestedComment(testCase);
    });
});