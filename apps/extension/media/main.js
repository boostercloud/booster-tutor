window.addEventListener("DOMContentLoaded", () => {
  const vscode = acquireVsCodeApi();

  const messageForm = document.querySelector("#message-form");
  const messageInput = document.querySelector("#message-input");
  const messages = document.querySelector("#messages");
  messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const messageText = messageInput.value.trim();
    if (messageText) {
      vscode.postMessage({ type: "chatMessage", content: messageText });
      messageInput.value = "";
    }
  });

  // eslint-disable-next-line unicorn/prefer-add-event-listener
  window.onmessage = (event) => {
    const message = event.data;
    switch (message.type) {
      case "displayMessage": {
        const messageElement = document.createElement("li");
        messageElement.textContent = message.content;
        messages.append(messageElement);
        messages.scrollTop = messages.scrollHeight;
        break;
      }
    }
  };
});
