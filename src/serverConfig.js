const process = require('process');
const orm = require('sequelize');
const winston = require('winston');
const fs = require('fs');

const getModels = require('./model');
const commentShardModel = require('./commentShardModel');


let config = JSON.parse(fs.readFileSync(process.env.CONFIG_FILE_PATH).toString());

let commentShardList = [];
let commentShardModelList = [];
for(let shard of config.commentShardInfoList) {
    let shardOption = {
        host: shard.host,
        port: shard.port,
        dialect: 'postgres'
    }

    if(process.env.NODE_ENV === 'production') {
        shardOption.logging = null;
    }

    let db = new orm.Sequelize(shard.database, shard.user, shard.password, shardOption)
    commentShardList.push(db);
    commentShardModelList.push(commentShardModel.init(db));
}


let sqlServer = {
    dbms: 'postgres',
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    host: process.env.SQL_HOST,
    port: process.env.SQL_PORT,
    database: process.env.SQL_DATABASE,

    get url(){
        return `${this.dbms}://${this.user}:${this.password}@${this.host}:${this.port}/${this.database}`;
    }
};

let sequelizeOption = {
    host: sqlServer.host,
    port: sqlServer.port,
    dialect: sqlServer.dbms
};

if(process.env.NODE_ENV === 'production'){
    sequelizeOption.logging = null;
}

const sequelize = new orm.Sequelize(
    sqlServer.database, sqlServer.user, sqlServer.password, sequelizeOption
);

const errorFile = new winston.transports.File({
    filename: './myMediaLibraryError.txt',
    level: 'error'
});
let logger;

if(process.env.NODE_ENV === 'production'){
    logger = winston.createLogger({
        level: 'error',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.prettyPrint()
        ),
        transports: [
            errorFile
        ]
    });
}
else{
    logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.prettyPrint() 
        ),
        transports: [
            new winston.transports.Console()
        ]
    });
}

module.exports = {
    port: process.env.PORT,
    apiVersion: 'v1',
    sqlServer,
    sequelize,
    model: getModels(sequelize),
    commentShardList,
    commentShardModelList,
    commentShardInfoList: config.commentShardInfoList,
    nicknameLogConcurrency: config.nicknameLogConcurrency,
    nicknameUpdateInterval: config.nicknameUpdateInterval,
    logger
};
