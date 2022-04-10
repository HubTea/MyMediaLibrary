const express = require('express');

const serverConfig = require('./serverConfig');
const authRouter = require('./authRouter');
const usersRouter = require('./usersRouter');


const app = express();
const router = express.Router();


app.listen(serverConfig.port, function(){
    console.log('listening');
});

app.use(function(req, res, next){
    console.log('request: ' + req.method + ' ' + req.originalUrl);
    next();
});
app.use(express.json());
app.use('/' + serverConfig.apiVersion, router);

router.use('/auth', authRouter.router);
router.use('/users', usersRouter.router);


router.get('/medias/:mediaId', function(req, res){

});


router.get('/medias', function(req, res){

});


router.get('/medias/:mediaId/comments', function(req, res){
    
});