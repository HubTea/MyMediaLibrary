const assert = require('assert');
const jwt = require('jsonwebtoken');

const {sendRequest} = require('./testUtil');

const serverConfig = require('../src/serverConfig');


describe('Test GET /v1/auth', function(){

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

    it('Test exist user login', async function(){
        let body = JSON.stringify({
            accountId: 'testAccount123',
            accountPassword: 'password#123'
        });

        reqOption.method = 'get';
        reqOption.path = '/v1/auth';
        reqOption.headers['Content-Length'] = body.length;

        let res = await sendRequest(reqOption, body);
        console.log(res.body.toString());
        console.log(jwt.decode(JSON.parse(res.body).token));

        
    });
});