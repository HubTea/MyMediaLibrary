const process = require('process');
const crypto = require('crypto');
const fs = require('fs');

const digest = require('./digest');


let pbkdf2Option = {
    iteration: 30000,
    hash: 'sha512'
};

let digestOption = {
    digestLength: 32,
    saltByteLength: 18
};

const privateKey = crypto.createPrivateKey(
    fs.readFileSync(process.env.PrivateKeyPath)
);
const publicKey = crypto.createPublicKey(privateKey);
const hmacKey = fs.readFileSync(process.env.HmacKeyPath);
const key = {
    private: privateKey,
    public: publicKey,
    hmac: hmacKey
};

module.exports = {
    pbkdf2Option: pbkdf2Option,
    digestOption: digestOption,
    key: key,
    digestGenerator: new digest.Pbkdf2DigestGenerator(pbkdf2Option.iteration, pbkdf2Option.hash, digestOption.digestLength)
};