var io = require('socket.io').listen(8080);



io.set('log level', 1); 
 io.set('transports', [                     // enable all transports (optional if you want flashsocket)
    'websocket'								// BEST FOR REAL TIME COMMUNICATION
	, 'flashsocket'   						// BEST FOR REAL TIME COMMUNICATION
  , 'xhr-polling'							//NOT GOOD FOR REAL TIME COMMUNICATION HAS  A LAG IN RESPONSE AND PUSH
  ,'xhr-multipart'							//NOT GOOD FOR REAL TIME COMMUNICATION HAS  A LAG IN RESPONSE AND PUSH
  ,'jsonp-polling'							//NOT GOOD FOR REAL TIME COMMUNICATION HAS  A LAG IN RESPONSE AND PUSH
 
]);

io.set('flash policy server', true);
io.set('flash policy port', 843);
io.set('polling duration', 20);
io.set('heartbeat timeout', 20);
io.set('heartbeat interval', 20);

//PLAYER ONE HOLD ID OF GAMEcLIENT WHICH IS HARD CODED
var player_one =0;

//PLAYER ONE HOLD ID OF gAME PLAYER WHICH IS DYANMIC
var player_two=0;
var connCount=0;
var clients_arr=[];
var gameInterval=0;
var timeleft=60;
var gameClientSocket="";
function players_trace(){
	console.log("player_one :: "+player_one+"   player_two :: "+player_two)	;
}

function parseObject(obj){
	var str=""
	for(var i in obj){
		str += i +" "+obj[i] + " , ";
		}
		return str;
}

// COMMON FNCTION TO BROADCAST MESSAGE TO ALL CLINETS
function sendMessage(socket,msg){
	 socket.get('nickname', function (err, name) {
		        pingpong.emit('message', {
	            msg: msg,
	            plname:name,
				plsid:socket.id
	        });			
	 });
}


function showClients(msg){
	var clients = io.sockets.clients();
		for( var i in clients){	
			clients[i].get('nickname', function (err, name) {	    		
				console.log(msg +" "+i+" - "+name+" - "+clients[i].id+" - ");	
				});
								
		}
}
// LOGIC TO calculate active clinets 
function clientCount(){
		var len = clients_arr.length;
		return len;
}
function addClient(obj){
	for( var i in clients_arr){
		if(clients_arr[i].id == obj.id){
			return;
		}
	}
	clients_arr.push(obj);
}
function removeClient(id){
	for( var i in clients_arr){
		if(clients_arr[i].id == id){
			clients_arr.splice(i,1);
			return ;
		}
	}
	console.log("/* remove client console */")
	console.log(clients_arr);
}
function nextClient(id){
		if(clients_arr.length > 1 && player_two == 0){
	//for( var i in clients_arr){
	//	if(clients_arr[i].id == id){	
			player_two = clients_arr[1].id;
			console.log(player_two +":: next player ::"+ clients_arr[1].cname);
			 pingpong.emit('message',{
				nextId:player_two,
				clients:clients_arr,
				msg:"CPLAYER_DISCONNECT"
				});					
				return ;				
	//	}
	//}
		}
}
function activeClients(cuurID){
	var clients = io.sockets.clients();
	var aclients = [];
	for( var i in clients){		
		if(clients[i].id == cuurID){
			continue;
			}
		clients[i].get('nickname', function (err, name) {	  
				if(name != null ){
				aclients.push({id:clients[i].id,cname:name});
			}
		});	
		
	}
	return aclients;
}
// LOGIC TO SWAP TO NEXT AVALABLE PLAYER FROM THE QUE OF PLAYERS
function callNextPlayer(cuurID){
	
	var clients = io.sockets.clients();
			connCount = clientCount();
			if(connCount > 2 ){
				//if connections greter then 2 then swap player 2 to next player
				var clName;
				for( var i in clients){						
					clients[i].get('nickname', function (err, name) {	  
							clName=name;
						});
					console.log("next player calc -- "+clName+" -- "+clients[i].id);
					if(clients[i].id == player_one || clients[i].id == cuurID || clients[i].id == player_two){
						continue;
						}					
					if(clName != null){  		
							console.log("next player -- "+clName+" -- "+clients[i].id);
							player_two = clients[i].id;
							 pingpong.emit('message',{
								nextId:player_two,
								clients:activeClients(cuurID),
								msg:"CPLAYER_DISCONNECT"
								});	
								break;								
						}else{
							continue;
						}
										
				}
			}	
		players_trace();
}

// open the socket connection
var pingpong =  io
.of('/pingpong')
.on('connection', function (socket) {
   
/*	var interval = setInterval(function(){
		//showClients("on setinterval");
		console.log(io.sockets.clients[socket.id]);
		//gameSocket.json.send({ a: 'brrrrrrrrrrrrr' });
		},5000)
		*/
		
	
	
	//LISING MESSAGE FROM CLIENT AND BROADCASTING TO ALL
	   socket.on('message', function (data) {
	        console.log('message ' + parseObject(data) );
	        var sender = 'unregistered';
	        socket.get('nickname', function (err, name) {
	            sender = name;
	        });
	        socket.broadcast.emit('message', {
	            msg: data,
				id:player_two,
	            msgr: sender
	        });
	    });
	
	//LISING SLIDER Y POSS FROM CLIENT AND BROADCASTING TO ALL	
	 socket.on('posData', function (data) {
        var sender = 'unregistered';
        socket.get('nickname', function (err, name) {
           sender = name; 
		//console.log(name +" ypos "+data);       
	        socket.broadcast.emit('posData', {
				name:name,
				sid:socket.id,
				GameClientid:player_one,
	            msg: data,
	            msgr: sender
	        });
		});
    });
	
	//LISING FOR WINNER ON GAME OVER AND GENRATING RANDOM COUPON CODE AND SENDNG TO WINNER AS MESSAGE
	 socket.on('winner', function (data) {
        socket.get('nickname', function (err, name) {
            sender = name;
        });
        var code = Math.round(Math.random() * 9999999);
        console.log('winner is :: '+data.name+" - "+data.id+" - "+ code);
        pingpong.emit('winner', {
			name:data.name,
			sid:data.id,
            msg: code
        });
    });
	
	
	// REGISTER USER HERE
	socket.on('register', function (name) {
		 var sender = 'unregistered';		
        socket.set('nickname', name, function () {
			sender = name;
			addClient({id:socket.id,cname:name});
            socket.emit('register', {
				name:name,
				sid:socket.id,
				clients:clients_arr
            });
			
			console.log('registered ', name +" -- "+ socket.id);
			
			// CHECK IF PLAYER TWO IS NOT SET THEN SET player two AND START GAME
			// OR if player is playing and and request of register is again from existing clinet then start game
			if((player_one != 0 && player_two == 0) || player_two == socket.id){
					player_two = socket.id;			
					sendMessage(socket,"GAMESTART");
				}
			//set player ONE TO GAMECLINET HARDCODED
			if(name == "GameClient_Computer"){
				player_one = socket.id;
				gameClientSocket = socket;
				}
			if(gameClientSocket != ""){
			/*update list on game client*/	
			gameClientSocket.emit('register', {
				name:name,
				sid:socket.id,
				clients:clients_arr
            });
}
			/*//CHECK IF SOME ONE PLAYING THEN SEND MESSAGE TO CURRENT PLAYER WITH NUMBER OF PLAYERS IN QUEUE		
			 if(player_two != 0){
				 connCount = clientCount()-2;
				 socket.json.send({msg:"QUEUE_NO",count:connCount}); 
				 console.log(connCount + " que num " + name +" - "+ socket.id);
			}*/
        });		
		players_trace();
		//showClients("on register");
    });
	
	// ON DISCONNECT OF A CLIENT
	socket.on('disconnect', function () {		
        socket.get('nickname', function (err, name) {           
			if(socket.id == player_one){
				player_one = 0;
			}
			if(socket.id == player_two){
					player_two = 0;
			}	
			removeClient(socket.id);
	       pingpong.emit('unregister', {
				name:name,
				sid:socket.id,
				clients:clients_arr			
            });
		
		players_trace();
        console.log('disconnect ', name +" -- "+ socket.id, 'error ', err);
        });
		
		
		// CALL FUNCTION TO PROPT THE NEXT PLAYER IN QUE
		nextClient(socket.id);	
		
		//REMOVE THE NAME OF DISCONNECTED USER FROM CLIENTS
		socket.set('nickname', null, function () {
		});
		//showClients("on disconnect");
		
		
    });
	
		
    return socket;
});