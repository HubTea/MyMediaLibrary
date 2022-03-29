const express = require('../express');
const serverConfig = require('./serverConfig');
const orm = require('../sequelize');
const getModel = require('./model');
const auth = require('./authorizer');
const crypto = require('crypto');
const authentication = require('./digest');
const signer = require('./signer');


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
        const digest = new authentication.DigestPairFromDatabase(model.User, req.body.accountId);
        const digestGenerator = new authentication.Pbkdf2DigestGenerator(
            serverConfig.pbkdf2.iteration, serverConfig.pbkdf2.hash
        );
        const jwtSigner = new signer.Signer('sha512', serverConfig.key.private, serverConfig.key.public);
        
        //인증
        if(await digest.isEqual(req.body.accountPassword, digestGenerator) === false){
            //예외 던짐
            return;
        }

        //권한 부여
        const authorizer = new Authorizer({});
        const userRow = await model.User.findOne({
            attributes: ['userId'],
            where: {
                accountId: req.body.accountId
            }
        });

        authorizer.setAccessibleUser(userRow.userId);

        //토큰 발행
        const tokenBody = JSON.stringify({
            authToken: authorizer.export()
        });

        const signature = await jwtSigner.sign(tokenBody);

        res.write(JSON.stringify({
            token: tokenBody + '.' + signature.toString('base64')
        }));
        res.end();
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