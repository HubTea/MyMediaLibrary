const assert = require('assert');
const axios = require('axios').default;

const dbInitializer = require('./dbInitializer');
const testUtil = require('./testUtil');


/**
 * AxiosResponse와 testUtil.Request 사이의 어댑터
 */
class AxiosGetRequest{
    constructor(path, config){
        this.request = axios.create(
            new testUtil.RequestOptionBuilder(testUtil.localhostRequestOption).export()
        );

        this.responsePromise = this.request.get(path, config);
    }

    async getResponse(){
        let response = await this.responsePromise;

        return {
            statusCode: response.status,
            headers: response.headers
        };
    }

    async getBodyObject(){
        let response = await this.responsePromise;

        return response.data;
    }
}

class MediaListRequestFactory extends testUtil.RequestFactory{
    constructor(sort, tagList){
        super();

        this.sort = sort;
        this.tagList = tagList;
    }

    create(cursor){
        return new AxiosGetRequest('/medias', {
            params: {
                sort: this.sort,
                tag: this.tagList,
                cursor: cursor
            }
        });
    }
}

async function testSearchMedia(option, sort){
    await testUtil.registerUser(option.user);

    let userSession = await testUtil.logIn(option.user);
    let mediaUuidList = [];
    let answerUuidList = [];
    
    for(let media of option.mediaList){
        mediaUuidList[media.title] = await testUtil.registerMedia({
            userUuid: userSession.userUuid,
            token: userSession.token,
            title: media.title,
            description: media.description,
            type: media.type,
            tagList: media.tagList
        });
    }
    
    for(let title of option.answer.titleList){
        answerUuidList.push(mediaUuidList[title]);
    }

    if(sort === 'most_watched'){
        for(let media of option.mediaList){
            for(let i = 0; i < media.viewCount; i++){
                let request = testUtil.sendGetMediaMetadataRequest({
                    mediaId: mediaUuidList[media.title]
                });

                await request.getResponse();
            }
        }
    }

    let newestFirstFactory = new MediaListRequestFactory(sort, option.answer.tagList);

    await testUtil.assertEqualOrderPage(answerUuidList, newestFirstFactory);
}

describe('/v1/medias 테스트', function(){
    let type = 'image/png';
    let originalTestCase = {
        user: {
            accountId: 'user',
            accountPassword: 'passwordpassword',
            nickname: 'user'
        },

        //앞의 미디어가 먼저 등록됨.
        //뒤로 갈수록 최신.
        mediaList: [{
            title: 'media1',
            description: '1',
            type: type,
            tagList: ['a', 'b', 'c'],
            viewCount: 1
        }, {
            title: 'media2',
            description: '2',
            type: type,
            tagList: ['a', 'b'],
            viewCount: 5,
        }, {
            title: 'media3',
            description: '3',
            type: type,
            tagList: ['a', 'b', 'c'],
            viewCount: 2
        }]
    };
    
    beforeEach(async function(){
        await dbInitializer.initialize({
            logging: false
        });
    });

    it('최신순으로 태그 검색 테스트', async function(){
        let testCase = Object.assign({}, originalTestCase);

        testCase.answer = {
            tagList: ['b', 'c'],
            titleList: ['media3', 'media1']
        };
        await testSearchMedia(testCase, 'new');
    });

    it('오래된순으로 태그 검색 테스트', async function(){
        let testCase = Object.assign({}, originalTestCase);

        testCase.answer = {
            tagList: ['b', 'c'],
            titleList: ['media1', 'media3']
        };
        await testSearchMedia(testCase, 'old');
    });

    it('조회수 많은순으로 태그 검색 테스트', async function(){
        let testCase = Object.assign({}, originalTestCase);

        testCase.answer = {
            tagList: ['a'],
            titleList: ['media2', 'media3', 'media1']
        };
        await testSearchMedia(testCase, 'most_watched');
    });
})