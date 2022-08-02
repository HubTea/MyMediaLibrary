const express = require('express');
const http = require('http');
const uuid = require('uuid');
const path = require('path');
const assert = require('assert');

const testUtil = require('./testUtil');
const error = require('../src/error');
const dbInitializer = require('./dbInitializer');


async function testRegisterUser({accountId, accountPassword, nickname}){
    let request = testUtil.sendRegisterUserRequest({
        accountId, accountPassword, nickname
    });
    let response = await request.getResponse();

    assertUserUrlIn(response);
}

function assertUserUrlIn(response){
    let responseHeader = response.headers;

    assert.ok(typeof responseHeader.location === 'string');

    let newUserUuid = responseHeader.location;

    assert.strictEqual(response.statusCode, 201);
    assert.ok(uuid.validate(newUserUuid));
}

async function testRegisterDuplicatedUser({accountId, accountPassword, nickname}){
    let newUserRequest = testUtil.sendRegisterUserRequest({
        accountId, accountPassword, nickname
    });
    await newUserRequest.getResponse();

    let duplicatedUserRequest = testUtil.sendRegisterUserRequest({
        accountId, accountPassword, nickname
    });
    let response = await duplicatedUserRequest.getResponse();
    let body = await duplicatedUserRequest.getBodyObject();

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(body.error.code, new error.UserAlreadyExistError().errorCode);
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
            await testRegisterUser({
                accountId: 'testAccount123',
                accountPassword: 'passwordpassword',
                nickname: 'test123'
            });
        }
    );

    it(
        '이미 등록된 id를 등록하려고 하면 서버가 응답으로 오류 메시지를 전달하는지 테스트',
        async function(){
            await testRegisterDuplicatedUser({
                accountId: 'duplicate',
                accountPassword: 'passwordpassword',
                nickname: 'duplicate'
            });
        }
    );
});
