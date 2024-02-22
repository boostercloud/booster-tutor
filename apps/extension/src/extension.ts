import * as vscode from "vscode";
// import * as process from "node:process";
import * as cp from "node:child_process";
import "./fetch-polyfill";

// const apiKeyName = "MSC_OPENAI_API_KEY";

// async function getApiKey(
//   context: vscode.ExtensionContext
// ): Promise<string | undefined> {
//   const apiKey = context.globalState.get<string>(apiKeyName);

//   if (apiKey) {
//     return apiKey;
//   }

//   const inputApiKey = await vscode.window.showInputBox({
//     prompt: "Enter your OpenAI API key",
//     placeHolder: "OpenAI API key",
//     ignoreFocusOut: true,
//     password: true,
//   });

//   if (inputApiKey) {
//     await context.globalState.update(apiKeyName, inputApiKey);
//   }

//   return inputApiKey;
// }

export async function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "chat-sidebar" is now active!');

  // const apiKey = await getApiKey(context);
  // if (!apiKey) {
  //   vscode.window.showErrorMessage("API key is required");
  //   return;
  // }

  const outputChannel = vscode.window.createOutputChannel("Booster Tutor");
  context.subscriptions.push(outputChannel);

  const myCustomConsole = {
    log: (message: string) => outputChannel.appendLine(message),
    error: (message: string) => outputChannel.appendLine(message),
  };

  global.console = { ...console, ...myCustomConsole };

  // process.env["OPENAI_API_KEY"] = apiKey;

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

  // eslint-disable-next-line no-unused-vars
  const disposable = vscode.window.onDidChangeActiveTextEditor((_editor) => {});

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

  // eslint-disable-next-line no-unused-vars
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
            response = await fetch("http://localhost:8232/answer", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                question: message.content,
              }),
            }).then((response) => response.text());
            sendMessage(response);
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
