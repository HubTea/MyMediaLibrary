const http = require('http');
const assert = require('assert');
const qs = require('qs');

const serverConfig = require('../src/serverConfig');


function defaultQuerySerializer(query){
    return qs.stringify(query, {
        arrayFormat: 'repeat'
    });
}

const localhostRequestOption = {
    baseURL: `http://localhost:${serverConfig.port}/v1/`,
    paramsSerializer: defaultQuerySerializer,
    ValidityState: null
};

class RequestOptionBuilder{
    constructor(base){
        this.base = Object.assign({}, base);
    }

    export(){
        return this.base;
    }

    setToken(token){
        if(this.base.headers){
            this.base.headers.Authorization = token;
        }
        else{
            this.base.headers = {
                Authorization: token
            };
        }

        return this;
    }
}


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

function sendRegisterMediaRequest({userId, token, title, description, type, tagList}){
    let body = JSON.stringify({
        title: title,
        description: description,
        type: type,
        tagList: tagList
    });
    let option = getRegisterMediaRequestOption(body, userId, token);

    let request = new Request();
    request.send(option, body);
    return request;
}

function getRegisterMediaRequestOption(body, userId, token){
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

function sendUploadMediaRequest({mediaId, content, type, token}){
    let body = content;
    let option = getUploadMediaRequestOption(mediaId, body, type, token);

    let request = new Request();
    request.send(option, body);
    return request;
}

function getUploadMediaRequestOption(mediaId, body, type, token){
    return {
        method: 'post',
        hostname: 'localhost',
        port: serverConfig.port,
        path: `/v1/medias/${mediaId}`,
        headers: {
            'Content-Length': body.length,
            'Content-Type': type,
            'Authorization': token
        }
    };
}

function sendDownloadMediaRequest({mediaId}){
    let body = '';
    let option = getDownloadMediaRequestOption(mediaId);

    let request = new Request();
    request.send(option, body);
    return request;
}

function getDownloadMediaRequestOption(mediaId){
    return {
        method: 'get',
        hostname: 'localhost',
        port: serverConfig.port,
        path: `/v1/medias/${mediaId}`,
        headers: {

        }
    };
}

function sendGetMediaMetadataRequest({mediaId}){
    let body = '';
    let option = getGetMediaMetadataRequestOption(mediaId);

    let request = new Request();
    request.send(option, body);
    return request;
}

function getGetMediaMetadataRequestOption(mediaId){
    return {
        method: 'get',
        hostname: 'localhost',
        port: serverConfig.port,
        path: `/v1/medias/${mediaId}/info`,
        headers: {

        }
    };
}

function sendGetMyUploadListRequest({userUuid, length, cursor}){
    let option = getGetMyUploadListRequestOption(userUuid, length, cursor);

    let request = new Request();
    request.send(option, '');
    return request;
}

function getGetMyUploadListRequestOption(userUuid, length, cursor){
    let path = `/v1/users/${userUuid}/medias?`;

    if(length){
        path += `length=${length}&`;
    }

    if(cursor){
        path += `cursor=${cursor}`;
    }

    return {
        method: 'get',
        hostname: 'localhost',
        port: serverConfig.port,
        path: path
    };
}

function sendSubscribeRequest({subscriberUuid, uploaderUuid, subscriberToken}){
    let body = JSON.stringify({
        uploaderUuid: uploaderUuid
    });
    let option = getSubscribeRequestOption(body, subscriberUuid, subscriberToken);

    let request = new Request();
    request.send(option, body);
    return request;
}

function getSubscribeRequestOption(body, subscriberUuid, subscriberToken){
    return {
        method: 'post',
        hostname: 'localhost',
        port: serverConfig.port,
        path: `/v1/users/${subscriberUuid}/following`,
        headers: {
            'Authorization': subscriberToken,
            'Content-Length': body.length,
            'Content-Type': 'application/json'
        }
    };
}

function sendGetFollowingListRequest({subscriberUuid, length, cursor}){
    let option = getGetFollowingListRequestOption(subscriberUuid, length, cursor);

    let request = new Request();
    request.send(option, '');
    return request;
}

function getGetFollowingListRequestOption(subscriberUuid, length, cursor){
    let path = `/v1/users/${subscriberUuid}/following?`;

    if(length){
        path += `length=${length}&`;
    }

    if(cursor){
        path += `cursor=${cursor}`;
    }

    return {
        method: 'get',
        hostname: 'localhost',
        port: serverConfig.port,
        path: path,
    };
}

function sendGetBookmarkRequest({userUuid, length, cursor}){
    let option = getGetBookmarkRequestOption(userUuid, length, cursor);
    let request = new Request();

    request.send(option, '');
    return request;
}

function getGetBookmarkRequestOption(userUuid, length, cursor){
    let path = `/v1/users/${userUuid}/bookmarks?`;

    if(length){
        path += `length=${length}&`;
    }

    if(cursor){
        path += `cursor=${cursor}`;
    }

    return {
        method: 'get',
        hostname: 'localhost',
        port: serverConfig.port,
        path: path
    };
}

function sendAppendBookmarkRequest({userUuid, token, mediaUuid}){
    let body = JSON.stringify({
        mediaUuid: mediaUuid
    });
    let option = getAppendBookmarkRequestOption(body, userUuid, token);
    let request = new Request();

    request.send(option, body);
    return request;
}

function getAppendBookmarkRequestOption(body, userUuid, token){
    return {
        method: 'post',
        hostname: 'localhost',
        port: serverConfig.port,
        path: `/v1/users/${userUuid}/bookmarks`,
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
            'Content-Length': body.length
        }
    };
}

function sendRegisterCommentRequest({userUuid, token, mediaUuid, commentContent, parentUuid}){
    let body = JSON.stringify({
        writerUuid: userUuid,
        content: commentContent,
        parentUuid: parentUuid
    });
    let option = getRegisterCommentRequestOption(body, mediaUuid, token);
    let request = new Request();

    request.send(option, body);
    return request;
}

function getRegisterCommentRequestOption(body, mediaUuid, token){
    return {
        method: 'post',
        hostname: 'localhost',
        port: serverConfig.port,
        path: `/v1/medias/${mediaUuid}/comments`,
        headers: {
            'Content-Length': body.length,
            'Content-Type': 'application/json',
            'Authorization': token
        }
    };
}

function sendGetMyCommentListRequest({userUuid, length, cursor, parentCommentUuid}){
    let option = getGetMyCommentListRequestOption(userUuid, length, cursor, parentCommentUuid);
    let request = new Request();

    request.send(option, '');
    return request;
}

function getGetMyCommentListRequestOption(userUuid, length, cursor, parentCommentUuid){
    let path = `/v1/users/${userUuid}/comments?`;

    if(length){
        path += `length=${length}&`;
    }

    if(cursor){
        path += `cursor=${cursor}&`;
    }

    if(parentCommentUuid){
        path += `parentUuid=${parentCommentUuid}`;
    }

    return {
        method: 'get',
        hostname: 'localhost',
        port: serverConfig.port,
        path: path
    };
}

function sendGetMediaCommentListRequest({mediaUuid, length, cursor, parentCommentUuid}){
    let option = getGetMediaCommentListRequestOption(mediaUuid, length, cursor, parentCommentUuid);
    let request = new Request();

    request.send(option, '');
    return request;
}

function getGetMediaCommentListRequestOption(mediaUuid, length, cursor, parentCommentUuid){
    let path = `/v1/medias/${mediaUuid}/comments?`;

    if(length){
        path += `length=${length}&`;
    }

    if(cursor){
        path += `cursor=${cursor}&`;
    }

    if(parentCommentUuid){
        path += `parentUuid=${parentCommentUuid}`;
    }

    return {
        method: 'get',
        hostname: 'localhost',
        port: serverConfig.port,
        path: path
    };
}


async function registerUser({accountId, accountPassword, nickname}){
    let registerUserRequest = sendRegisterUserRequest({
        accountId: accountId,
        accountPassword: accountPassword,
        nickname: nickname
    });
    let registerUserResponse = await registerUserRequest.getResponse();
    let userUuid = registerUserResponse.headers.location;

    return userUuid;
}

async function logIn({accountId, accountPassword}){
    let logInRequest = sendLogInRequest({
        accountId: accountId,
        accountPassword: accountPassword
    });
    let logInBody = await logInRequest.getBodyObject();
    let userUuid = logInBody.userUuid; 
    let token = logInBody.token;

    return {
        userUuid: userUuid,
        token: token
    };
}

async function registerUserAndLogIn({accountId, accountPassword, nickname}){
    return {
        userId: await registerUser({
            accountId: accountId,
            accountPassword: accountPassword,
            nickname: nickname
        }),
        token: (await logIn({
            accountId: accountId,
            accountPassword: accountPassword
        })).token,
    };
}

async function registerMedia({userUuid, token, title, type, description, tagList}){
    let registerMediaRequest = sendRegisterMediaRequest({
        userId: userUuid,
        token: token,
        description: description,
        type: type,
        title: title,
        tagList: tagList        
    });
    let registerMediaResponse = await registerMediaRequest.getResponse();
    let mediaUuid = registerMediaResponse.headers.location;

    return mediaUuid;
}

async function comment({userUuid, token, mediaUuid, content, parentCommentUuid}){
    let request = sendRegisterCommentRequest({
        userUuid: userUuid,
        token: token,
        mediaUuid: mediaUuid,
        commentContent: content,
        parentUuid: parentCommentUuid
    });
    let response = await request.getResponse();
    let commentUuid = response.headers.location;

    return commentUuid;
}


class PageAssembler{
    /**
     * 
     * @param {RequestFactory} requestFactory 
     */
    constructor(requestFactory){
        this.requestFactory = requestFactory;
    }

    async assemble(){
        let list = [];
        let cursor;
    
        while(true){
            let request = this.requestFactory.create(cursor);
            let response = await request.getResponse();
            let body = await request.getBodyObject();
    
            assert.strictEqual(response.statusCode, 200);
            assert.ok(body);
            assert.ok(body.list);
    
            list = list.concat(body.list);
    
            if(body.cursor){
                cursor = body.cursor;
            }
            else{
                break;
            }
        }
    
        return list;
    }
}

class RequestFactory{
    constructor(){

    }

    /**
     * 
     * @param {string | undefined} cursor 
     * @return {Request}
     */
    create(cursor){

    }
}

async function assertEqualPage(uuidList, requestFactory){
    await comparePage(uuidList, requestFactory, compareSetEquality);
}

async function assertEqualOrderPage(uuidList, requestFactory){
    await comparePage(uuidList, requestFactory, compareOrderEquality);
}

async function comparePage(uuidList, requestFactory, comparator){
    let assembler = new PageAssembler(requestFactory);
    let assembledPage = await assembler.assemble();
    let uuidListClone = JSON.parse(JSON.stringify(uuidList));

    comparator(uuidListClone, assembledPage);
}

function compareSetEquality(uuidList, assembledPage){
    assert.strictEqual(assembledPage.length, uuidList.length);
    for(let element of assembledPage){
        let index = uuidList.indexOf(element.uuid);

        assert.notStrictEqual(index, -1);
        uuidList.splice(index, 1);
    }
    assert.strictEqual(uuidList.length, 0);
}

function compareOrderEquality(uuidList, assembledPage){
    assert.strictEqual(assembledPage.length, uuidList.length);
    for(let i = 0; i < assembledPage.length; i++){
        assert.strictEqual(assembledPage[i].uuid, uuidList[i]);
    }
}

module.exports = {
    localhostRequestOption,

    Request,
    RequestOptionBuilder,
    PageAssembler,
    RequestFactory,
    assertEqualPage,
    assertEqualOrderPage,

    sendRegisterUserRequest,
    sendLogInRequest,
    sendPatchUserMetadataRequest,
    sendGetUserMetadataRequest,
    sendRegisterMediaRequest,
    sendUploadMediaRequest,
    sendDownloadMediaRequest,
    sendGetMediaMetadataRequest,
    sendGetMyUploadListRequest,
    sendSubscribeRequest,
    sendGetFollowingListRequest,
    sendGetBookmarkRequest,
    sendAppendBookmarkRequest,
    sendRegisterCommentRequest,
    sendGetMyCommentListRequest,
    sendGetMediaCommentListRequest,

    registerUser,
    logIn,
    registerUserAndLogIn,
    registerMedia,
    comment
};