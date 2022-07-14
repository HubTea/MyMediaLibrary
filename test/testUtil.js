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

        if(resultSend.body.length === 0){
            return {};
        }
        return JSON.parse(resultSend.body);
    }
    
    /**
     * 
     * @param {http.RequestOptions} options 
     * @param {string | Buffer} body 
     * @returns {Promise<object>}
     * ```
     * {
     *      response: http.IncomingMessage,
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


function sendRegisterUserRequest({accountId, accountPassword, nickname}){
    let requestBody = JSON.stringify({
        accountId: accountId,
        accountPassword: accountPassword,
        nickname: nickname
    });
    let requestOption = getRegisterUserRequestOption(requestBody);

    let request = new Request();
    request.send(requestOption, requestBody);
    return request;
}

function getRegisterUserRequestOption(requestBody){
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
        method: 'post',
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

function sendPatchUserMetadataRequest({userId, token, nickname, introduction}){
    let requestBody = JSON.stringify({
        nickname: nickname,
        introduction: introduction
    });
    let requestOption = getPatchUserMetadataOption(userId, token, requestBody);

    let request = new Request();
    request.send(requestOption, requestBody);
    return request;
}

function getPatchUserMetadataOption(userId, token, requestBody){
    let requestOption = {
        method: 'patch',
        hostname: 'localhost',
        port: serverConfig.port,
        path: `/v1/users/${userId}/info`,
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
            'Content-Length': requestBody.length
        }
    };
    return requestOption;
}

function sendGetUserMetadataRequest({userId}){
    let requestOption = getGetUserMetadataOption(userId);

    let request = new Request();
    request.send(requestOption, "");
    return request;
}

function getGetUserMetadataOption(userId){
    let requestOption = {
        method: 'get',
        hostname: 'localhost',
        port: serverConfig.port,
        path: `/v1/users/${userId}/info`
    };
    return requestOption;
}

async function registerUserAndLogIn({accountId, accountPassword, nickname}){
    let registerUserRequest = sendRegisterUserRequest({
        accountId: accountId,
        accountPassword: accountPassword,
        nickname: nickname
    });
    let registerUserResponse = await registerUserRequest.getResponse();
    let userPath = registerUserResponse.headers.location;
    let splittedPath = userPath.split('/');
    let userId = splittedPath[splittedPath.length - 1];

    let logInRequest = sendLogInRequest({
        accountId: accountId,
        accountPassword: accountPassword
    });
    let logInBody = await logInRequest.getBodyObject();
    let token = logInBody.token;

    return {
        userId: userId,
        token: token,
    };
}

function sendPostMediaRequest({userId, token, title, description, type}){
    let body = JSON.stringify({
        title: title,
        description: description,
        type: type
    });
    let option = getPostMediaRequestOption(body, userId, token);

    let request = new Request();
    request.send(option, body);
    return request;
}

function getPostMediaRequestOption(body, userId, token){
    return {
        method: 'post',
        hostname: 'localhost',
        port: serverConfig.port,
        path: `/v1/users/${userId}/medias`,
        headers: {
            'Content-Length': body.length,
            'Content-Type': 'application/json',
            'Authorization': token
        }
    };
}

module.exports = {
    Request,

    sendRegisterUserRequest,
    sendLogInRequest,
    sendPatchUserMetadataRequest,
    sendGetUserMetadataRequest,
    sendPostMediaRequest,

    registerUserAndLogIn
};