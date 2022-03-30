//Sequelize 모델 생성 및 설정


const {
    Model,
    DataTypes
} = require('sequelize');


class User extends Model{}
class Like extends Model{}
class Subscribe extends Model{}
class Tag extends Model{}
class Media extends Model{}
class Comment extends Model{}


module.exports = function GetModels(sequelize){
    User.init({
        userId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        accountID: {
            type: DataTypes.STRING,
            unique: true,
        },

        accountPasswordHash: {
            type: DataTypes.STRING
        },

        accountPasswordSalt: {
            type: DataTypes.STRING
        },

        nickname: {
            type: DataTypes.STRING
        },

        introduction: {
            type: DataTypes.STRING
        },

        thumbnailUrl: {
            type: DataTypes.STRING
        }
    }, {
        sequelize,
        modelName: 'User',
        omitNull: true
    });

    Media.init({
        mediaId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        uploader: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            references: {
                model: User,
                key: 'userId'
            }
        },

        title: DataTypes.STRING,
        description: DataTypes.STRING,
        type: DataTypes.STRING,
        url: DataTypes.STRING,
        updateTime: DataTypes.DATE,
        viewCount: DataTypes.INTEGER,
        dislikeCount: DataTypes.INTEGER,
        thumbnailUrl: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Media',
        omitNull: true
    });
    
    Like.init({

    }, {
        sequelize,
        modelName: 'Like',
    });

    Subscribe.init({

    }, {
        sequelize,
        modelName: 'Subscribe'
    });

    Tag.init({
        mediaId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        tag: {
            type: DataTypes.STRING,
            primaryKey: true
        }
    }, {
        sequelize,
        modelName: 'Tag',
        omitNull: true
    });

    Comment.init({
        commentId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        writer: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            references: {
                model: User,
                key: 'userId'
            }
        },

        media: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            references: {
                model: Media,
                key: 'mediaId'
            }
        },

        content: {
            type: DataTypes.STRING
        },

        updateTime: {
            type: DataTypes.DATE
        }
    }, {
        sequelize,
        modelName: 'Comment',
        omitNull: true
    });

    User.belongsToMany(Media, {through: Like});
    Media.belongsToMany(User, {through: Like});

    User.belongsToMany(User, {through: Subscribe, as: 'Subscriber'});
    User.belongsToMany(User, {through: Subscribe, as: 'SubscribedUser'});

    Comment.hasMany(Comment, {as: 'Child'});
    Comment.belongsTo(Comment, {as: 'Parent'});

    return {
        User, 
        Like, 
        Subscribe,
        Tag,
        Media,
        Comment,
    };
};
