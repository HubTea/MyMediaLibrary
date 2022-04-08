const auth = require('./authorizer');
const jwt = require('jsonwebtoken');
const serverConfig = require('./serverConfig');
const error = require('./error');


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
                    reject(new error.JwtSignFailedError(err));
                    return;
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
                reject(new error.InvalidJwtError(err));
                return;
            }
            else{
                resolve(payload);
                return;
            }
        });
    });
}


async function responseAuth(req, res, digest, digestGenerator, userPromise){
    //인증
    if(await digest.isEqual(req.body.accountPassword, digestGenerator) === false){
        throw new error.PasswordNotMatchError(null);
    }

    //권한 부여
    const authorizer = new auth.Authorizer({});
    const user = await userPromise;

    authorizer.setAccessibleUser(user.userId);

    await sendAuthorizer(res, authorizer);
}


module.exports = {
    responseAuth,
    getAuthorizer
};