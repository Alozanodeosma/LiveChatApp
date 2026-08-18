const messages = document.querySelector(".messages");
const inputText = document.querySelector(".text-input");
inputText.addEventListener("keypress", sendText);
let username = document.querySelector(".user-name").textContent;

function sendText(key){
    if (key.key == "Enter"){
        let newMessage = document.createElement('p');
        newMessage.textContent=`${username} > ${inputText.value}`;
        newMessage.classList="message";
        messages.appendChild(newMessage);
        inputText.value="";
    }
}