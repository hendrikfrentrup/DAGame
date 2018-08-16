var express = require('express');
var app = express();
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var url = require('url');

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

var id = function(){
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
  console.log(req.query.username);  
  //res.sendFile(__dirname + '/views/index.html');
  //res.sendFile(__dirname + '/index.html');
  res.render('index', {username: req.query.username, score: 100});
});

app.get('/login', function (req, res) {
   //res.render('login', {title: 'DOG'});
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

var numUsers=0;
var players = [];
var pendingPlays = [];

io.on('connection', function(socket){
    //var addedUser = false;

    console.log('connection established, socketID:' + socket.id);

    socket.emit('fill active players', {players: players});

    // when the client emits 'add player', this listens and executes
    socket.on('add player', function(username){
        //if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = username;
        players.push(username);
        //addedUser = true;
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

        pendingPlays.push({
            id: id(),
            requester: data.from,
            receiver: data.to,
            type: data.type
        });

        io.emit('play request', data);
    });

    socket.on('respond request', function(data){
        
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