
const messages = document.querySelector(".messages");
const inputText = document.querySelector(".text-input");
inputText.addEventListener("keypress", sendTextToServer);
let username = document.querySelector(".user-name");

const socket = new WebSocket('ws://localhost:3001');

//Client
socket.addEventListener('open', () => {
  console.log('Conectado al servidor WebSocket');
  socket.send('¡Hola servidor! Soy el cliente.');
});

//Text bar 
let prefix = ` ${username.value} > `;
inputText.value = prefix;
inputText.addEventListener('input', () => {
  if (!inputText.value.startsWith(prefix)) {
    inputText.value = prefix;
  }
});

function sendTextToServer(key){
    if (key.key == "Enter"){
        let newMessage = document.createElement('p');
        newMessage.textContent=`${inputText.value}`;
        newMessage.classList="message";
        messages.prepend(newMessage);

        socket.send(inputText.value);

        inputText.value=prefix;

    }
}

socket.onmessage = (event)=>{
    const recievedData = event.data;
    console.log(recievedData);
}

//Username
username.addEventListener("blur", ()=>{
    prefix=` ${username.value} > `;
    inputText.value = prefix;
    console.log("heloo");
});

