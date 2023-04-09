const sequelize = require('sequelize');

/**
 * 
 * @param {Array} tagList 
 * @returns 
 */
function concatenateTagList(tagList){
    return `,${tagList.join(',')},`;
}

/**
 * 
 * @param {string} tagString 
 */
function splitTagString(tagString){
    let splittedTagList = tagString.split(',');
    let tagList = [];

    for(let tag of splittedTagList){
        if(tag.length === 0){
            continue;
        }

        tagList.push(tag);
    }

    return tagList;
}

function createTagConditionList(tagList){
    let conditionList = [];

    for(let tag of tagList){
        let enclosedTag = concatenateTagList([tag]);

        conditionList.push({
            tagString: {
                [sequelize.Op.like]: `%${enclosedTag}%`
            }
        });
    }

    return conditionList;
}

module.exports = {
    concatenateTagList,
    splitTagString,
    createTagConditionList
};