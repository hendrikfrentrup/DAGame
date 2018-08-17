var express = require('express');
var app = express();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var url = require('url');

var players = [];
var pendingPlays = [];
var scores = {};
var initialScore = 100;
var goodAction = 'good';
var evilAction = 'evil';

var simplerAuth = function(req, res, next) {
  if (players.indexOf(req.query.username) == -1)
    return next();
  else
    res.redirect('/tryagain');
};

var generateId = function(){
    return Math.random().toString(36).substr(2, 9);
};

var updateScores = function(play, receiverResponse){
    var gains = calculateGains(play.type, receiverResponse);

    scores[play.requester] += gains.requester;
    scores[play.receiver] += gains.receiver;
};

var calculateGains = function(requesterAction, receiverAction){
    if(requesterAction == goodAction && receiverAction == goodAction){
        return { requester: 1, receiver: 1 };
    }else if (requesterAction == goodAction && receiverAction == evilAction){
        return { requester: -10, receiver: 20 };
    }else if (requesterAction == evilAction && receiverAction == goodAction){
        return { requester: 20, receiver: -10 };
    }else {
        return { requester: -10, receiver: -10 };
    }
};

app.use(express.static('static'));

app.set('view engine', 'pug');
app.set('views', './views');

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', simplerAuth, function(req, res){
  res.render('index', {username: req.query.username, score: initialScore});
});

app.get('/login', function(req, res){
    res.render('landing');
  });

app.get('/tryagain', function (req, res) {
   res.sendFile(__dirname + '/views/tryagain.html');
});

app.get('/reset', function(req, res){
    players = [];
    pendingPlays = [];
    scores = {};
    res.send('game reset');
});

io.on('connection', function(socket){

    console.log('connection established, socketID:' + socket.id);

    socket.emit('fill active players', {players: players});

    // when the client emits 'add player', this listens and executes
    socket.on('add player', function(username){
        if (players.indexOf(username) != -1) return;

        // we store the username in the socket session for this client
        players.push(username);
        scores[username] = initialScore;
        console.log('player registered: ', username ,', active players: ', players.length);
        io.emit('login', { numUsers: players.length });

        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('player added', {
            username: username,
            numUsers: players.length
        });
    });

    // request a play 
    socket.on('play request', function(data){
        // play requested from - to -> private message
        console.log(data.type, ' play requested from ', data.from);

        var id = generateId();

        pendingPlays.push({
            id: id,
            requester: data.from,
            receiver: data.to,
            type: data.type
        });

        console.log(pendingPlays);

        io.emit('play request', {
            id: id,
            to: data.to,
            from: data.from
        });
    });

    socket.on('respond request', function(data){
        
        var play = pendingPlays.find(function(play){
                        return play.id == data.id;
                    });

        updateScores(play, data.type);

        console.log(scores);

        io.emit('updated scores', scores);

        io.emit('remove pending play', play.id);
    });


    // send private message to user with new ID
    // send notification to other users that other players have joined!
    // add player to potential player list
    io.emit('status', "now connected (joining the order)");
    socket.broadcast.emit('bcstatus', "-joining the order");

    socket.on('disconnect', function(){
        io.emit('status', "user disconnected");
        console.log('user disconnected');
    });

    socket.on('chat message', function(msg){
        console.log('chat message: ' + msg);
        io.emit('chat message', msg);
    });

});

var process = require('process');

http.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});