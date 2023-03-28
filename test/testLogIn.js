const assert = require('assert');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const axios = require('axios').default;

const testUtil = require('./testUtil');
const error = require('../src/error');
const dbInitializer = require('./dbInitializer');
const { Controller } = require('../controller/controller');


async function testRegisteredUserLogIn(testCase){
    let client = axios.create(testUtil.localhostRequestOption);
    let user = new Controller(client);

    await user.registerUser(testCase.user);

    let session = await user.logIn(
        testCase.user.accountId, testCase.user.accountPassword
    );

    assert.strictEqual(user.recentResponse.status, 200);
    assert.ok(uuid.validate(session.userUuid));
    assert.ok(jwt.decode(session.token));
}

async function testUnregisteredUserLogIn(testCase){
    let client = axios.create(testUtil.localhostRequestOption);
    let user = new Controller(client);

    await user.logIn(
        testCase.unregisteredUser.accountId,
        testCase.unregisteredUser.accountPassword
    );

    assert.strictEqual(user.recentResponse.status, 400);
    assert.strictEqual(user.recentResponse.data.error.code, new error.UserNotExistError().errorCode);
}

describe('POST /v1/auth 테스트', function(){
    beforeEach(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });

    it('등록된 유저 로그인 테스트', async function(){
        let testCase = {
            user: {
                accountId: 'testAccount123',
                accountPassword: 'passwordpassword',
                nickname: 'test'
            }
        };

        await testRegisteredUserLogIn(testCase);
    });

    it(
        '등록되지 않은 계정으로 로그인하면 에러 코드를 보내는 지 확인',
        async function(){
            let testCase = {
                unregisteredUser: {
                    accountId: 'unregistered',
                    accountPassword: 'passwordpassword',
                    nickname: 'test'
                }
            };

            await testUnregisteredUserLogIn(testCase);
        }
    );
});