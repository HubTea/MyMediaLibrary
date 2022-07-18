//Sequelize 모델 생성 및 설정


const {
    Model,
    DataTypes
} = require('sequelize');


class User extends Model{}
class Bookmark extends Model{}
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

        accountId: {
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
        }
    }, {
        sequelize,
        omitNull: true,
        paranoid: true,
        freezeTableName: true
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

        title: {
            type: DataTypes.STRING,
            defaultValue: ''
        },

        description: {
            type: DataTypes.STRING,
            defaultValue: ''
        },

        type: DataTypes.STRING,
        updateTime: DataTypes.DATE,

        viewCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },

        dislikeCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },

        order: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false
        }
    }, {
        sequelize,
        omitNull: true,
        paranoid: true,
        freezeTableName: true,
    });
    
    Bookmark.init({
        userId: {
            type: DataTypes.UUID,
            primaryKey: true
        },

        mediaId: {
            type: DataTypes.UUID,
            primaryKey: true
        },

        order: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false
        }
    }, {
        sequelize,
        timestamps: false,
        freezeTableName: true
    });

    Subscribe.init({
        uploader: {
            type: DataTypes.UUID,
            primaryKey: true
        },

        subscriber: {
            type: DataTypes.UUID,
            primaryKey: true
        },

        order: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false
        }
    }, {
        sequelize,
        timestamps: false,
        freezeTableName: true
    });

    Tag.init({
        mediaId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            references: {
                model: Media,
                key: 'mediaId'
            }
        },

        tag: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true
        }
    }, {
        sequelize,
        omitNull: true,
        timestamps: false,
        freezeTableName: true
    });

    Comment.init({
        commentId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        writer: {
            type: DataTypes.UUID
        },

        media: {
            type: DataTypes.UUID
        },

        parentCommentId: {
            type: DataTypes.UUID,
            defaultValue: null
        },

        content: {
            type: DataTypes.STRING
        },

        order: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false
        }
    }, {
        sequelize,
        omitNull: true,
        freezeTableName: true
    });

    User.belongsToMany(Media, {
        through: Bookmark, 
        as: 'collection', 
        foreignKey: 'userId',
        otherKey: 'mediaId'
    });
    Media.belongsToMany(User, {
        through: Bookmark, 
        as: 'collector', 
        foreignKey: 'mediaId',
        otherKey: 'userId'
    });

    User.belongsToMany(User, {
        through: Subscribe, 
        as: 'subscriber',
        foreignKey: 'subscriber',
        otherKey: 'uploader'
    });

    Comment.hasMany(Comment, {
        as: 'childComment', 
        foreignKey: 'parentCommentId'
    });
    Comment.belongsTo(Comment, {
        as: 'parentComment',
        foreignKey: 'parentCommentId'
    });

    Tag.belongsTo(Media, {
        as: 'taggedMedia',
        foreignKey: 'mediaId'
    });
    Media.hasMany(Tag, {
        as: 'mediaTag',
        foreignKey: 'mediaId'
    });

    Media.hasMany(Comment, {
        as: 'mediaComment',
        foreignKey: 'mediaId'
    });
    Comment.belongsTo(Media, {
        as: 'commentTarget',
        foreignKey: 'mediaId'
    });

    User.hasMany(Comment, {
        as: 'userComment',
        foreignKey: 'writerId'
    });
    Comment.belongsTo(User, {
        as: 'commentWriter',
        foreignKey: 'writerId'
    });

    return {
        User, 
        Bookmark, 
        Subscribe,
        Tag,
        Media,
        Comment,
    };
};
