const express = require('express');
const serverConfig = require('./serverConfig');

const app = express();
const router = express.Router();


app.listen(serverConfig.port, function(){
    console.log('listening');
});


app.use(express.json());
app.use('/' + serverConfig.apiVersion, router);


router.get('/auth', function(req, res){
    
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