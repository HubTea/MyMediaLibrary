//데이터 베이스에 스키마 생성
//기존의 테이블을 전부 드랍하니 주의

const {Sequelize} = require('sequelize');
const serverConfig = require('../src/serverConfig');
const getModels = require('../src/model');
const commentShardModel = require('../src/commentShardModel');



async function initialize({logging}){
    let start = Date.now();
    await sync(undefined, (a, b) => console.log(b, a));
    console.log(`---${Date.now() - start}---`);
}

async function sync(force, logging) {
    const sequelize = new Sequelize(serverConfig.sqlServer.url, {
        logging: logging,
        benchmark: true
    });
    let model = getModels(sequelize);

    await sequelize.truncate({
        cascade: true,
        force: true
    })
    await syncNicknameLogQueue(model);
    await sequelize.close();

    for(let info of serverConfig.commentShardInfoList) {
        let shard = new Sequelize(info.database, info.user, info.password, {
            host: info.host,
            port: info.port,
            dialect: 'postgres',
            logging,
            benchmark: true
        });
        let model = commentShardModel.init(shard);

        await shard.truncate({
            cascade: true,
            force: true
        })
        await syncNicknameLogQueue(model);
        await shard.close();
    }
}

async function syncNicknameLogQueue(model) {
    for(let queueId = 0; queueId < serverConfig.nicknameLogConcurrency; queueId++) {
        await model.NicknameLogQueue.create({
            id: queueId
        });
    }
}


module.exports = {
    initialize: initialize,
    sync: sync
};

