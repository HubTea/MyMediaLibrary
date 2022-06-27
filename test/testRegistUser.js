const express = require('express');
const http = require('http');
const uuid = require('uuid');
const path = require('path');
const assert = require('assert');

const testUtil = require('./testUtil');
const serverConfig = require('../src/serverConfig');
const dbInitializer = require('./dbInitializer');


async function registUser({accountId, accountPassword, nickname}){
    let request = testUtil.sendRegistUserRequest({accountId, accountPassword, nickname});
    let response = await request.getResponse();
    assertLocationHeader(response);
}


function assertLocationHeader(response){
    let responseHeader = response.headers;

    console.log(`response header: ${responseHeader}`);

    assert.ok(typeof responseHeader.location === 'string');

    let newUserUrl = responseHeader.location;
    let newUserId = path.basename(newUserUrl);

    assert.ok(uuid.validate(newUserId));
}


async function registDuplicatedUser({accountId, accountPassword, nickname}){
    let newUserRequest = testUtil.sendRegistUserRequest({accountId, accountPassword, nickname});
    await newUserRequest.getResponse();

    let duplicatedUserRequest = testUtil.sendRegistUserRequest({accountId, accountPassword, nickname});
    let response = await duplicatedUserRequest.getResponse();

    assertErrorResponse(response);
}


function assertErrorResponse(response){
    assert.strictEqual(response.statusCode === 400);
}


describe('POST /v1/users 테스트', function(){
    beforeEach(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });


    it('유효한 id와 password를 등록하면 서버가 응답으로 Location 헤더에 등록된 유저의 URL을 전달해주는지 테스트', async function(){
        await registUser({
            accountId: 'testAccount123',
            accountPassword: 'password#123',
            nickname: 'test123'
        });
    });


    it('이미 등록된 id를 등록하려고 하면 서버가 응답으로 오류 메시지를 전달하는지 테스트', async function(){
        await registDuplicatedUser({
            accountId: 'duplicate',
            accountPassword: 'duplicate',
            nickname: 'duplicate'
        });
    });
});
