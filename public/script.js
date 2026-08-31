const messages = document.querySelector(".messages");


let username = document.querySelector(".user-name");
let currentChatroomId = null;
const socket = new WebSocket('ws://localhost:3001');

//Confirms connection with the server with a client side console.log and sends a message to the server
socket.addEventListener('open', () => {
  console.log('Conectado al servidor WebSocket');
  //sendServerUpdateCurrentStatus();
});
socket.addEventListener('close',()=>{
  //sendServerUpdateCurrentStatus();
})

////////////////////////////////////////////////////////////////////////////////////
///CHATROOM CREATION////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

//Create chatroom btn functionality
const addChatroomBtn = document.querySelector(".new-chat-bubble");
const addChatroomPopup = document.getElementById("chatroomPopup");
addChatroomBtn.addEventListener("click",()=>{
  addChatroomPopup.hidden = !addChatroomPopup.hidden;
})

//Chatroom creation
const createNewChatroomBtn = document.getElementById("createNewChatroomBtn");
createNewChatroomBtn.addEventListener("click", ()=>{
  //Send a petition to the server to create a chatroom
  socket.send(JSON.stringify({
    type: "chatroomCreationPetition"
  }))
})

const clientChatrooms = new Map();
const sidebar = document.querySelector("#sidebar");

    function createChatroom(id, userName){
        clientChatrooms.set(id,{
            chatroomName: "NEW CHAT",
            chatroomUsername: "John Doe",
            usernames: [userName],
            messages: [],
            currentMsg: ""
        });
        addButtonToSidebar(id);
    }

    function addButtonToSidebar(id){
        const newChatroomBtn = document.createElement("button");
        newChatroomBtn.id = id;
        newChatroomBtn.textContent = "O";
        newChatroomBtn.classList = "chat-bubble";
        newChatroomBtn.addEventListener("click",()=>{
          loadChatroom(id);
        })
        sidebar.prepend(newChatroomBtn);
    }

    const chatroomIdInput = document.querySelector("#chatroomcode");
    const joinChatroomBtn = document.querySelector("#joinChatroomBtn");
    function joinChatroom(){
      /* 
        send a join chatroom request message to the server with the USERNAME of the new user
        
        assign this function as an event listener to the send button*/
        socket.send(JSON.stringify({
          type:"chatroomJoinPetition",
          data: {
            chatroomId: chatroomIdInput.value,
            username: username.value
          }
        }))
        addChatroomPopup.hidden = true;
    }
    joinChatroomBtn.addEventListener("click",()=>{joinChatroom()});



////////////////////////////////////////////////////////////////////////////////////
/// INPUT TEXT /////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

const inputText = document.querySelector(".text-input");
inputText.addEventListener("keypress", sendTextToServer);

function sendTextToServer(key){
    if (key.key == "Enter"){
      //CLIENT SIDE///////
        let newMessage = document.createElement('p');
        newMessage.textContent=`${inputText.value}`;
        newMessage.classList="message";
        messages.prepend(newMessage);
        //push it to the local obj
        clientChatrooms.get(currentChatroomId).messages.push(inputText.value);
      ////////////////////

      //SERVERSIDE///////
        //JSON message with the neccessary properties to be identified on server
        let textMessageJSON = JSON.stringify({
          type: "textMessage",
          chatId:currentChatroomId,
          data: inputText.value
        })

        socket.send(textMessageJSON);
      ///////////////////
        inputText.value=prefix;
    }
}

//Text bar 
let prefix = ` ${username.value} > `;
inputText.value = prefix;
inputText.addEventListener('input', () => {
  if (!inputText.value.startsWith(prefix)) {
    inputText.value = prefix;
  }
});

////////////////////////////////////////////////////////////////////////////////////
///CLIENT MESSAGE HANDLER//////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

//When the client recieves a message from the server, does some logic in the CLIENT SIDE
socket.onmessage = (message)=>{
  const parsedMessage = JSON.parse(message.data);
  switch(parsedMessage.type){

    case "textMessage":
      //add it to the local chatroom item
      clientChatrooms.get(parsedMessage.chatId).messages.push(parsedMessage.data);
      //update only that part if the change is in the current displayed chat
      if(parsedMessage.chatId==currentChatroomId){
        loadMessages(currentChatroomId);
      }
      break;
    
      case "chatroomCode":
      //popup chatroomcode is
      createChatroom(parsedMessage.data,username.value);
      addChatroomPopup.hidden = true;
      loadChatroom(parsedMessage.data);
      break;
    
      //Username Update Handler
      case "username":
      //delete the previous username
      //search the previous name on the local item and replace it, if the username is new add it
      let usernameFound = false;
      for(let i = 0; i<clientChatrooms.get(parsedMessage.chatId).usernames.length; i++){
          if(clientChatrooms.get(parsedMessage.chatId).usernames[i] === parsedMessage.data.previousUsername){
              clientChatrooms.get(parsedMessage.chatId).usernames[i] = parsedMessage.data.username;
              usernameFound=true;
          }
      }
      if (!usernameFound) clientChatrooms.get(parsedMessage.chatId).usernames.push(parsedMessage.data.username);
      //update only that part if the change is in the current displayed chat
      if(parsedMessage.chatId==currentChatroomId){
        loadChatroom(currentChatroomId);
      }
  }
}

////////////////////////////////////////////////////////////////////////////////////
///USERNAME/////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

//Username
username.addEventListener("blur", ()=>{
    prefix=` ${username.value} > `;
    inputText.value = prefix;
    let previousUsername = clientChatrooms.get(currentChatroomId).chatroomUsername;
    clientChatrooms.get(currentChatroomId).chatroomUsername = username.value;
    sendChangedUsernameToServer(previousUsername);
});

function sendChangedUsernameToServer(previousUsername){
  socket.send(JSON.stringify({
    type:"username",
    data:{
      username: username.value,
      previousUsername: previousUsername
    },
    chatId:currentChatroomId,
  }))
}

////////////////////////////////////////////////////////////////////////////////////
///RENDER///////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

    const chatroomIdText_Client = document.querySelector(".chatroom-id");
    const chatName_Client = document.querySelector(".chat-name");
    const messages_Client = document.querySelector(".messages");
    const currentMessage_Client = document.querySelector(".text-input");
    const users_Client = document.querySelector("#connectedUsers");

    //Currently loadChatroom is the Re render function, it rerenders all the elements of the chat like messages, users...
      //its better to divide the isolated functionalities so, in the future, when only the users need to be updated, you dont need to reload the hole page
    function loadChatroom(id){
      currentChatroomId = id;
      const chatroomToLoad = clientChatrooms.get(id);
      username.value = chatroomToLoad.chatroomUsername;
      loadUsers(id);
      loadMessages(id); 
      chatName_Client.textContent = chatroomToLoad.chatroomName;
      chatroomIdText_Client.textContent = "CHATROOM ID: "+id;
      currentMessage_Client.value = chatroomToLoad.currentMsg == "" ? (" "+username.value + " > ") : chatroomToLoad.currentMsg;
    }
    function loadMessages(id){
        messages_Client.textContent = "";
        clientChatrooms.get(id).messages.forEach(message => {
          let textMessage = document.createElement('p');
          textMessage.textContent=`${message}`;
          textMessage.classList="message";
          messages.prepend(textMessage);
        });
    }
    function loadUsers(id){
      users_Client.textContent = "";
        clientChatrooms.get(id).usernames.forEach(user=>{
          let textUser = document.createElement('p');
          textUser.textContent=user;
          users_Client.appendChild(textUser);
        });
    }
    


   