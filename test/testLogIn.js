const assert = require('assert');
const jwt = require('jsonwebtoken');

const testUtil = require('./testUtil');
const error = require('../src/error');
const dbInitializer = require('./dbInitializer');


async function testRegisteredUserLogIn({accountId, accountPassword}){
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
    let logInResponse = await logInRequest.getResponse();
    let logInResponseBody = await logInRequest.getBodyObject();

    assert.strictEqual(logInResponse.statusCode, 200);

    console.log(logInResponseBody);
    console.log(jwt.decode(logInResponseBody.token));
}

async function testUnregisteredUserLogIn({accountId, accountPassword}){
    let request = testUtil.sendLogInRequest({
        accountId: accountId,
        accountPassword: accountPassword
    });
    let response = await request.getResponse();
    let body = await request.getBodyObject();

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(body.error.code, new error.UserNotExistError().errorCode);
}

describe('GET /v1/auth 테스트', function(){
    beforeEach(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });

    it('등록된 유저 로그인 테스트', async function(){
        await testRegisteredUserLogIn({
            accountId: 'testAccount123',
            accountPassword: 'password#123'
        });
    });

    it(
        '등록되지 않은 계정으로 로그인하면 에러 코드를 보내는 지 확인',
        async function(){
            await testUnregisteredUserLogIn({
                accountId: 'unregistered',
                accountPassword: 'unregistered'
            });
        }
    );
});