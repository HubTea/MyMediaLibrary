const express = require('express');
const crypto = require('crypto');

const serverConfig = require('./serverConfig');
const authUtil = require('./authUtil');
const error = require('./error');
const {handleError} = require('./errorHandler');
const authentication = require('./digest');

const router = express.Router();


router.post('/users', async function(req, res){
    try{
        let accountID = req.body.accountID;
        let accountPw = req.body.accountPassword;
        let nickname = req.body.nickname;

        let iteration = serverConfig.pbkdf2.iteration;
        let hash = serverConfig.pbkdf2.hash;
        let digestGenerator = new authentication.Pbkdf2DigestGenerator(
            iteration, hash
        );

        let randomBytes = crypto.randomBytes(18);
        let salt = randomBytes.toString('base64');
        let digest = digestGenerator.generateDigest(accountPw, salt);
        let digestString = digest.toString('base64').replace('=', '');
        
        let newUser;
        try{
            newUser = await serverConfig.model.User.create({
                accountID,
                nickname,
                accountPasswordHash: digestString,
                accountPasswordsalt: salt
            });
        }
        catch(err){
            throw new error.InternalError(err);
        }

        res.status(201);
        res.setHeader('Location', req.path + '/' + newUser.userID);
        res.end();
    }
    catch(err){
        handleError(err);
    }
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


module.exports = {
    router
};