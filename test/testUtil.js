const http = require('http');

/**
 * 
 * @param {http.RequestOptions} options http모듈에서 http.request 메서드의 options
 * @param {Buffer | string} body http body
 * @returns {Promise<object>} 
 * ```
 * {
 *      res: http모듈에서 http.request 메서드로 보낸 요청에 대한 응답
 *      body: 응답의 http body
 * }
 * ```
 */
async function sendRequest(options, body){
    let chunks = [];
    return new Promise(asyncRequest);

    function asyncRequest(resolve, reject){
        let req = http.request(options, bindResponseListener);
        req.on('error', reject);
        req.write(body);
        req.end();

        function bindResponseListener(res){
            res.on('error', reject);
            res.on('data', appendChunk);
            res.on('end', emitResponse);

            function appendChunk(chunk){
                chunks.push(chunk);
            }

            function emitResponse(){
                resolve({
                    res, 
                    body: Buffer.concat(chunks)
                });
            }
        }
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

module.exports = {
    Request: Request,
    sendRequest: sendRequest
};