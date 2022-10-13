const assert = require('assert');

const testUtil = require('./testUtil');
const dbInitializer = require('./dbInitializer');


async function testGetMediaMetadata({title, description, type, tagList}){
    let tempAccount = 'tempAccount';
    let tempPassword = 'passwordpassword';
    let tempNickname = 'tempNickname';

    let [user] = await testUtil.createSignedControllerList(
        testUtil.localhostRequestOption,
        [{
            accountId: tempAccount,
            accountPassword: tempPassword,
            nickname: tempNickname
        }]
    );

    let mediaUuid = await user.registerMedia({
        description: description,
        type: type,
        title: title,
        tagList: tagList 
    });

    let metadata = await user.getMediaInfo(mediaUuid);

    assert.strictEqual(user.recentResponse.status, 200);
    assert.strictEqual(metadata.title, title);
    assert.strictEqual(metadata.description, description);
    assert.strictEqual(metadata.type, type);
    assert.strictEqual(metadata.viewCount, 1);
    assert.strictEqual(metadata.dislikeCount, 0);
    assert.strictEqual(metadata.uploader.uuid, user.session.userUuid);
    assert.strictEqual(metadata.uploader.nickname, tempNickname);

    if(Array.isArray(tagList)){
        assert.deepStrictEqual(metadata.tagList, tagList);
    }
    else{
        assert.deepStrictEqual(metadata.tagList, []);
    }

    let updatedMs = new Date(metadata.updateTime).getTime();
    let now = new Date().getTime();
    assert.ok(Math.abs(updatedMs - now) < 5 * 1000);
}


describe('GET /v1/medias/{mediaId}/info 테스트', function(){
    beforeEach(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });

    it('미디어 등록 후 조회 테스트', async function(){
        await testGetMediaMetadata({
            title: 'title title',
            description: 'description description',
            type: 'image/jpeg',
            tagList: ['a', 'b', 'c']
        });
    });
});