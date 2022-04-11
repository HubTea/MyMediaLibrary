const express = require('express');
const http = require('http');
const uuid = require('uuid');
const path = require('path');
const assert = require('assert');

const {sendRequest} = require('./testUtil');

const serverConfig = require('../src/serverConfig');


describe('Test POST /v1/users', function(){
    this.timeout(5000);

    let reqOption;

    beforeEach(function(){
        reqOption = {
            hostname: 'localhost',
            port: serverConfig.port,
            headers: {
                'Content-Type': 'application/json'
            }
        };
    });

    it('Test valid account and password registration', async function(){
        let body = JSON.stringify({
            accountID: 'testAccount123',
            accountPassword: 'password#123',
            nickname: 'test'
        });

        reqOption.method = 'post';
        reqOption.path = '/v1/users';
        reqOption.headers['Content-Length'] = body.length;

        let res = await sendRequest(reqOption, body);

        let resHeader = res.res.headers;
        let resBody = res.body;

        console.log(resHeader);
        console.log(resBody.toString());

        let newUserUrl = resHeader.location;
        let newUserId = path.basename(newUserUrl);

        assert.ok(uuid.validate(newUserId));
    });
});
