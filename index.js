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

var session = require('express-session');
app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true
}));

app.use(express.static('public'));
app.use(express.static('scripts'));

app.set('view engine', 'pug');
app.set('views', './views');

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', auth, function(req, res){
  console.log(req.query.username);  
  //res.sendFile(__dirname + '/views/index.html');
  res.render('index', {username: req.query.username});
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

io.on('connection', function(socket){
  
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });

  socket.on('disconnect', function(){
    io.emit('user disconnected');
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});