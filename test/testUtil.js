const http = require('http');
const serverConfig = require('../src/serverConfig');


class Request{
    constructor(){
        this.init();
    }

    init(){
        this.chunkList = [];
        this.option = null;
        this.requestBody = null;
        this.resolveSend = null;
        this.rejectSend = null;
        this.response = null;
        this.promiseSend = null;
    }
    
    /**
     * 
     * @returns {Promise<http.IncomingMessage>}
     */
    async getResponse(){
        let resultSend = await this.promiseSend;
        return resultSend.response;
    }

    async getBodyBuffer(){
        let resultSend = await this.promiseSend;
        return resultSend.body;
    }

    async getBodyObject(){
        let resultSend = await this.promiseSend;
        return JSON.parse(resultSend.body);
    }
    
    /**
     * 
     * @param {http.RequestOptions} options 
     * @param {string | Buffer} body 
     * @returns {Promise<object>}
     * ```
     * {
     *      response: http.IncommingMessage,
     *      body: Buffer
     * }
     * ```
     */
    send(option, body){
        this.init();
        this.option = option;
        this.requestBody = body;
        return (this.promiseSend = new Promise(this.fulfillSend.bind(this)));
    }

    fulfillSend(resolve, reject){
        this.resolveSend = resolve;
        this.rejectSend = reject;
        let request = http.request(this.option, this.bindResponseListener.bind(this));
        
        request.on('error', reject);
        request.write(this.requestBody);
        request.end();
    }

    bindResponseListener(response){
        this.response = response;
        response.on('error', this.rejectSend);
        response.on('data', this.appendChunk.bind(this));
        response.on('end', this.emitResponse.bind(this));
    }

    appendChunk(chunk){
        this.chunkList.push(chunk);
    }

    emitResponse(){
        this.resolveSend({
            response: this.response,
            body: Buffer.concat(this.chunkList)
        });
    }
}

function sendRegistUserRequest({accountId, accountPassword, nickname}){
    let requestBody = JSON.stringify({
        accountId: accountId,
        accountPassword: accountPassword,
        nickname: nickname
    });
    let requestOption = getRegistUserRequestOption(requestBody);

    let request = new Request();
    request.send(requestOption, requestBody);
    return request;
}

function getRegistUserRequestOption(requestBody){
    let requestOption = {
        method: 'post',
        hostname: 'localhost',
        port: serverConfig.port,
        path: '/v1/users',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': requestBody.length
        }
    };
    return requestOption;
}

function sendLogInRequest({accountId, accountPassword}){
    let requestBody = JSON.stringify({
        accountId: accountId,
        accountPassword: accountPassword,
    });
    let requestOption = getLogInRequestOption(requestBody);

    let request = new Request();
    request.send(requestOption, requestBody);
    return request;
}

function getLogInRequestOption(requestBody){
    let requestOption = {
        method: 'get',
        hostname: 'localhost',
        port: serverConfig.port,
        path: '/v1/auth',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': requestBody.length
        }
    };
    return requestOption;
}

module.exports = {
    Request: Request,

    sendRegistUserRequest: sendRegistUserRequest,
    sendLogInRequest: sendLogInRequest,

    getRegistUserRequestOption: getRegistUserRequestOption,
    getLogInRequestOption: getLogInRequestOption
};