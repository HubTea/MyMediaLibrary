const serverConfig = require('../serverConfig');
const error = require('../error');

async function getAllMedia(option){
    try{
        let list = await serverConfig.model.Media.findAll(option);
        
        return list;
    }
    catch(err){
        throw error.wrapSequelizeError(err);
    }
}

async function getBookmarkList(userId, key, length){
    
}

async function searchMedia(sort, cursor, key, length, tagList){

}

async function getUploadList(userId, key, length){

}

