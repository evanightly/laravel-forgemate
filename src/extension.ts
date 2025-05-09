import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { registerCommands } from './commands';
import { SchemaParser } from './parsers/SchemaParser';
import { TemplateEngine } from './engine/TemplateEngine';
import { WebviewProvider } from './ui/WebviewProvider';
import { ProjectInitializer } from './initializer/ProjectInitializer';

export function activate(context: vscode.ExtensionContext) {
  console.log('Laravel Forgemate is now active!');
  
  try {
    // Initialize core services
    const schemaParser = new SchemaParser();
    const templateEngine = new TemplateEngine(context);

    // Initialize UI Provider
    const webviewProvider = new WebviewProvider(context, templateEngine, schemaParser);
    
    // Register commands
    registerCommands(context, webviewProvider, templateEngine, schemaParser);

    // Register views
    const treeDataProvider = webviewProvider.getTreeDataProvider();
    vscode.window.registerTreeDataProvider('laravelForgemateExplorer', treeDataProvider);

    // Show welcome message on first activation
    const hasShownWelcome = context.globalState.get('laravelForgemate.hasShownWelcome');
    if (!hasShownWelcome) {
      vscode.window.showInformationMessage(
        'Laravel Forgemate is ready! Use the command palette or explorer view to access features.',
        'Initialize Project',
        'Documentation'
      ).then(selection => {
        if (selection === 'Initialize Project') {
          vscode.commands.executeCommand('laravelForgemate.initializeProject');
        } else if (selection === 'Documentation') {
          vscode.env.openExternal(vscode.Uri.parse('https://github.com/evanightly/laravel-forgemate'));
        }
      });
      
      context.globalState.update('laravelForgemate.hasShownWelcome', true);
    }

    // Show activity bar view
    vscode.commands.executeCommand('setContext', 'laravelForgemate.loaded', true);
    
  } catch (error) {
    console.error('Error activating Laravel Forgemate:', error);
    vscode.window.showErrorMessage(`Failed to activate Laravel Forgemate: ${(error as Error).message}`);
  }
}

export function deactivate() {
  console.log('Laravel Forgemate is now deactivated!');
}
