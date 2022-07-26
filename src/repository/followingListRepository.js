const sequelize = require('sequelize');

const serverConfig = require('../serverConfig');
const error = require('../error');


/**
 * order 컬럼을 기준으로 내림차순으로 정렬된 유저 리스트 반환
 * @param {number} userUuid 유저의 PK
 * @param {number} order 리스트 제일 앞의 유저의 order 컬럼 값
 * @param {number} length 
 */
async function getFollowingUserDescendingList(userId, order, length){
    try{
        await serverConfig.model.Subscribe.findAll({
            where: {
                subscriberId: userId,
                order: {
                    [sequelize.Op.lte]: order
                }
            },
            include: [{
                model: serverConfig.model.User,
                as: 'SubscribedUploader',
                attributes: ['uuid', 'nickname']
            }],
            order: [
                ['order', 'DESC']
            ],
            limit: length
        });
    }
    catch(err){
        throw error.wrapSequelizeError(err);
    }
}

module.exports = {
    getFollowingUserDescendingList
};