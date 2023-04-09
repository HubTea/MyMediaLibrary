const sequelize = require('sequelize');

const serverConfig = require('../serverConfig');
const error = require('../error');
const assert = require('assert');
const tag = require('../tag');
const mediaListRepository = require('./mediaListRepository');

class MediaPaginationSessionEntity {
    constructor(sessionId) {
        this.sessionId = sessionId;
    }

    async create() {
        let session;
        
        try{
            session = await serverConfig.model.MediaPaginationSession.create();
        }
        catch(err) {
            throw new error.wrapSequelizeError(err);
        }

        this.sessionId = session.id;
        return this.sessionId;
    }

    async append(itemList) {
        assert.ok(this.sessionId);

        try{
            await serverConfig.model.MediaPaginationSessionItem.bulkCreate(
                itemList.map(item => {
                    return {
                        sessionId: this.sessionId,
                        mediaId: item
                    };
                })
            );
        }
        catch(err) {
            if(err instanceof sequelize.UniqueConstraintError) {
                await this.appendSeparately(itemList);
            }
            else {
                throw new error.wrapSequelizeError(err);
            }
        }
    }

    async appendSeparately(itemList) {
        let transaction = await serverConfig.sequelize.transaction();
        let savePoint = 'save';

        for(let item of itemList) {
            try {
                await serverConfig.sequelize.query(`savepoint ${savePoint}`, {
                    transaction: transaction
                });
                await serverConfig.model.MediaPaginationSessionItem.create({
                    sessionId: this.sessionId,
                    mediaId: item
                }, {
                    transaction: transaction
                });
            }
            catch(err) {
                if(err instanceof sequelize.UniqueConstraintError) {
                    await serverConfig.sequelize.query(`rollback to ${savePoint}`, {
                        transaction: transaction
                    });
                    continue;
                }

                await transaction.rollback();
                throw new error.wrapSequelizeError(err);
            }
        }
        await transaction.commit();
    }

    async getOmittedMedia(lowerViewCount, lowerUuid, tagList, limit) {
        assert.ok(this.sessionId);

        let result = await mediaListRepository.getAllMedia({
            where: {
                [sequelize.Op.and]: [
                    sequelize.literal(`("Media"."viewCount", "Media"."uuid") > (${lowerViewCount}, '${lowerUuid}')`),
                    sequelize.literal('"MediaPaginationSessionItems"."sessionId" is null'),
                    ...tag.createTagConditionList(tagList)
                ] 
            },
            include : [{
                model: serverConfig.model.MediaPaginationSessionItem,
                where: {
                    sessionId: this.sessionId
                },
                required: false
            }, {
                model: serverConfig.model.User,
                as: 'Uploader',
                attribute: ['id', 'nickname', 'uuid']
            }],
            order: [
                ['viewCount', 'DESC'],
                ['uuid', 'DESC']
            ],
            limit: limit,

            //이 옵션은 sequelize 문서에 없으나 유효하게 작동하는 옵션
            //sequelize 버전 변경 시 주의 필요
            subQuery: false
        });

        return result.map(x => x.toJSON());
    }
}

module.exports = {
    MediaPaginationSessionEntity
};