const {
    Model,
    DataTypes
} = require('sequelize');


class NicknameLogQueue extends Model{}
class Comment extends Model{}


function init(sequelize) {
    NicknameLogQueue.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
    
        offset: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        }
    }, {
        sequelize,
        omitNull: true,
        freezeTableName: true
    })
    
    Comment.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
    
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            unique: true
        },
    
        writerId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        writerUuid: {
            type: DataTypes.UUID,
            allowNull: false
        },

        writerNickname: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },

        confirmed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
    
        mediaId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    
        parentId: {
            type: DataTypes.INTEGER,
            references: {
                model: Comment,
                key: 'id'
            }
        },
    
        content: {
            type: DataTypes.STRING,
            defaultValue: '',
            allowNull: false
        },
    
        random: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        sequelize,
        omitNull: true,
        freezeTableName: true,

        indexes: [{
            name: 'idx_writer_id',
            fields: [{
                name: 'writerId'
            }]
        }, {
            name: 'idx_media_id', 
            fields: [{
                name: 'mediaId'
            }]
        }]
    });

    Comment.hasMany(Comment, {
        as: 'ChildComments', 
        foreignKey: 'parentId'
    });
    Comment.belongsTo(Comment, {
        as: 'ParentComment',
        foreignKey: 'parentId'
    });

    return {
        NicknameLogQueue,
        Comment
    }
}


module.exports = {
    init
};