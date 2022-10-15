const express = require('express');
const http = require('http');
const uuid = require('uuid');
const path = require('path');
const assert = require('assert');
const axios = require('axios').default;

const testUtil = require('./testUtil');
const error = require('../src/error');
const dbInitializer = require('./dbInitializer');
const { Controller } = require('../controller/controller');


async function testRegisterUser(testCase){
    let client = axios.create(testUtil.localhostRequestOption);
    let user = new Controller(client);

    await user.registerUser(testCase.user);

    let response = user.recentResponse;

    assert.strictEqual(response.status, 201);
    assert.ok(uuid.validate(response.headers.location));
}


async function testRegisterDuplicatedUser(testCase){
    let client = axios.create(testUtil.localhostRequestOption);
    let user = new Controller(client);

    await user.registerUser(testCase.user);
    await user.registerUser(testCase.user);

    let response = user.recentResponse;

    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.data.error.code, new error.UserAlreadyExistError().errorCode);
}

describe('POST /v1/users 테스트', function(){
    beforeEach(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });

    it(
        '유효한 id와 password를 등록하면 서버가 응답으로 ' + 
        'Location 헤더에 등록된 유저의 URL을 전달해주는지 테스트', 
        async function(){
            let testCase = {
                user: {
                    accountId: 'testAccount123',
                    accountPassword: 'passwordpassword',
                    nickname: 'test123'
                }
            };

            await testRegisterUser(testCase);
        }
    );

    it(
        '이미 등록된 id를 등록하려고 하면 서버가 응답으로 오류 메시지를 전달하는지 테스트',
        async function(){
            let testCase = {
                user: {
                    accountId: 'duplicate',
                    accountPassword: 'passwordpassword',
                    nickname: 'duplicate'
                }
            };

            await testRegisterDuplicatedUser(testCase);
        }
    );
});
