const express = require('express');
const http = require('http');
const uuid = require('uuid');
const path = require('path');
const assert = require('assert');

const serverConfig = require('../src/serverConfig');


function sendRequest(option, body, callback){
    let chunks = [];

    let req = http.request(option, function(res){
        res.on('data', function(chunk){
            chunks.push(chunk);
        });

        res.on('end', function(){
            callback(res, Buffer.concat(chunks));
        });
    });

    req.write(body);
    req.end();
}


describe('Test POST /v1/users', function(){
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

    it('Test valid account and password registration', function(done){
        let body = JSON.stringify({
            accountID: 'testAccount',
            accountPassword: 'password',
            nickname: 'test'
        });

        reqOption.method = 'post';
        reqOption.path = '/v1/users';
        reqOption.headers['Content-Length'] = body.length;

        sendRequest(reqOption, body, function(res, resBody){
            console.log(res.headers);
            console.log(resBody.toString());

            let newUserUrl = res.headers.location;
            let newUserId = path.basename(newUserUrl);

            assert.ok(uuid.validate(newUserId));
            done();
        });
    });
});
