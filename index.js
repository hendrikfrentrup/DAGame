var express = require('express');
var app = express();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var url = require('url');

var players = [];
var pendingPlays = [];
var scores = {};
var initialScore = 100;

var passwords = {
    'monk': 'pass',
    'priest': 'word'
};

var auth = function(req, res, next) {
  if (req.session && passwords.hasOwnProperty(req.session.user))
    return next();
  else
    res.redirect('/login');
};

var generateId = function(){
    return Math.random().toString(36).substr(2, 9);
};

var session = require('express-session');
app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true
}));

app.use(express.static('public'));
app.use(express.static('static'));
app.use(express.static('scripts'));

app.set('view engine', 'pug');
app.set('views', './views');

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', auth, function(req, res){
  res.render('index', {username: req.query.username, score: initialScore});
});

app.get('/login', function (req, res) {
   res.sendFile(__dirname + '/views/login.html');
});

app.post('/login', multipartMiddleware, function (req, res) {

    console.log(req.body);

    if (req.body.username && passwords.hasOwnProperty(req.body.username) && req.body.password && req.body.password == passwords[req.body.username]) {
            req.session.authenticated = true;
            req.session.user = req.body.username;
            res.redirect(url.format({
               pathname:"/",
               query: {
                  "username": req.body.username
                }
             }));
    } else {
        res.redirect('/login');
    }

});

app.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/login');
});

io.on('connection', function(socket){

    console.log('connection established, socketID:' + socket.id);

    socket.emit('fill active players', {players: players});

    // when the client emits 'add player', this listens and executes
    socket.on('add player', function(username){
        if (players.indexOf(username) != -1) return;

        // we store the username in the socket session for this client
        socket.username = username;
        players.push(username);
        scores[username] = initialScore;
        console.log('player registered: ', username ,', active players: ', players.length);
        io.emit('login', { numUsers: players.length });

        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('player added', {
            username: socket.username,
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

        //hendrick's part

        scores[play.requester] += 10;
        scores[play.receiver] -= 10;

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
        console.log('user disconnected' + socket.username);
    });

    socket.on('chat message', function(msg){
        console.log('chat message: ' + msg);
        io.emit('chat message', msg);
    });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});