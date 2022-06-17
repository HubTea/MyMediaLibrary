const express = require('express');
const http = require('http');
const uuid = require('uuid');
const path = require('path');
const assert = require('assert');

const testUtil = require('./testUtil');
const serverConfig = require('../src/serverConfig');
const dbInitializer = require('./dbInitializer');


describe('POST /v1/users 테스트', function(){
    let requestOption;
    let request = new testUtil.Request();

    after(function(){
        dbInitializer.initialize({
            logging: false
        });
    });

    it('유효한 id와 pw 등록 테스트', async function(){
        let requestBody = JSON.stringify({
            accountId: 'testAccount123',
            accountPassword: 'password#123',
            nickname: 'test123'
        });
        requestOption = testUtil.getRegistUserRequestOption(requestBody);

        request.send(requestOption, requestBody);

        let response = await request.getResponse();
        let responseHeader = response.headers;
        let responseBody = await request.getBodyBuffer();

        console.log(responseHeader);
        console.log(responseBody);

        assert.ok(typeof responseHeader.location === 'string');

        let newUserUrl = responseHeader.location;
        let newUserId = path.basename(newUserUrl);

        assert.ok(uuid.validate(newUserId));
    });
});
