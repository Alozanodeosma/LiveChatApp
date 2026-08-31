////////////////////////////////////////////////////////////////////////////////////
/// SERVER CREATION ////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////
const http = require('http');
const fs = require('fs/promises');
const {join, extname, parse} = require('path');
const WebSocket = require('ws');
const { json } = require('stream/consumers');

const PORT = 3001;  

const server = http.createServer(async (request, response) => {
    try{
        const url = request.url === "/" ? "/index.html" : request.url;
        const filePath = join("public", url);
        
        const mimeTypes = { //multi porpouse mail extensions
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.ico': 'image/x-icon'
        };

        const ext = extname(filePath).toLowerCase();

        const contentType = mimeTypes[ext] || "application/octet-stream";
        const htmlFile = await fs.readFile(filePath);
        response.writeHead(200, {'Content-Type' : contentType});
        response.end(htmlFile); 
    }catch(err){
        response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end("Error al cargar la página");
    }
});

const webSocketServer = new WebSocket.Server({server});

webSocketServer.on("close",()=>{
    console.log("Good bye, server closing!");
})

const serverChatrooms = new Map();

webSocketServer.on("connection",(socket)=>{
    //when the socket is Open, log a confirmation message on CLIENT side
    socket.on("open",()=>{
        console.log("a connection has been open");
    });

////////////////////////////////////////////////////////////////////////////////////
/// SERVER MESSAGE HANDLER /////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

    socket.addEventListener("message",(message)=>{
        const parsedMessage = JSON.parse(message.data);
        switch(parsedMessage.type){

            //TEXT MESSAGES
            case "textMessage":
                serverChatrooms.get(parsedMessage.chatId).clients.forEach((client)=>{
                    if(client!=socket){
                        client.send(JSON.stringify(parsedMessage));
                    }
                });
                break;
            //CREATION OF CHATROOM
            case "chatroomCreationPetition":
                let chatRoomId = createChatroomCode();
                console.log("CHATROOM CREATED SUCCESFULLY WITH ID: "+chatRoomId)
                socket.send(serverMessageFormat("chatroomCode",chatRoomId));
                serverChatrooms.set(chatRoomId,{
                    clients:[socket],
                    chatroomData:{
                        lastMessages:[],
                        usernames:[],
                        chatroomName:""
                    }
                }
                );
                break;
            //JOINING A CHATROOM
            case "chatroomJoinPetition":
                let desiredChatroomId = parsedMessage.data.chatroomId;
                let desiredChatroom = serverChatrooms.get(desiredChatroomId);
                //Send the new User the authority to create the chatroom
                socket.send(serverMessageFormat("chatroomCode",desiredChatroomId));
                //For each other clients of that chat room, send them the new Username to update their sidebar
                desiredChatroom.clients.forEach(client=>{
                    client.send(JSON.stringify({
                        type:"username",
                        data:{
                            username:parsedMessage.data.username,
                            previousUsername:null
                        },
                        chatId: desiredChatroomId
                    }));
                })
                //add the new user to the ServerChatroom
                serverChatrooms.get(desiredChatroomId).clients.push(socket);
                //send last 3 messages
                desiredChatroom.chatroomData.lastMessages.forEach(message=>{
                    socket.send(serverMessageFormat("textMessage",message,desiredChatroomId));
                });
                
                //send chatroom name
                socket.send(serverMessageFormat("chatroomName",desiredChatroom.chatroomData.chatroomName,desiredChatroomId));
                break;
                //USERNAME CHANGE
                case "username":
                    const currentRoom = serverChatrooms.get(parsedMessage.chatId);
                    
                    if (!currentRoom) break;

                    const roomUsernames = currentRoom.chatroomData.usernames;
                    let usernameChange = false;

                    for (let i = 0; i < roomUsernames.length; i++) {
                        if (roomUsernames[i] === parsedMessage.data.previousUsername) {
                            roomUsernames[i] = parsedMessage.data.username;
                            usernameChange = true;
                            break;
                        }
                    }

                    if (!usernameChange && !roomUsernames.includes(parsedMessage.data.username)) {
                        roomUsernames.push(parsedMessage.data.username);
                    }

                    currentRoom.clients.forEach((client) => {
                        if (client != socket) {
                            client.send(JSON.stringify(parsedMessage));
                        }
                    });
                break;

            
            default:
                console.warn("Message type not recognized");
            }
        })
    });

    function createChatroomCode(){
        return Math.floor(Math.random() * 1000000000).toString();
    }




server.listen(3001, () => {
  console.log('Servidor escuchando en http://localhost:3001');
});

function serverMessageFormat(type,data=null,chatId){
    return JSON.stringify({
        type: type,
        data: data,
        chatId:chatId
    })
}