const app = require('express')();
const serverConfig = require('./serverConfig');


app.listen(serverConfig.port, function(){
    console.log('listening');
});


