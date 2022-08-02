/**
 * Digest: password로부터 만들어낸 Codec 객체
 * Salt: 무작위 값으로 생성한 Codec 객체
 * DigestPair: Digest와 Salt의 쌍
 */

const crypto = require('crypto');

const serverConfig = require('./serverConfig');



class Codec{
    constructor(){
        this.buffer = null;
    }

    isEqual(codec){
        return this.buffer.compare(codec.getBuffer()) === 0;
    }

    setBuffer(digestBuffer){
        this.buffer = digestBuffer;
    }

    getBuffer(){
        return Buffer.from(this.buffer);
    }

    setBase64(digestBase64){
        this.buffer = Buffer.from(digestBase64, 'base64');
    }

    getBase64(){
        return this.buffer.toString('base64').replace('=', '');
    }
}


class DigestPair{
    /**
     * 
     * @param {DigestGenerator} digestGenerator 
     */
    constructor(digestGenerator){
        this.digestGenerator = digestGenerator;
    }

    /**
     * 
     * @param {string} password 
     * @returns {Promise<boolean>}
     */
    async isEqual(password){
        const digestPair = await this.getDigestPair();
        const generatedDigest = await this.digestGenerator.generateDigest(password, digestPair.salt);
        
        return digestPair.digest.isEqual(generatedDigest);
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
     * @param {Codec} digest 
     * @param {Codec} salt 
     */
    async setDigestPair(digest, salt){}
}


class DatabaseDigestPair extends DigestPair{
    /**
     * 
     * @param {string} accountId 패스워드 주인인 사용자의 accountId
     * @param {DigestGenerator} digestGenerator
     */
    constructor(accountId, digestGenerator){
        super(digestGenerator);
        this.model = serverConfig.model.User;
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
                accountId: this.accountId
            }
        });
    }

    async getDigestPair(){
        let user = await this.getRow();

        let digest = new Codec();
        digest.setBase64(user.accountPasswordHash);

        let salt = new Codec();
        salt.setBase64(user.accountPasswordSalt);

        return {
            digest: digest,
            salt: salt
        };
    }

    async setDigestPair(digest, salt){
        let user = await this.getRow();
        user.accountPasswordHash = digest.getBase64();
        user.accountPasswordSalt = salt.getBase64();
        await user.save();
    }
}


class ConstantDigestPair extends DigestPair{
    /**
     * 
     * @param {Codec} digest 
     * @param {Codec} salt 
     * @param {DigestGenerator} digestGenerator 
     */
    constructor(digest, salt, digestGenerator){
        super(digestGenerator);
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
     * @param {Codec} salt 
     * @returns {Promise<Codec>}
     */
    generateDigest(password, salt){}
}


class Pbkdf2DigestGenerator extends DigestGenerator{
    constructor(iteration, hash, digestLength){
        super();
        this.iteration = iteration;
        this.hash = hash;
        this.digestLength = digestLength;

        this.password = null;
        this.salt = null;

        this.resolveGenerateDigest = null;
        this.rejectGenerateDigest = null;
    }
    
    generateDigest(password, salt){
        this.password = password;
        this.salt = salt;
        return new Promise(this.fulfillGenerateDigest.bind(this));
    }

    fulfillGenerateDigest(resolve, reject){
        this.resolveGenerateDigest = resolve;
        this.rejectGenerateDigest = reject;
        crypto.pbkdf2(this.password, this.salt.getBuffer(), this.iteration, this.digestLength, this.hash, this.emitDigest.bind(this));
    }

    emitDigest(err, digestBuffer){
        if(err){
            this.rejectGenerateDigest(err);
        }
        else{
            let digest = new Codec();
            digest.setBuffer(digestBuffer);
            this.resolveGenerateDigest(digest);
        }
    }
}

exports.Codec = Codec;
exports.DatabaseDigestPair = DatabaseDigestPair;
exports.ConstantDigestPair = ConstantDigestPair;
exports.Pbkdf2DigestGenerator = Pbkdf2DigestGenerator;