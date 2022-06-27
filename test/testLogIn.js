const assert = require('assert');
const jwt = require('jsonwebtoken');

const testUtil = require('./testUtil');

const serverConfig = require('../src/serverConfig');
const dbInitializer = require('./dbInitializer');


describe('GET /v1/auth 테스트', function(){

    beforeEach(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });


    it('등록된 유저 로그인 테스트', async function(){
        let requestBodyObject = {
            accountId: 'testAccount123',
            accountPassword: 'password#123'
        };
        
        let registUserRequest = testUtil.sendRegistUserRequest({
            accountId: requestBodyObject.accountId,
            accountPassword: requestBodyObject.accountPassword,
            nickname: 'test123'
        });
        await registUserRequest.getResponse();

        let logInRequest = testUtil.sendLogInRequest(requestBodyObject);
        let logInResponseBody = await logInRequest.getBodyObject();

        console.log(logInResponseBody);
        console.log(jwt.decode(logInResponseBody.token));
    });
});