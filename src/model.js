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
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            unique: true
        },

        accountId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },

        accountPasswordHash: {
            type: DataTypes.STRING,
            allowNull: false
        },

        accountPasswordSalt: {
            type: DataTypes.STRING,
            allowNull: false
        },

        nickname: {
            type: DataTypes.STRING,
            defaultValue: '',
            allowNull: false
        },

        introduction: {
            type: DataTypes.STRING,
            defaultValue: '',
            allowNull: false
        }
    }, {
        sequelize,
        omitNull: true,
        paranoid: true,
        freezeTableName: true
    });

    Media.init({
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

        uploaderId: {
            type: DataTypes.INTEGER,
            references: {
                model: User,
                key: 'id'
            }
        },

        title: {
            type: DataTypes.STRING,
            defaultValue: '',
            allowNull: false
        },

        description: {
            type: DataTypes.STRING,
            defaultValue: '',
            allowNull: false
        },

        type: {
            type: DataTypes.STRING,
            defaultValue: '',
            allowNull: false
        },

        updateTime: {
            type: DataTypes.DATE,
            defaultValue: '2222-02-22 22:22:22.222Z',
            allowNull: false
        },

        viewCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },

        dislikeCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },

        //태그들을 , 로 연결한 문자열.
        //,태그1,태그2,태그3, 형식을 따라야 함.
        tagString: {
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
        paranoid: true,
        freezeTableName: true,

        //영어 문법적으로는 오류지만
        //프로젝트 처음부터 사용한 단어라
        //계속 사용하기로 함.
        name: {
            singular: 'Media',
            plural: 'Medias'
        }
    });
    
    Bookmark.init({
        userId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: User,
                key: 'id'
            }
        },

        mediaId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: Media,
                key: 'id'
            }
        },

        order: {
            type: DataTypes.INTEGER,
            autoIncrement: true
        }
    }, {
        sequelize,
        timestamps: false,
        freezeTableName: true
    });

    Subscribe.init({
        uploaderId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: User,
                key: 'id'
            }
        },

        subscriberId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: User,
                key: 'id'
            }
        },

        order: {
            type: DataTypes.INTEGER,
            autoIncrement: true
        }
    }, {
        sequelize,
        timestamps: false,
        freezeTableName: true
    });

    // Tag.init({
    //     mediaId: {
    //         type: DataTypes.INTEGER,
    //         primaryKey: true,
    //         references: {
    //             model: Media,
    //             key: 'id'
    //         }
    //     },

    //     tag: {
    //         type: DataTypes.STRING,
    //         primaryKey: true
    //     }
    // }, {
    //     sequelize,
    //     omitNull: true,
    //     timestamps: false,
    //     freezeTableName: true
    // });

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
            references: {
                model: User,
                key: 'id'
            }
        },

        mediaId: {
            type: DataTypes.INTEGER,
            references: {
                model: Media,
                key: 'id'
            }
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
        freezeTableName: true
    });


    User.hasMany(Media, {
        as: 'MyMedias',
        foreignKey: 'uploaderId'
    });
    Media.belongsTo(User, {
        as: 'Uploader',
        foreignKey: 'uploaderId'
    });


    User.hasMany(Bookmark, {
        foreignKey: 'userId'
    });
    Bookmark.belongsTo(User, {
        foreignKey: 'userId'
    });
    Media.hasMany(Bookmark, {
        foreignKey: 'mediaId'
    });
    Bookmark.belongsTo(Media, {
        foreignKey: 'mediaId'
    });


    User.hasMany(Subscribe, {
        as: 'UploaderSubscribers',
        foreignKey: 'uploaderId'
    });
    Subscribe.belongsTo(User, {
        as: 'SubscribedUploader',
        foreignKey: 'uploaderId'
    });
    User.hasMany(Subscribe, {
        as: 'SubscriberUploaders',
        foreignKey: 'subscriberId'
    });
    Subscribe.belongsTo(User, {
        as: 'Subscriber',
        foreignKey: 'subscriberId'
    });


    Comment.hasMany(Comment, {
        as: 'ChildComments', 
        foreignKey: 'parentId'
    });
    Comment.belongsTo(Comment, {
        as: 'ParentComment',
        foreignKey: 'parentId'
    });

    // Tag.belongsTo(Media, {
    //     as: 'TaggedMedia',
    //     foreignKey: 'mediaId'
    // });
    // Media.hasMany(Tag, {
    //     as: 'MediaTags',
    //     foreignKey: 'mediaId'
    // });


    Media.hasMany(Comment, {
        as: 'MediaComments',
        foreignKey: 'mediaId'
    });
    Comment.belongsTo(Media, {
        as: 'CommentTarget',
        foreignKey: 'mediaId'
    });


    User.hasMany(Comment, {
        as: 'UserComments',
        foreignKey: 'writerId'
    });
    Comment.belongsTo(User, {
        as: 'CommentWriter',
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
