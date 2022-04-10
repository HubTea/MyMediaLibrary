const express = require('express');
const crypto = require('crypto');

const serverConfig = require('./serverConfig');
const authUtil = require('./authUtil');
const error = require('./error');
const {handleError} = require('./errorHandler');
const authentication = require('./digest');

const router = express.Router();


router.post('/', async function(req, res){
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
        let digest = await digestGenerator.generateDigest(accountPw, salt, 32);
        let digestString = digest.toString('base64').replace('=', '');
        
        let newUser;
        try{
            newUser = await serverConfig.model.User.create({
                accountId: accountID,
                nickname,
                accountPasswordHash: digestString,
                accountPasswordsalt: salt
            });
        }
        catch(err){
            throw new error.InternalError(err);
        }

        res.status(201);
        res.setHeader('Location', '/v1/users/' + newUser.userId);
        res.end();
    }
    catch(err){
        handleError(res, err);
    }
});


router.put('/:userId/password', function(req, res){

});


router.get('/:userId/info', function(req,res){
    
});


router.patch('/:userId/info', function(req, res){

});


router.post('/:userId/medias', function(req, res){

});


router.get('/:userId/medias', function(req, res){
    
});


router.get('/:userId/subscribers', function(req, res){

});


router.get('/:userId/bookmarks', function(req, res){

});


router.get('/:userId/comments', function(req, res){

});


module.exports = {
    router
};