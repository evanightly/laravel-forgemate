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
    
    // Check if this is the first activation
    const hasInitialized = context.globalState.get('laravelForgemate.hasInitialized');
    if (!hasInitialized) {
      // Attempt to initialize the project automatically if it appears to be a Laravel project
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Window,
        title: 'Checking Laravel project structure...'
      }, async () => {
        try {
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (workspaceFolders && workspaceFolders.length > 0) {
            const projectRoot = workspaceFolders[0].uri.fsPath;
            
            // Check if this is a Laravel project by looking for artisan
            const artisanPath = path.join(projectRoot, 'artisan');
            if (fs.existsSync(artisanPath)) {
              // Initialize project in background
              const initializer = new ProjectInitializer(context, templateEngine);
              await initializer.initialize();
              
              // Show success message
              vscode.window.showInformationMessage('Laravel project initialized successfully!');
            }
          }
        } catch (error) {
          console.error('Error during auto-initialization:', error);
          // Don't show error to user during auto-init since it's not explicitly requested
        }
        
        // Mark as initialized regardless of outcome
        context.globalState.update('laravelForgemate.hasInitialized', true);
      });
    }

    // Register commands
    registerCommands(context, webviewProvider, templateEngine, schemaParser);

    // Register views
    const treeDataProvider = webviewProvider.getTreeDataProvider();
    vscode.window.registerTreeDataProvider('laravelForgemateExplorer', treeDataProvider);

    // Show welcome message on first activation
    const hasShownWelcome = context.globalState.get('laravelForgemate.hasShownWelcome');
    if (!hasShownWelcome) {
      vscode.window.showInformationMessage(
        'Laravel Forgemate is ready! Run "Laravel Forgemate: Initialize Project" to ensure all base files are created.',
        'Initialize Project',
        'Documentation'
      ).then(selection => {
        if (selection === 'Initialize Project') {
          vscode.commands.executeCommand('laravelForgemate.initializeProject');
        } else if (selection === 'Documentation') {
          vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-username/laravel-forgemate'));
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
