const express = require('express');
const orm = require('sequelize');
const crypto = require('crypto');

const serverConfig = require('./serverConfig');
const getModel = require('./model');
const authentication = require('./digest');
const handler = require('./requestHandler');


const app = express();
const router = express.Router();

const sequelize = new orm.Sequelize(serverConfig.sqlServer.url);
const model = getModel(sequelize);


app.listen(serverConfig.port, function(){
    console.log('listening');
});

app.use(express.json());
app.use('/' + serverConfig.apiVersion, router);


router.get('/auth', async function(req, res){
    try{
        const user = await model.User.findOne({
            attributes: ['userId', 'accountPasswordHash', 'accountPasswordSalt'],
            where: {
                accountId: req.body.accountId
            }
        });

        if(user === null){
            //예외 던짐
        }

        const digest = new authentication.ConstantDigestPair(
            Buffer.from(user.accountPasswordHash, 'base64'), 
            user.accountPasswordSalt
        );
        const digestGenerator = new authentication.Pbkdf2DigestGenerator(
            serverConfig.pbkdf2.iteration, serverConfig.pbkdf2.hash
        );
        
        handler.responseAuth(req, res, digest, digestGenerator, user);
    }
    catch(err){
        //에러 메시지 전송
        //에러 로깅
    }
});


router.post('/users', function(req, res){

});


router.put('/users/:userId/password', function(req, res){

});


router.get('/users/:userId/info', function(req,res){
    
});


router.patch('/users/:userId/info', function(req, res){

});


router.post('/users/:userId/medias', function(req, res){

});


router.get('/users/:userId/medias', function(req, res){
    
});


router.get('/users/:userId/subscribers', function(req, res){

});


router.get('/users/:userId/bookmarks', function(req, res){

});


router.get('/users/:userId/comments', function(req, res){

});


router.get('/medias/:mediaId', function(req, res){

});


router.get('/medias', function(req, res){

});


router.get('/medias/:mediaId/comments', function(req, res){
    
});