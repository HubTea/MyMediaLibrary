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

    /**
     * @returns {object}  
     * ```
     * {
     *      digest,
     *      salt
     * }
     * ```
     */
    async getDigestPair(){}

    /**
     * 
     * @param {Buffer} digest 
     * @param {string} salt 
     */
    async setDigestPair(digest, salt){}
}


class DatabaseDigestPair extends DigestPair{
    /**
     * 
     * @param {Model} model 패스워드 정보를 담고 있는 테이블의 모델
     * @param {string} accountId 패스워드 주인인 사용자의 accountId
     */
    constructor(model, accountId){
        super();
        this.model = model;
        this.accountId = accountId;
    }

    /**
     * 
     * @returns {Promise<User>}
     */
    getRow(){
        return this.model.findOne({
            attributes: ['accountPasswordHash', 'accountPasswordSalt'],
            where: {
                accountID: this.accountId
            }
        });
    }

    async getDigestPair(){
        let userRow = await this.getRow();

        return {
            digest: Buffer.from(userRow.accountPasswordHash, 'base64'),
            salt: userRow.accountPasswordSalt
        };
    }

    async setDigestPair(digest, salt){
        let user = await this.getRow();
        user.accountPasswordHash = digest.toString('base64');
        user.accountPasswordSalt = salt;
        await user.save();
    }
}


class ConstantDigestPair extends DigestPair{
    constructor(digest, salt){
        super();
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
    /**
     * 
     * @param {string} password 
     * @param {string} salt 
     * @param {number} digestLength 
     * @returns {Promise<Buffer>}
     */
    async generateDigest(password, salt, digestLength){}
}


class Pbkdf2DigestGenerator extends DigestGenerator{
    constructor(iteration, hash){
        super();
        this.iteration = iteration;
        this.hash = hash;
    }
    
    async generateDigest(password, salt, digestLength){
        function asyncPbkdf2(resolve, reject){
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
        }

        return new Promise(asyncPbkdf2.bind(this));
    }
}

exports.DatabaseDigestPair = DatabaseDigestPair;
exports.ConstantDigestPair = ConstantDigestPair;
exports.Pbkdf2DigestGenerator = Pbkdf2DigestGenerator;