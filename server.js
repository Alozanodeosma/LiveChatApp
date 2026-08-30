const http = require('http');
const fs = require('fs/promises');
const {join, extname} = require('path');
const WebSocket = require('ws');

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

webSocketServer.on("connection",(socket)=>{
    //when the socket is Open, log a confirmation message on CLIENT side
    socket.on("open",()=>{
        console.log("a connection has been open");
    });
    //Server have an event that when recieved a message from the client, send it back to all the clients except himself
        //in future revisions and iterations, this cannot happen with ALL messages
    socket.addEventListener("message",(message)=>{
        console.log('Mensaje recibido del cliente:', message.data);
        webSocketServer.clients.forEach((client)=>{
            if(client!=socket){
                client.send(message.data);
            }
        })
    })
})




server.listen(3001, () => {
  console.log('Servidor escuchando en http://localhost:3001');
});

