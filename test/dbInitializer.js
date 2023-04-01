//데이터 베이스에 스키마 생성
//기존의 테이블을 전부 드랍하니 주의

const {Sequelize} = require('sequelize');
const {sqlServer} = require('../src/serverConfig');
const getModels = require('../src/model');



async function initialize({logging}){
    await sync(true, logging);
}

async function sync(force, logging) {
    const sequelize = new Sequelize(sqlServer.url, {
        logging: logging
    });
    getModels(sequelize);
    await sequelize.sync({force: force});
    await sequelize.close();
}


module.exports = {
    initialize: initialize,
    sync: sync
};

