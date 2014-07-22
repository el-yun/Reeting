var join = require('path');
var express = require('express');
var app = express();
app.use(express.static(__dirname));
var webRTC = require('webrtc.io').listen(3001);
console.log('voice_server : 3001');

app.get('/', function(req, res){
    console.log('voice_server');
});