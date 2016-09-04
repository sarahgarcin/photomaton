/* VARIABLES */
var socket = io.connect();

/* sockets */
socket.on('connect', onSocketConnect);
socket.on('error', onSocketError);


jQuery(document).ready(function($) {

	$(document).foundation();
	init();
});


function init(){

	
}

/* sockets */
function onSocketConnect() {
	sessionId = socket.io.engine.id;
	console.log('Connected ' + sessionId);
};

function onSocketError(reason) {
	console.log('Unable to connect to server', reason);
};