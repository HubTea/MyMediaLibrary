const defaultLength = 50;
const minimumLength = 1;
const maximumLength = 100;

const beginningDate = new Date('2000-01-01T00:00:00Z');
const endingDate = new Date('9999-01-01T00:00:00Z');

const minimumRandom = 0;
const maximumRandom = 2 * (10 ** 9);

const minimumOrder = 0;
const maximumOrder = 0x7fffffff;

const minimumViewCount = 0;
const maximumViewCount = 0x7fffffff;

const minimumUuid = '00000000-0000-0000-0000-000000000000';
const maximumUuid = 'ffffffff-ffff-ffff-ffff-ffffffffffff';


class Paginator{
    /**
     * 
     * @param {object} option 
     * ```
     * {
     *  length: number,
     *  mapper: (obj: object) => object
     *  cursorFactory: (obj: object) => string
     * }
     * ```
     */
    constructor(option){
        this.length = option.length;
        this.extraIndex = this.length;
        this.mapper = option.mapper;
        this.cursorFactory = option.cursorFactory;
        this.resBody = {
            list: []
        };
        this.croppedList = [];
    }

    /**
     * 
     * @returns buildResponseBody 메소드의 반환 객체에 cursor 속성이 포함되기 위한 최소한의 list 길이
     */
    getRequiredLength(){
        return this.extraIndex + 1;
    }

    /**
     * 
     * @param {array} list 
     * @returns 파라미터로 받은 list의 length < this.getRequiredLength()이면 cursor는 생략됨
     * ```
     * {
     *  list: array,
     *  cursor: string | undefined
     * }
     * ```
     */
    buildResponseBody(list){
        if(list.length >= this.getRequiredLength()){
            this.resBody.cursor = this.cursorFactory(list[this.extraIndex]);
        }

        let bound = Math.min(list.length, this.length);
        
        this.croppedList = [];
        for(let i = 0; i < bound; i++){
            this.croppedList.push(list[i]);
            this.resBody.list.push(this.mapper(list[i]));
        }

        return this.resBody;
    }
}

function createDateRandomCursor(obj){
    let utcMs = obj.createdAt.getTime();
    let random = obj.random;

    return `${utcMs}_${random}`;
}

function createDateUuidCursor(obj){
    let utcMs = obj.createdAt.getTime();

    return `${utcMs}_${obj.uuid}`;
}

function createViewCountUuidCursor(obj){
    return `${obj.viewCount}_${obj.uuid}`;
}

function createOrderCursor(obj){
    return obj.order.toString();
}

function mediaToSimpleFormat(media){
    return {
        uuid: media.uuid,
        title: media.title,
        type: media.type,
        updateTime: media.updateTime,
        viewCount: media.viewCount,
        dislikeCount: media.dislikeCount,
        uploader: {
            uuid: media.Uploader.uuid,
            nickname: media.Uploader.nickname
        }
    };
}

module.exports = {
    defaultLength,
    maximumLength,
    minimumLength,

    beginningDate,
    endingDate,

    minimumRandom,
    maximumRandom,

    minimumOrder,
    maximumOrder,

    minimumViewCount,
    maximumViewCount,

    minimumUuid,
    maximumUuid,

    Paginator,

    createDateRandomCursor,
    createDateUuidCursor,
    createViewCountUuidCursor,
    createOrderCursor,

    mediaToSimpleFormat
};