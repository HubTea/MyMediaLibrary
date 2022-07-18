const sequelize = require('sequelize');

const serverConfig = require('../src/serverConfig');
const dbInitializer = require('./dbInitializer');
const getModels = require('../src/model');


async function run(){
    await dbInitializer.initialize({
        logging: console.log
    });

    let connection = new sequelize.Sequelize(serverConfig.sqlServer.url);
    let models = getModels(connection);

    let uploader = await models.User.create({
        accountId: 'hello',
        accountPasswordHash: 'password',
        accountPasswordSalt: 'salt',
        nickname: 'world',
        introduction: 'HELLO WORLD'
    });
    console.log(uploader.toJSON());

    let user = await models.User.create({
        accountId: 'hello2',
        accountPasswordHash: 'password2',
        accountPasswordSalt: 'salt2',
        nickname: 'world2',
        introduction: 'HELLO WORLD2'
    });
    console.log(user.toJSON());

    let subscribe = await models.Subscribe.create({
        uploader: uploader.userId,
        subscriber: user.userId
    });
    console.log(subscribe.toJSON());

    let media = await models.Media.create({
        uploader: uploader.userId,
        title: 'title',
        description: 'desc',
        type: 'video/mp4',
        updateTime: '2222-02-22',
        viewCount: 100,
        dislikeCount: 999
    });
    console.log(media.toJSON());

    let tags = ['action', 'romance', 'horror'];

    for(let tag of tags){
        await models.Tag.create({
            tag: tag,
            mediaId: media.mediaId
        });
    }

    let join = await models.Media.findAll({
        include: {
            model: models.Tag,
            as: 'mediaTag'
        }
    });
    
    for(let ele of join){
        console.log(ele.toJSON());
    }

    let bookmark = await models.Bookmark.create({
        mediaId: media.mediaId,
        userId: user.userId
    });
    console.log(bookmark.toJSON());

    let comment = await models.Comment.create({
        content: 'first comment',
        mediaId: media.mediaId,
        writerId: user.userId
    });
    console.log(comment.toJSON());

    await connection.close();
}

run();