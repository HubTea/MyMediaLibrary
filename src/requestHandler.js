const auth = require('./authorizer');
const jwt = require('jsonwebtoken');
const serverConfig = require('./serverConfig');


async function sendAuthorizer(res, authorizer){
    return new Promise(function(resolve, reject){
        jwt.sign(
            {
                authorizer: authorizer.export()
            }, 

            serverConfig.key.private, 

            {
                expiresIn: '7d'
            },

            function(err, token){
                if(err){
                    //에러 객체 생성
                    reject(/** */ );
                }

                res.write(JSON.stringify({
                    token
                }));
                res.end();

                resolve();
            }
        );
    });
}

async function getAuthorizer(req){
    const authHeader = req.get('Authorization');
    
    return new Promise(function(resolve, reject){
        jwt.verify(authHeader, serverConfig.key.public, function(err, payload){
            if(err){
                //예외 객체 설정 후 reject
            }
            else{
                resolve(payload);
            }
        });
    });
}

async function responseAuth(req, res, digest, digestGenerator, userPromise){
    //인증
    if(await digest.isEqual(req.body.accountPassword, digestGenerator) === false){
        //예외 던짐
    }

    //권한 부여
    const authorizer = new auth.Authorizer({});
    const user = await userPromise;

    authorizer.setAccessibleUser(user.userId);

    await sendAuthorizer(res, authorizer);
}

exports.responseAuth = responseAuth;
exports.getAuthorizer = getAuthorizer;