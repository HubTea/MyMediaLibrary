const sequelize = require('sequelize');

const error = require('../error');
const serverConfig = require('../serverConfig');
const converter = require('./converter');


async function getBookmarkList(userId, order, length){
    try{
        let bookmarkList = await serverConfig.model.Bookmark.findAll({
            where: {
                userId: userId,
                order: {
                    [sequelize.Op.lte]: order
                }
            },
            include: [{
                model: serverConfig.model.Media,
                include: [{
                    model: serverConfig.model.User,
                    as: 'Uploader',
                    attributes: ['uuid', 'nickname']
                }]
            }],
            order: [
                ['order', 'DESC']
            ],
            limit: length
        });
        let valueObjectList = [];

        for(let bookmark of bookmarkList){
            valueObjectList.push(bookmark.toJSON());
        }
        return valueObjectList;
    }
    catch(err){
        throw error.wrapSequelizeError(err);
    }
}

async function createBookmark(valueObject){
    try{
        await serverConfig.model.Bookmark.create(
            converter.bookmarkFromValueObject(valueObject)
        );
    }
    catch(err){
        if(err instanceof sequelize.UniqueConstraintError){
            //아무것도 안 함.
        }
        else{
            throw error.wrapSequelizeError(err);
        }
    }
}

module.exports = {
    createBookmark,
    getBookmarkList
};