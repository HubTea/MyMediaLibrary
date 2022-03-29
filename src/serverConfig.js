//서버 포트, api버전, 데이터베이스 서버 주소 등의 정보를 담은 객체

const process = require('process');
const crypto = require('crypto');
const fs = require('fs');

const privateKey = crypto.createPrivateKey(
    fs.readFileSync(process.env.PrivateKeyPath)
);

const publicKey = crypto.createPublicKey(privateKey);

module.exports = {
    port: 443,
    apiVersion: 'v1',

    key: {
        private: privateKey,
        public: publicKey
    },
    
    pbkdf2: {
        iteration: 30000,
        hash: 'sha512',
        digestLenght: 32
    },

    sqlServer: {
        dbms: 'postgres',
        user: 'postgres',
        password: process.env.PostgreSQLPassword,
        host: 'localhost',
        port: '5432',
        database: 'MyMediaLibrary',

        get url(){
            return `${this.dbms}://${this.user}:${this.password}@${this.host}:${this.port}/${this.database}`;
        }
    }
};
