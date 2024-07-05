const io = require("socket.io-client");

const socket = io.connect("http://localhost:3001");

const text = document.getElementsByClassName("message");
const submit = document.getElementsByClassName("submit");
const display = document.getElementsByClassName("message-display");

const sendMessage = () => {
  console.log("triggered");
  socket.emit("send_message", { message: text.value });
};

socket.on("receive_message", (data) => {
  let li = document.createElement("li");
  li.textContent = `${data}`;
  li.style.fontSize = "2rem";
  display.appendChild(li);
});

submit.addEventListener("click", sendMessage);
