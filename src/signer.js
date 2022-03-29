const crypto = require('crypto');

class Signer{
    constructor(hash, privateKey, publicKey){
        this.hash = hash;
        this.privateKey = privateKey;
        this.publicKey = publicKey;
    }

    async sign(data){
        return new Promise(function(resolve, reject){
            crypto.sign(this.hash, data, this.privateKey, function(err, signature){
                if(err){
                    reject(err);
                    return;
                }
                resolve(signature);
            });
        });
    }

    async verify(data, signature){
        return new Promise(function(resolve, reject){
            crypto.verify(this.hash, data, this.publicKey, signature, function(err, result){
                if(err){
                    reject(err);
                    return;
                }
                resolve(result);
            });
        });
    }
}

exports.Signer = Signer;