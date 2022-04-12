//데이터 베이스에 스키마 생성

const {Sequelize} = require('sequelize');
const {sqlServer} = require('./serverConfig');
const initializeModels = require('./model');

const sequelize = new Sequelize(sqlServer.url);

async function Main(){
    initializeModels(sequelize);
    await sequelize.sync({force: true});
    console.log('sync complete');
    await sequelize.close();
}

Main();


