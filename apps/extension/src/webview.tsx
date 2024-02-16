import * as React from "react";
import * as ReactDOM from "react-dom";
import typingSource from "./assets/typing.gif";

const {
  VSCodeButton,
  VSCodeTextArea,
} = require("@vscode/webview-ui-toolkit/react");

declare var acquireVsCodeApi: any;

const vscode = acquireVsCodeApi();

const sendMessageToExtension = (message: string) => {
  vscode.postMessage(
    {
      type: "from-user",
      content: message,
    },
    "*"
  );
};

type From = "user" | "bot";

class ChatMessage {
  constructor(readonly from: From, readonly contents: string) {}
}

type ChatBubbleProperties = { message: ChatMessage };
const ChatBubble: React.FC<ChatBubbleProperties> = ({ message }) => {
  const bubbleStyle: React.CSSProperties = {
    display: "inline-block",
    maxWidth: "70%",
    borderRadius:
      message.from === "bot" ? "1rem 1rem 1rem 0" : "1rem 1rem 0 1rem",
    padding: "0.5rem 1rem",
    marginBottom: "1rem",
    color: "var(--vscode-foreground)",
    // fontWeight: "bold",
    wordWrap: "break-word",
    position: "relative",
  };
  const alignStyle =
    message.from === "bot"
      ? { backgroundColor: "var(--vscode-button-secondaryBackground)" }
      : { backgroundColor: "var(--vscode-button-background)" };
  const containerStyle = {
    display: "flex",
    justifyContent: message.from === "bot" ? "flex-start" : "flex-end",
  };
  return (
    <div style={containerStyle}>
      <div style={{ ...bubbleStyle, ...alignStyle }}>
        <div style={{ whiteSpace: "pre-wrap" }}>{message.contents}</div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [userMessage, setUserMessage] = React.useState("");
  const [chatMessages, setChatMessages] = React.useState<Array<ChatMessage>>(
    []
  );
  const [loading, setLoading] = React.useState(false);
  const appendChatMessage = (message: ChatMessage) =>
    setChatMessages((previousChatMessages) => [
      ...previousChatMessages,
      message,
    ]);

  React.useEffect(() => {
    const sendInitialMessage = () => {
      setTimeout(() => {
        sendMessageToExtension(
          "Hello, what's your name and how can you help me?"
        );
      }, 500);
    };
    const listener = (event: MessageEvent) => {
      if (event.data.type === "from-bot") {
        const message = new ChatMessage("bot", event.data.content);
        appendChatMessage(message);
      }
      if (event.data.type === "loading") {
        setTimeout(() => {
          setLoading(event.data.content);
        }, 1000);
      }
    };

    window.addEventListener("message", listener);
    window.addEventListener("load", sendInitialMessage);
    return () => window.removeEventListener("message", listener);
  }, []);

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendUserMessage();
    }
  };

  const sendUserMessage = () => {
    const message = new ChatMessage("user", userMessage);
    appendChatMessage(message);
    sendMessageToExtension(userMessage);
    setUserMessage("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {chatMessages.map((message) => (
          <ChatBubble key={message.contents} message={message} />
        ))}
        <img
          style={{
            display: loading ? undefined : "none",
            height: "1rem",
            width: "auto",
            maxWidth: "100%",
            objectFit: "contain",
            alignSelf: "start",
          }}
          src={typingSource}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <VSCodeTextArea
          style={{ flex: 1 }}
          onInput={(event: any) => setUserMessage(event.target.value)}
          onKeyDown={handleKeyPress}
          autofocus
          value={userMessage}
        ></VSCodeTextArea>
        <VSCodeButton
          style={{ marginLeft: "1rem", width: "40px", height: "40px" }}
          onClick={sendUserMessage}
          appearance="icon"
        >
          <span className="codicon codicon-debug-start"></span>
        </VSCodeButton>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.querySelector("#root"));
