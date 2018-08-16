var socket = io();
var score = 100;
var playername;

function playEvil(){
    console.log("playing evil");
    score-=10;
    $('#score').text(score);
    var recepient = "rrr";
    socket.emit('play request', {type:"evil",from:playername, to:recepient});
    console.log("play request sent to");
};

function playGood(){
    console.log("playing good with", recepient);
    score-=10;
    $('#score').text(score);
};


socket.on('login', function(data){
    console.log('active users: ', data.numUsers);
    $('#numactiveusers').text(data.numUsers);
});



socket.on('play request', function(data){
    if (data.to==playername){
        console.log('received play request: ', data.from, ' type: ', data.type);

        $('#playrequests')
        .append($('<li>').text(data.from)
                .append($('<button id="play-good" onclick="playGood()">').text("good"))
                .append($('<button id="play-evil" onclick="playEvil()">').text("evil"))
            );
    }
    else{
        console.log('not for me')
    }
});



socket.on('private message', function (from, msg) {
    console.log('I received a private message by ', from, ' saying ', msg);
  });

socket.on('chat message', function(msg){
    console.log('receiving chat msg: ' + msg);  
    $('#messages').append($('<li>').text(msg));
});

socket.on('status', function(msg){
    console.log('status: ' + msg);  
    $('#messages').append($('<li style="color:blue;font-size:8px;">').text(msg));
});

socket.on('bcstatus', function(msg){
    console.log('bc status msg: ' + msg);  
    // $('#messages').append($('<li style="color:blue;font-size:8px;">').text(msg));
});

socket.on('disconnect', function(){
    console.log('server down!');
});

$(function () {

    $('#score').text("-");
    $('#plid').text("-");

    $('#send').submit(function(){
        // $('#messages').append($('<li>').text('-'+msg));
        console.log('sending out chat msg: ' + $('#m').val()); 
        socket.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });




    // set player name
    $('#setplayerid').submit(function(){
        playername = $('#playerid').val();

        if (playername) {
            console.log('registering as player: ' + playername); 

            // when success, then set?
            $('#playerid').val('');
            $('#score').text(score);
            $('#plid').text(playername);

            socket.emit('add player', playername);

            return false;

        }
        else {
            console.log("user name needs to be specified");
        }
    });
    
    // // Whenever the server emits 'user joined', log it in the chat body
    // socket.on('player added', (data) => {
    //     log(data.username + ' joined');
    //     addParticipantsMessage(data);
    // });
    socket.on('player added', function(data){
        var other_playername=data.username
        console.log('player registered: ' + other_playername);  
        $('#activeplayers')
        .append($('<li>').text(other_playername)
                .append($('<button id="play-good" onclick="playGood()">').text("good"))
                .append($('<button id="play-evil" onclick="playEvil()">').text("evil"))
            );
    });


});