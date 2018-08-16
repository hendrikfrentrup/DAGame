var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    // res.send('<h1>Hello world</h1>');
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

    console.log('socketID:' + socket.id)
    console.log('a user connected');
    // send private message to user with new ID
    // send notification to other users that other players have joined!
    // add player to potential player list
    io.emit('status', "now connected");

    setInterval(function(){
        socket.emit('stream', {'title': "A new title via Socket.IO!"});
    }, 1000);

    socket.on('disconnect', function(){
        io.emit('status', "user disconnected");
        console.log('user disconnected');
    });

    // socket.on('chat message', function(msg){
    //     console.log('message: ' + msg);
    // });

    socket.on('chat message', function(msg){
        console.log('chat message: ' + msg);
        io.emit('chat message', msg);
    });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});