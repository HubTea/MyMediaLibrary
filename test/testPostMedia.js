const assert = require('assert');

const testUtil = require('./testUtil');
const dbInitializer = require('./dbInitializer');


async function testPostMedia({title, description, type}){
    let {userId, token} = await testUtil.registerUserAndLogIn({
        accountId: 'tempId',
        accountPassword: 'tempPw',
        nickname: 'tempName'
    });

    let request = testUtil.sendPostMediaRequest({
        userId: userId,
        token: token,
        description: description,
        type: type,
        title: title        
    });
    let response = await request.getResponse();

    assert.strictEqual(response.statusCode, 201);
    assert.ok(response.headers.location);

    console.log(response.headers.location);
}

describe('/v1/users/{userId}/media 테스트', function(){
    beforeEach(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });

    it('미디어 정보 등록 후 미디어 ID 반환 테스트', async function(){
        await testPostMedia({
            title: 'media title',
            description: 'the first upload',
            type: 'image/jpeg'
        });
    });
});