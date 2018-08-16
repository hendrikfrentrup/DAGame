
const express = require('express');
const app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('static'))

app.get('/', function(req, res){
    // res.send('<h1>Hello world</h1>');
    res.sendFile(__dirname + '/index.html');
});



var user_id=0;
var numUsers=0;

io.on('connection', function(socket){
    var addedUser = false;

    console.log('connection established, socketID:' + socket.id)

    // when the client emits 'add player', this listens and executes
    socket.on('add player', function(username){
        if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        console.log('player registered: ', username ,', active players: ', numUsers)
        socket.emit('login', {
        numUsers: numUsers
        });

        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('player added', {
        username: socket.username,
        numUsers: numUsers
        });
    });



    // request a play 
    socket.on('play request', function(data){
        // play requested from - to -> private message
        console.log(data.type, ' play requested from ', data.from);
        io.emit('play request', data);
    });

    


    // send private message to user with new ID
    // send notification to other users that other players have joined!
    // add player to potential player list
    io.emit('status', "now connected (joining the order)");
    socket.broadcast.emit('bcstatus', "-joining the order");

    socket.on('disconnect', function(){
        // numUsers--;
        io.emit('status', "user disconnected");
        console.log('user disconnected');
    });

    socket.on('chat message', function(msg){
        console.log('chat message: ' + msg);
        io.emit('chat message', msg);
    });





});

http.listen(3000, function(){
  console.log('listening on *:3000');
});