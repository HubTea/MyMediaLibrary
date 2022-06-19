const assert = require('assert');
const jwt = require('jsonwebtoken');

const testUtil = require('./testUtil');

const serverConfig = require('../src/serverConfig');
const dbInitializer = require('./dbInitializer');


describe('GET /v1/auth 테스트', function(){
    let requestOption;
    let request = new testUtil.Request();

    after(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });

    beforeEach(function(){
        requestOption = {
            method: 'get',
            hostname: 'localhost',
            port: serverConfig.port,
            path: '/v1/auth',
            headers: {
                'Content-Type': 'application/json'
            }
        };
    });

    it('등록된 유저 로그인 테스트', async function(){
        let requestBodyObject = {
            accountId: 'testAccount123',
            accountPassword: 'password#123'
        };

        let requestBody = JSON.stringify(requestBodyObject);
        requestOption.headers['Content-Length'] = requestBody.length;

        await testUtil.registUser(JSON.stringify({
            accountId: requestBodyObject.accountId,
            accountPassword: requestBodyObject.accountPassword,
            nickname: 'test123'
        }));

        request.send(requestOption, requestBody);

        let responseBody = await request.getBodyObject();

        console.log(responseBody);
        console.log(jwt.decode(responseBody.token));
    });
});