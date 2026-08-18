
const messages = document.querySelector(".messages");
const inputText = document.querySelector(".text-input");
inputText.addEventListener("keypress", sendText);
let username = document.querySelector(".user-name");


//Text bar 
let prefix = ` ${username.value} > `;
inputText.value = prefix;
inputText.addEventListener('input', () => {
  if (!inputText.value.startsWith(prefix)) {
    inputText.value = prefix;
  }
});

function sendText(key){
    if (key.key == "Enter"){
        let newMessage = document.createElement('p');
        newMessage.textContent=`${inputText.value}`;
        newMessage.classList="message";
        messages.prepend(newMessage);
        inputText.value=prefix;
    }
}

//Username
username.addEventListener("blur", ()=>{
    prefix=` ${username.value} > `;
    inputText.value = prefix;
    console.log("heloo");
});