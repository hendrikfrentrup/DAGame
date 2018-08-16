var socket = io();

$(document).ready(function(){
    
    socket.emit('chat message', $('#username').text() + ' just logged in');

    $('form').submit(function(){
      socket.emit('chat message', $('#m').val());
      $('#m').val('');
      return false;
    });

    socket.on('chat message', function(msg){
      $('#messages').append($('<li>').text(msg));
    });

    socket.on('user disconnected', function(){
      $('#messages').append($('<li>').text('some user went offline'));
    });

});