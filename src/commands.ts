import * as vscode from 'vscode';
import * as path from 'path';
import { WebviewProvider } from './ui/WebviewProvider';
import { TemplateEngine } from './engine/TemplateEngine';
import { SchemaParser } from './parsers/SchemaParser';
import { ProjectInitializer } from './initializer/ProjectInitializer';

/**
 * Register all commands for the extension
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  webviewProvider: WebviewProvider,
  templateEngine: TemplateEngine,
  _schemaParser: SchemaParser // Renamed with underscore to indicate it's not used
) {
  // Register showWebview command
  context.subscriptions.push(
    vscode.commands.registerCommand('laravelForgemate.showWebview', () => {
      webviewProvider.openWebview(); // Changed to match the actual method name
    })
  );

  // Register generateScaffold command
  context.subscriptions.push(
    vscode.commands.registerCommand('laravelForgemate.generateScaffold', async () => {
      await webviewProvider.openWebview(); // Changed to use the correct method
    })
  );

  // Register initializeProject command
  context.subscriptions.push(
    vscode.commands.registerCommand('laravelForgemate.initializeProject', async () => {
      try {
        const initializer = new ProjectInitializer(context, templateEngine);
        await initializer.initialize();
        vscode.window.showInformationMessage('Laravel project initialized successfully!');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to initialize project: ${(error as Error).message}`);
      }
    })
  );

  // Register synchronizeStubs command
  context.subscriptions.push(
    vscode.commands.registerCommand('laravelForgemate.synchronizeStubs', async () => {
      try {
        const config = vscode.workspace.getConfiguration('laravelForgemate');
        const laravelProjectPath = config.get<string>('laravelProjectPath', '');
        
        // Get workspace folder if no project path is specified
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!laravelProjectPath && (!workspaceFolders || workspaceFolders.length === 0)) {
          throw new Error('No workspace folder or Laravel project path found');
        }
        
        const projectRoot = laravelProjectPath || workspaceFolders![0].uri.fsPath;
        
        // Initialize project and synchronize stubs
        const initializer = new ProjectInitializer(context, templateEngine);
        const copiedFiles = await initializer.synchronizeStubs(projectRoot);
        
        vscode.window.showInformationMessage(
          `Synchronized ${copiedFiles.length} stubs to ${projectRoot}/stubs/scaffold`,
          'Open Stubs Directory'
        ).then(selection => {
          if (selection === 'Open Stubs Directory') {
            const stubsPath = path.join(projectRoot, 'stubs/scaffold');
            vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(stubsPath));
          }
        });
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to synchronize stubs: ${(error as Error).message}`);
      }
    })
  );

  // Register refreshExplorer command
  context.subscriptions.push(
    vscode.commands.registerCommand('laravelForgemate.refreshExplorer', () => {
      const treeDataProvider = webviewProvider.getTreeDataProvider();
      if ('refresh' in treeDataProvider && typeof treeDataProvider.refresh === 'function') {
        treeDataProvider.refresh();
      }
    })
  );
}
