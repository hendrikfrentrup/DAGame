var socket = io();
//var score = 100;
var playername;
var local_players = [];

function playEvil(player){
    console.log("playing evil" + player);
    //score-=10;
    //$('#score').text(score);
    //var recepient = "rrr";
    socket.emit('play request', {type:"evil",from:playername, to:player});
}

function playGood(player){
    console.log("playing good with", player);
    //score-=10;
    socket.emit('play request', {type:"good",from:playername, to:player});
}

function respondingGood(player, playRequest){
    console.log(playername, " responding good to", player, '\'s ', playRequest.data.type);
    //score-=10;
    socket.emit('respond request', {type:"good",from:playername, to:player});
}

function createGoodButtonFor(player, playRequest=null){
    if (playRequest){
        return $('<button id="respond-good">')
        .text("good")
        .click(function(){
            respondGood(player, playRequest);
        });
    }
    else {
        return $('<button id="play-good">')
        .text("good")
        .click(function(){
            playGood(player);
        });
    }
}

function createEvilButtonFor(player){
    return $('<button id="play-evil">')
            .text("evil")
            .click(function(){
                playEvil(player);
            });
}


function addToActivePlayerList(player){
    // TODO: instead of appending list items all the time, we should do it properly
    $('#activeplayers')
    .append($('<li>').text(player)
            .append(createGoodButtonFor(player))
            .append(createEvilButtonFor(player))
        );
}

function isRegistered(player){
    return local_players.indexOf(player) == -1;
}






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

    $('#send').submit(function(){
        // $('#messages').append($('<li>').text('-'+msg));
        console.log('sending out chat msg: ' + $('#m').val()); 
        socket.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });

    playername = $('#plid').text().replace(/ /g,'');
    socket.emit('add player', playername);

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

    socket.on('fill active players', function(data){
        // if (!(isRegistered(playername))){
            local_players=data.players;
            data.players.forEach(function(player){
                addToActivePlayerList(player);
            });
        // }
    });

    socket.on('login', function(data){
        console.log('active users: ', data.numUsers);
        $('#numactiveusers').text(data.numUsers);
    });
    
    socket.on('player added', function(data){
        var other_playername = data.username;
        console.log('other player joined: ' + other_playername);
        addToActivePlayerList(other_playername);
    });
    
    socket.on('play request', function(data){
        if (data.to==playername){
            console.log('received play request: ', data.from, ' type: ', data.type);
    
            $('#playrequests')
            .append($('<li>').text(data.from)
                    .append(createGoodButtonFor(data.from))
                    .append(createEvilButtonFor(data.from))
                );
        }
        else{
            console.log('not for me');
        }
    });

});