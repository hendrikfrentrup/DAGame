var socket = io();
var playername;

function playEvil(player){
    console.log("playing evil" + player);
    socket.emit('play request', {type:"evil",from:playername, to:player});
}

function playGood(player){
    console.log("playing good with" + player);
    socket.emit('play request', {type:"good",from:playername, to:player});
}

function respondWithGood(id){
    socket.emit('respond request', {type:"good", id: id});
}

function respondWithEvil(id){
    socket.emit('respond request', {type:"evil", id: id});
}

function addToActivePlayerList(player){
    $('#activeplayers')
    .append($('<li>').text(player)
            .append(createGoodButtonFor(player))
            .append(createEvilButtonFor(player))
        );
}

function iJustConnected(players){
    return players.indexOf(playername) == -1;
}

function createGoodButtonFor(player){
    return $('<button id="play-good">')
            .text("good")
            .click(function(){
                playGood(player);
            });
}

function createGoodResponseFor(id){
    return $('<button>')
            .text("good")
            .click(function(){
                respondWithGood(id);
            });
}

function createEvilButtonFor(player){
    return $('<button id="play-evil">')
            .text("evil")
            .click(function(){
                playEvil(player);
            });
}

function createEvilResponseFor(id){
    return $('<button>')
            .text("evil")
            .click(function(){
                respondWithEvil(id);
            });
}

socket.on('login', function(data){
    console.log('active users: ', data.numUsers);
    $('#numactiveusers').text(data.numUsers);
});

socket.on('play request', function(data){
    if (data.to==playername){
        console.log('received play request: ', data.from, ' type: ', data.type);

        $('#playrequests')
        .append($('<li>').attr('id', data.id).text(data.from)
                .append(createGoodResponseFor(data.id))
                .append(createEvilResponseFor(data.id))
            );
    }
    else{
        console.log('not for me');
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

socket.on('fill active players', function(data){
    if(iJustConnected(data.players)){
        data.players.forEach(function(player){
            addToActivePlayerList(player);
        });
    }
});

socket.on('updated scores', function(scores){
    if(scores.hasOwnProperty(playername)){
        $('#score').text(scores[playername]);
    }
});

$(function () {

    $('#send').submit(function(){
        // $('#messages').append($('<li>').text('-'+msg));
        console.log('sending out chat msg: ' + $('#m').val()); 
        socket.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });

    playername = $('#plid').text().trim();
    socket.emit('add player', playername);
    
    // // Whenever the server emits 'user joined', log it in the chat body
    // socket.on('player added', (data) => {
    //     log(data.username + ' joined');
    //     addParticipantsMessage(data);
    // });
    socket.on('player added', function(data){
        var other_playername = data.username;
        console.log('player registered: ' + other_playername);
        addToActivePlayerList(other_playername);
    });


});