const {
    Transaction,
    Op
} = require('sequelize');
const util = require('util');
const timer = require('timers/promises');

const serverConfig = require('../src/serverConfig');


let nicknameLogReplayInterval = 1000;

async function replayNicknameLog() {
    try {
        while(true) {
            let queueList = await serverConfig.model.NicknameLogQueue.findAll();

            for(let shardId = 0; shardId < serverConfig.commentShardList.length; shardId++) {
                for(let queue of queueList) {
                    await serverConfig.commentShardList[shardId].transaction(
                        beginCommentNicknameUpdate.bind(null, shardId, queue)
                    );
                }
            }

            await timer.setTimeout(nicknameLogReplayInterval);
        }
    }
    catch(err) {
        console.log(util.inspect(err));
    }
}

async function beginCommentNicknameUpdate(shardId, queue, transaction) {
    let model = serverConfig.commentShardModelList[shardId];

    let shardQueue = await model.NicknameLogQueue.findOne({
        where: {
            id: queue.id
        },
        lock: Transaction.LOCK.UPDATE,
        transaction
    });
    
    if(shardQueue === null) {
        throw new Error('inconsistent NicknameLogQueue');
    }

    if(queue.offset <= shardQueue.offset) {
        return;
    }

    let logList = await serverConfig.model.NicknameLog.findAll({
        where: {
            queueId: queue.id,
            id: {
                [Op.gte]: shardQueue.offset
            }
        },
        order: [['id', 'ASC']]
    });

    for(let log of logList) {
        await model.Comment.update({
            writerNickname: log.newNickname
        }, {
            where: {
                writerId: log.userId
            },
            transaction
        })
    }

    await model.NicknameLogQueue.update({
        offset: queue.offset
    }, {
        where: {
            id: queue.id
        },
        transaction
    });
}

replayNicknameLog();
