import * as vscode from "vscode";
import * as process from "node:process";
import monkeyAgent from "./agent/monkey-agent";
import * as cp from "node:child_process";
import "./fetch-polyfill";
import communicator from "./agent/communicator";

const apiKeyName = "MSC_OPENAI_API_KEY";

let currentFilePath: string | undefined;

async function getApiKey(
  context: vscode.ExtensionContext
): Promise<string | undefined> {
  const apiKey = context.globalState.get<string>(apiKeyName);

  if (apiKey) {
    return apiKey;
  }

  const inputApiKey = await vscode.window.showInputBox({
    prompt: "Enter your OpenAI API key",
    placeHolder: "OpenAI API key",
    ignoreFocusOut: true,
    password: true,
  });

  if (inputApiKey) {
    await context.globalState.update(apiKeyName, inputApiKey);
  }

  return inputApiKey;
}

export async function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "chat-sidebar" is now active!');

  const apiKey = await getApiKey(context);
  if (!apiKey) {
    vscode.window.showErrorMessage("API key is required");
    return;
  }

  const outputChannel = vscode.window.createOutputChannel("Monkey Studio Code");
  context.subscriptions.push(outputChannel);

  const myCustomConsole = {
    log: (message: string) => outputChannel.appendLine(message),
    error: (message: string) => outputChannel.appendLine(message),
  };

  global.console = { ...console, ...myCustomConsole };

  process.env["OPENAI_API_KEY"] = apiKey;

  cp.exec("node --version", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing 'node --version': ${error.message}`);
      return;
    }

    if (stderr) {
      console.error(`Error message: ${stderr}`);
      return;
    }

    console.log(`Node.js version: ${stdout.trim()}`);
  });

  const document = vscode.window.activeTextEditor?.document;
  if (document && document.uri.scheme === "file") {
    currentFilePath = document.uri.fsPath;
  }

  const disposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
    const document = editor?.document;
    if (document && document.uri.scheme === "file") {
      currentFilePath = document.uri.fsPath;
    }
  });

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "chatSidebar",
      new ChatSidebarViewProvider(context.extensionUri)
    ),
    disposable
  );
}

class ChatSidebarViewProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  async resolveWebviewView(webviewView: vscode.WebviewView) {
    const sendMessage = (message: string) => {
      webviewView.webview.postMessage({
        type: "from-bot",
        content: message,
      });
    };

    const setLoading = (content: boolean) => {
      webviewView.webview.postMessage({
        type: "loading",
        content,
      });
    };
    const communicatorAgent = await communicator(sendMessage);
    const agent = await monkeyAgent(communicatorAgent);
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "from-user": {
          let response: string;
          try {
            setLoading(true);
            response = await agent.call(currentFilePath, message.content);
            await communicatorAgent.call(response);
          } catch (error) {
            const parsedError = error as Error;
            response = `
            Error: ${parsedError.message}

            Stack trace:

            ${parsedError.stack}
            `;
            sendMessage(response);
          }
          setLoading(false);
          break;
        }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const vscodeStylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );

    const nonce = getNonce();
    const indexHtml = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${webview.cspSource}; img-src ${webview.cspSource} https:; font-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${vscodeStylesUri}">
  <link rel="stylesheet" href="%CODICON_CSS%">
  <title>React WebView</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="%INDEX_JS%"></script>
</body>
</html>
    `;
    const bundleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", "webview.js")
    );
    const codiconCssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "node_modules",
        "@vscode",
        "codicons",
        "dist",
        "codicon.css"
      )
    );
    return indexHtml
      .replace("%INDEX_JS%", bundleUri.toString())
      .replace("%CODICON_CSS%", codiconCssUri.toString());
  }
}

export function deactivate() {}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let index = 0; index < 32; index++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
