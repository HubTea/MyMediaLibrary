const http = require('http');
const assert = require('assert');
const qs = require('qs');

const serverConfig = require('../src/serverConfig');
const { Controller } = require('../controller/controller');


function defaultQuerySerializer(query){
    return qs.stringify(query, {
        arrayFormat: 'repeat'
    });
}

const localhostRequestOption = {
    baseURL: `http://localhost:${serverConfig.port}/v1/`,
    paramsSerializer: defaultQuerySerializer,
    validateStatus: null
};

class RequestOptionBuilder{
    constructor(base){
        this.base = Object.assign({}, base);
    }

    export(){
        return this.base;
    }

    setToken(token){
        if(this.base.headers){
            this.base.headers.Authorization = token;
        }
        else{
            this.base.headers = {
                Authorization: token
            };
        }

        return this;
    }
}

class PageAssembler{
    /**
     * 
     * @param {PageGenerator} pageGenerator 
     */
    constructor(pageGenerator){
        this.pageGenerator = pageGenerator;
    }

    async assemble(){
        let list = [];
        let cursor;
    
        while(true){
            let body = await this.pageGenerator.generate(cursor);
    
            assert.strictEqual(this.pageGenerator.getStatus(), 200);
            assert.ok(body);
            assert.ok(body.list);
    
            list = list.concat(body.list);
    
            if(body.cursor){
                cursor = body.cursor;
            }
            else{
                break;
            }
        }
    
        return list;
    }
}

class PageGenerator{
    /**
     * 
     * @param {Controller} controller 
     */
    constructor(controller){
        this.controller = controller;
    }

    /**
     * 
     * @param {string | undefined} cursor 
     * @return {Promise<object>}
     */
    generate(cursor){

    }

    getStatus(){
        return this.controller.recentResponse.status;
    }
}

async function assertEqualPage(uuidList, pageGenerator){
    await comparePage(uuidList, pageGenerator, compareSetEquality);
}

async function assertEqualOrderPage(uuidList, pageGenerator){
    await comparePage(uuidList, pageGenerator, compareOrderEquality);
}

async function comparePage(uuidList, pageGenerator, comparator){
    let assembler = new PageAssembler(pageGenerator);
    let assembledPage = await assembler.assemble();
    let uuidListClone = JSON.parse(JSON.stringify(uuidList));

    comparator(uuidListClone, assembledPage);
}

function compareSetEquality(uuidList, assembledPage){
    assert.strictEqual(assembledPage.length, uuidList.length);
    for(let element of assembledPage){
        let index = uuidList.indexOf(element.uuid);

        assert.notStrictEqual(index, -1);
        uuidList.splice(index, 1);
    }
    assert.strictEqual(uuidList.length, 0);
}

function compareOrderEquality(uuidList, assembledPage){
    assert.strictEqual(assembledPage.length, uuidList.length);
    for(let i = 0; i < assembledPage.length; i++){
        assert.strictEqual(assembledPage[i].uuid, uuidList[i]);
    }
}

module.exports = {
    localhostRequestOption,

    RequestOptionBuilder,
    PageAssembler,
    PageGenerator,
    assertEqualPage,
    assertEqualOrderPage,
};