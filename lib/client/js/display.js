var consoleW = document.querySelector("#console");

cmd.data = function(data) {
    var newMessage = document.createElement("div");
    newMessage.className = "msg";
    newMessage.textContent = data.content;
    consoleW.appendChild(newMessage);
    consoleW.scrollTop = consoleW.offsetHeight;
}

var dataInput = document.querySelector("#data");
var sendInput = document.querySelector("#send-button");

dataInput.addEventListener("keydown", function(e) {
    if (e.keyCode == 13) {
        sendMessage(e);
    }
})
sendInput.addEventListener("click", sendMessage);

function sendMessage(e) {
    if (dataInput.value) {
        sockSend("data", { content: dataInput.value });
        cmd.data({ content: "> " + dataInput.value });
        dataInput.value = "";
    }
}