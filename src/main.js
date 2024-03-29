const express = require('express');

const serverConfig = require('./serverConfig');
const authRouter = require('./authRouter');
const usersRouter = require('./usersRouter');
const mediaRouter = require('./mediaRouter');


const app = express();
const router = express.Router();

let contextId = 0;

app.listen(serverConfig.port, function(){
    console.log('listening');
});

app.use(function(req, res, next){
    req.myContext = {
        contextId: contextId++
    };
    next();
});
app.use(function(req, res, next){
    serverConfig.logger.log({
        level: 'info', 
        message: `request: ${req.method} ${req.originalUrl}`
    });
    next();
});
app.use(express.json());
app.use('/' + serverConfig.apiVersion, router);

router.use('/auth', authRouter.router);
router.use('/users', usersRouter.router);
router.use('/medias', mediaRouter.router);