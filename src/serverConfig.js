const process = require('process');
const orm = require('sequelize');

const getModels = require('./model');


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

const sequelize = new orm.Sequelize(
    sqlServer.database, sqlServer.user, sqlServer.password, {
        host: sqlServer.host,
        port: sqlServer.port,
        dialect: sqlServer.dbms
    }
);

module.exports = {
    port: process.env.PORT,
    apiVersion: 'v1',
    sqlServer,
    sequelize,
    model: getModels(sequelize)
};
