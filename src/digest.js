/**
 * Digest: password로부터 만들어낸 Buffer
 * Salt: string
 * DigestPair: Digest와 Salt의 쌍
 * DigestBase64: Digest를 base64로 인코딩하고 '='을 제거한 문자열
 */

const crypto = require('crypto');


class DigestPair{
    async isEqual(password, digestGenerator){
        const digestPair = await this.getDigestPair();
        const generatedDigest = await digestGenerator.generateDigest(
            password, digestPair.salt, digestPair.digest.length
        );
        
        for(let i = 0; i < digestPair.digest.length; i++){
            if(digestPair.digest[i] !== generatedDigest[i]){
                return false;
            }
        }
        return true;
    }
}


class DigestPairFromDatabase extends DigestPair{
    constructor(model, accountId){
        this.model = model;
        this.accountId = accountId;
    }

    async getRow(columns){
        return await this.model.findOne({
            attributes: columns,
            where: {
                accountID: this.accountId
            }
        });
    }

    async getDigestPair(){
        let userRow = await this.getRow(['accountPasswordHash', 'accountPasswordSalt']);

        return {
            digest: Buffer.from(userRow.accountPasswordHash, 'base64'),
            salt: userRow.accountPasswordSalt
        };
    }

    async setDigestPair(digest, salt){
        return null;
    }
}


class ConstantDigestPair extends DigestPair{
    constructor(digest, salt){
        this.setDigestPair(digest, salt);
    }

    async getDigestPair(){
        return {
            digest: this.digest,
            salt: this.salt
        };
    }

    async setDigestPair(digest, salt){
        this.digest = digest;
        this.salt = salt;
    }
}


class DigestGenerator{
    generateDigest(password, salt, digestLength){}
}


class Pbkdf2DigestGenerator extends DigestGenerator{
    constructor(iteration, hash){
        this.iteration = iteration;
        this.hash = hash;
    }
    
    async generateDigest(password, salt, digestLength){
        return Promise(function(resolve, reject){
            crypto.pbkdf2(password, salt, this.iteration, digestLength, this.hash, 
                function(err, digest){
                    if(err){
                        reject(err);
                    }
                    else{
                        resolve(digest);
                    }
                }
            );
        });
    }
}

exports.DigestPairFromDatabase = DigestPairFromDatabase;
exports.ConstantDigestPair = ConstantDigestPair;
exports.Pbkdf2DigestGenerator = Pbkdf2DigestGenerator;