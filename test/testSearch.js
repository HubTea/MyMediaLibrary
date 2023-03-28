const dbInitializer = require('./dbInitializer');
const testUtil = require('./testUtil');


class MediaPageGenerator extends testUtil.PageGenerator{
    constructor(controller, sort, tagList){
        super(controller);

        this.sort = sort;
        this.tagList = tagList;
    }

    generate(cursor){
        return this.controller.searchMedia({
            tagList: this.tagList,
            sort: this.sort,
            cursor: cursor
        });
    }
}


async function testSearchMedia(testCase){
    let [user] = await testUtil.createSignedControllerList(
        testUtil.localhostRequestOption,
        [testCase.user]
    );

    let mediaUuidList = [];
    let answerUuidList = [];

    for(let media of testCase.mediaList){
        mediaUuidList[media.title] = await user.registerMedia(media); 
    }
    
    for(let title of testCase.answer.titleList){
        answerUuidList.push(mediaUuidList[title]);
    }

    if(testCase.sort === 'most_watched'){
        for(let media of testCase.mediaList){
            for(let i = 0; i < media.viewCount; i++){
                await user.getMediaInfo(mediaUuidList[media.title]);
            }
        }
    }

    let generator = new MediaPageGenerator(user, testCase.sort, testCase.searchTagList);

    await testUtil.assertEqualOrderPage(answerUuidList, generator);
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

        testCase.sort = 'new';
        testCase.searchTagList = ['b', 'c'];
        testCase.answer = {
            titleList: ['media3', 'media1']
        };
        await testSearchMedia(testCase);
    });

    it('오래된순으로 태그 검색 테스트', async function(){
        let testCase = Object.assign({}, originalTestCase);

        testCase.sort = 'old';
        testCase.searchTagList = ['b', 'c'];
        testCase.answer = {
            titleList: ['media1', 'media3']
        };
        await testSearchMedia(testCase, 'old');
    });

    it('조회수 많은순으로 태그 검색 테스트', async function(){
        let testCase = Object.assign({}, originalTestCase);

        testCase.sort = 'most_watched';
        testCase.searchTagList = ['a'];
        testCase.answer = {
            titleList: ['media2', 'media3', 'media1']
        };
        await testSearchMedia(testCase);
    });
});