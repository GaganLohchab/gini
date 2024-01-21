import * as vscode from "vscode";
import getGeminiApiKey from "./utils/getConfig";
import Commands from "./utils/commands";
import Gemini from "./services/gemini";
import {
  copyToClipboard,
  getActiveDocumentText,
  replaceWithClipboard,
} from "./utils/helpers";
import { LANGUAGES } from "./utils/constants";

let gemini: Gemini | null = null;

export function activate(context: vscode.ExtensionContext) {
  let run = vscode.commands.registerCommand(Commands.Run, async () => {
    generateShowResult(Commands.Run);
  });

  let optimize = vscode.commands.registerCommand(
    Commands.Optimize,
    async () => {
      generateShowResult(Commands.Optimize);
    }
  );

  let transpile = vscode.commands.registerCommand(
    Commands.Transpile,
    async () => {
      generateShowResult(Commands.Transpile);
    }
  );

  let annotate = vscode.commands.registerCommand(
    Commands.Annotate,
    async () => {
      generateShowResult(Commands.Annotate);
    }
  );

  let deconstruct = vscode.commands.registerCommand(
    Commands.Deconstruct,
    async () => {
      generateShowResult(Commands.Deconstruct);
    }
  );

  let copy = vscode.commands.registerCommand(Commands.Copy, async () => {
    copyToClipboard();
  });

  let replace = vscode.commands.registerCommand(Commands.Replace, async () => {
    replaceWithClipboard();
  });

  context.subscriptions.push(
    run,
    optimize,
    transpile,
    annotate,
    deconstruct,
    copy,
    replace
  );
}

export async function generateShowResult(command: Commands) {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showErrorMessage("Gini: No active code editor found.");
    return;
  }

  gemini = gemini || new Gemini(await getGeminiApiKey());
  const languageId = editor.document.languageId;

  let result = "";
  vscode.window.showInformationMessage("Gini: Generating results...");
  switch (command) {
    case Commands.Run:
      result = await gemini.runAssistant(getActiveDocumentText());
      break;
    case Commands.Optimize:
      result = await gemini.optimizeCode(getActiveDocumentText());
      break;
    case Commands.Transpile:
      const language = await vscode.window.showQuickPick(LANGUAGES);

      if (!language) {
        vscode.window.showErrorMessage("Gini: No target language selected.");
        return;
      }

      result = await gemini.transpileCode(getActiveDocumentText(), language);
      break;
    case Commands.Annotate:
      result = await gemini.annotateCode(getActiveDocumentText());
      break;
    case Commands.Deconstruct:
      result = await gemini.explainCode(getActiveDocumentText());
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }

  if (command !== Commands.Run && command !== Commands.Deconstruct) {
    result = result.replace(/^```[\w]+|```$/g, '').trim().replace(/^\n+|\n+$/g, '');

    vscode.workspace
      .openTextDocument({
        content: result,
        language: languageId || "plaintext",
      })
      .then((doc) => {
        vscode.window.showTextDocument(doc, {
          viewColumn: vscode.ViewColumn.Beside,
          preserveFocus: true,
        });
      });
  } else {
    showResultInWebView(result, command);
  }
}

export function showResultInWebView(result: String, command: Commands) {
  const panel = vscode.window.createWebviewPanel(
    "resultWebview",
    "Gini Assistant",
    vscode.ViewColumn.Beside,
    {}
  );

  if (command === Commands.Deconstruct) {
    result = result.replace(/^```[\w]+|```$/g, '').trim().replace(/^\n+|\n+$/g, '');
  } else {
    
  }

  panel.webview.html = `<html><body>${result}</body></html>`;
}

export function deactivate() {}
