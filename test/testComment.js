const assert = require('assert');
const uuid = require('uuid');

const dbInitializer = require('./dbInitializer');
const testUtil = require('./testUtil');


class MyCommentPageGenerator extends testUtil.PageGenerator{
    constructor(controller){
        super(controller);
    }

    generate(cursor){
        return this.controller.getMyCommentList({
            cursor: cursor
        }); 
    }
}

class MediaCommentPageGenerator extends testUtil.PageGenerator{
    constructor(controller, mediaUuid){
        super(controller);

        this.mediaUuid = mediaUuid;
    }

    generate(cursor){
        return this.controller.getMediaCommentList({
            mediaUuid: this.mediaUuid,
            cursor: cursor
        });
    }
}

class MediaChildCommentPageGenerator extends testUtil.PageGenerator{
    constructor(controller, mediaUuid, parentCommentUuid){
        super(controller);
        
        this.mediaUuid = mediaUuid;
        this.parentCommentUuid = parentCommentUuid;
    }

    generate(cursor){
        return this.controller.getMediaCommentList({
            mediaUuid: this.mediaUuid,
            cursor: cursor,
            parentCommentUuid: this.parentCommentUuid
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
    let [user, uploader] = await testUtil.createSignedControllerList(
        testUtil.localhostRequestOption, 
        [testCase.user, testCase.uploader]
    );

    let mediaUuid = await uploader.registerMedia({
        title: testCase.media.title,
        description: testCase.media.description,
        type: testCase.media.type
    });

    let commentUuidList = [];

    for(let comment of testCase.commentList){
        let location = await user.comment({
            mediaUuid: mediaUuid,
            content: comment.content
        });

        assert.strictEqual(user.recentResponse.status, 201);
        assert.ok(uuid.validate(location));   
        
        commentUuidList.push(location);
    }
    
    //let myCommentPageGenerator = new MyCommentPageGenerator(user);
    let mediaCommentPageGenerator = new MediaCommentPageGenerator(user, mediaUuid);

    //await testUtil.assertEqualOrderPage(commentUuidList, myCommentPageGenerator);
    await testUtil.assertEqualOrderPage(commentUuidList, mediaCommentPageGenerator);
}

/**
 * 업로더가 올린 컨텐츠에 유저가 하나의 댓글을 작성함.
 * 그 댓글에 업로더가 여러 개의 답글을 작성함.
 * 컨텐츠에 달린 댓글 조회 api를 통해서 답글이 모두
 * 조회되는지 검사함.
 * @param {*} testCase 
 */
async function testNestedComment(testCase){
    let [user, uploader] = await testUtil.createSignedControllerList(
        testUtil.localhostRequestOption, 
        [testCase.user, testCase.uploader]
    );
    
    let mediaUuid = await uploader.registerMedia({
        title: testCase.media.title,
        description: testCase.media.description,
        type: testCase.media.type
    });
    
    let parentCommentUuid = await user.comment({
        mediaUuid: mediaUuid,
        content: testCase.parentComment.content
    });

    let childCommentUuidList = [];

    for(let comment of testCase.childCommentList){
        let location = await uploader.comment({
            mediaUuid: mediaUuid,
            content: comment.content,
            parentCommentUuid: parentCommentUuid
        });

        assert.strictEqual(uploader.recentResponse.status, 201);
        assert.ok(uuid.validate(location));

        childCommentUuidList.push(location);
    }
    
    let generator = new MediaChildCommentPageGenerator(
        uploader, mediaUuid, parentCommentUuid
    );
    
    await testUtil.assertEqualOrderPage(childCommentUuidList, generator);
}

describe('/v1/medias/{mediaUuid}/comments', function(){
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