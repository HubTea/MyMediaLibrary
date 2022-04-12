/**
 * 서버 포트, api버전, 데이터베이스 서버 주소 등의 정보를 담은 객체
 * 
 * 테스트 환경에서 정의되어야 하는 환경변수
 *      PostgreSQLPassword: 테스트용 데이터베이스 서버 비밀번호
 * 
 * 프로덕션 환경에서만 정의되어야 하는 환경변수
 *      ProductionMyMediaLibrary: 아무런 값이라도 정의돼있으면 됨.
 *      ProductionPostgreSQLPassword: 데이터베이스 서버 비밀번호
 * 
 * 공통적으로 설정이 필요한 환경변수
 *      PrivateKeyPath: 개인키를 저장하고 있는 pem 파일의 경로.
 */

const process = require('process');
const crypto = require('crypto');
const fs = require('fs');
const orm = require('sequelize');

const getModels = require('./model');


const privateKey = crypto.createPrivateKey(
    fs.readFileSync(process.env.PrivateKeyPath)
);

const publicKey = crypto.createPublicKey(privateKey);

let sqlServer;

if(process.env.ProductionMyMediaLibrary){
    sqlServer = {
        dbms: 'postgres',
        user: 'postgres',
        password: process.env.ProductionPostgreSQLPassword,
        host: '',
        port: '',
        database: 'MyMediaLibrary',
    
        get url(){
            return `${this.dbms}://${this.user}:${this.password}@${this.host}:${this.port}/${this.database}`;
        }
    };
}
else{
    sqlServer = {
        dbms: 'postgres',
        user: 'postgres',
        password: process.env.PostgreSQLPassword,
        host: 'localhost',
        port: '5432',
        database: 'MyMediaLibrary',
    
        get url(){
            return `${this.dbms}://${this.user}:${this.password}@${this.host}:${this.port}/${this.database}`;
        }
    };
}

const sequelize = new orm.Sequelize(sqlServer.url);


module.exports = {
    port: 443,
    apiVersion: 'v1',

    key: {
        private: privateKey,
        public: publicKey
    },
    
    pbkdf2: {
        iteration: 30000,
        hash: 'sha512'
    },

    digestLength: 32,
    saltByteLength: 18,

    sqlServer,
    sequelize,
    model: getModels(sequelize)
};
