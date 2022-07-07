const assert = require('assert');
const jwt = require('jsonwebtoken');

const testUtil = require('./testUtil');

const serverConfig = require('../src/serverConfig');
const dbInitializer = require('./dbInitializer');


async function testLogIn({accountId, accountPassword}){
    let registUserRequest = testUtil.sendRegisterUserRequest({
        accountId: accountId,
        accountPassword: accountPassword,
        nickname: 'test'
    });
    await registUserRequest.getResponse();

    let logInRequest = testUtil.sendLogInRequest({
        accountId: accountId,
        accountPassword: accountPassword
    });
    let logInResponseBody = await logInRequest.getBodyObject();

    console.log(logInResponseBody);
    console.log(jwt.decode(logInResponseBody.token));
}

describe('GET /v1/auth 테스트', function(){
    beforeEach(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });

    it('등록된 유저 로그인 테스트', async function(){
        await testLogIn({
            accountId: 'testAccount123',
            accountPassword: 'password#123'
        });
    });
});