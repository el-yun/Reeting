var express = require('express');
var app = express();
var http = require('http').Server(app).listen(3000);
var io = require('socket.io')(http);
var holla = require('holla');
var rtc = holla.createServer(http);
// Define
var rooms = [];
app.get('/', function(req, res){
    console.log('Page Connection');
});

io.sockets.on('connection', function(socket){
    // Connect
    console.log('Connected :' + socket.id);
    socket.emit('data-response', { category: 'connect', msg : 'Connected :' + socket.id } );
    // Disconnect
    socket.on('disconnect', function(){
        if (rooms[socket.rooms[1]] != undefined){
            socket.leave(socket.rooms[1]);
            var room_userids = rooms[socket.rooms[1]].socket_ids;
            for(var c in room_userids){
                if(rooms[socket.rooms[1]].socket_ids[c] == socket.id) delete rooms[socket.rooms[1]].socket_ids[c];
            }
            socket.in(socket.rooms[1]).emit('data-response', { category: 'room-outuser', room_user: Object.keys(rooms[socket.rooms[1]].socket_ids)});
            console.log('Disconnect :' + socket.id);
        }
    });
    socket.on('data-request', function(req){
        console.log("data request...");
        switch(req.category) {
            case "room-connect":
                set_room(socket, req.roomname, req.username);
                // 기존 객체 등록
                if(rooms[req.roomname]) {
                    socket.emit('data-response', { category: 'data-load', col: rooms[req.roomname].collection});
                }
                break;
            case "data-put": // 아이템 추가
                if(rooms[req.room] != undefined) {
                    rooms[req.room].collection[req.idx] = req.item;
                    socket.in(req.room).emit('data-response', { category: 'data-put', item: req.item, idx: req.idx});
                }
                break;
            case "data-update": // 아이템 업데이트
                if(rooms[req.room] != undefined) {
                    rooms[req.room].collection[req.idx] = req.item;
                    socket.in(req.room).emit('data-response', { category: 'data-update', item: req.item, idx: req.idx});
                }
                break;
            case "data-mic": // 아이템 업데이트
                if(rooms[req.room] != undefined) {
                    socket.in(req.room).emit('data-response', { category: 'data-mic', stream: req.stream});
                }
                break;
            case "test":
                console.log(req.data);
                break;
            default:
                console.log("no category : " + req.category);
                break;
        }
        return rooms;
    });
});

function set_room(socket, roomname, username) {
    console.log("roomname : " + roomname);
    socket.join(roomname);
    var room = roomname;
    var username = username;
    // 방이 없을 경우 방 생성
    if (rooms[room] == undefined) {
        console.log('new room :' + room);
        rooms[room] = new Object();
        rooms[room].socket_ids = new Object();
        rooms[room].collection = new Object();
    }
    // 방 유저 정보 등록( Key: 사용자이름  Value : 사용자 소켓 ID )
    rooms[room].socket_ids[username] = socket.id;

    // 방 구성원에 접속 여부 통보
    socket.in(room).emit('data-response', { category: 'room-newuser', room_user: Object.keys(rooms[room].socket_ids) ,msg: username + ' 님이 입장하셨습니다.'});
    socket.emit('data-response', { category: 'room-connect', msg: room + '방에 접속합니다.', room_name : room, room_user: Object.keys(rooms[room].socket_ids) });

    return rooms;
}

http.listen(3000, function(){
    console.log('listening on *:3000');
});