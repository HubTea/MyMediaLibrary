const http = require('http');

/**
 * 
 * @param {object} options http모듈에서 http.request 메서드의 options
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

    function asyncRequest(resolve, reject){
        let req = http.request(options, function(res){
            res.on('data', function(chunk){
                chunks.push(chunk);
            });

            res.on('end', function(){
                resolve({
                    res, 
                    body: Buffer.concat(chunks)
                });
            });
        });

        req.on('error', reject);
    
        req.write(body);
        req.end();
    }
    
    return new Promise(asyncRequest);
}


module.exports = {
    sendRequest
};