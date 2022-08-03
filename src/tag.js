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

module.exports = {
    concatenateTagList,
    splitTagString
};