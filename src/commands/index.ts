import * as vscode from 'vscode';
import * as path from 'path';
import { WebviewProvider } from '../ui/WebviewProvider';
import { TemplateEngine } from '../engine/TemplateEngine';
import { SchemaParser } from '../parsers/SchemaParser';
import { ProjectInitializer } from '../initializer/ProjectInitializer';
import { ModelDefinition } from '../types/ModelDefinition';

/**
 * Register the synchronizeStubs command
 */
export function registerSynchronizeStubsCommand(
  context: vscode.ExtensionContext,
  templateEngine: TemplateEngine
) {
  context.subscriptions.push(
    vscode.commands.registerCommand('laravelForgemate.synchronizeStubs', async () => {
      try {
        // Get Laravel project path from configuration
        const config = vscode.workspace.getConfiguration('laravelForgemate');
        const laravelProjectPath = config.get<string>('laravelProjectPath', '');
        
        // If no custom path is provided, use workspace folder
        let targetPath = laravelProjectPath;
        if (!targetPath) {
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found. Please open a folder or set laravelProjectPath in settings.');
          }
          targetPath = workspaceFolders[0].uri.fsPath;
        }
        
        const projectInitializer = new ProjectInitializer(context, templateEngine);
        const copiedFiles = await projectInitializer.synchronizeStubs(targetPath); // Fix: Added targetPath parameter
        
        vscode.window.showInformationMessage(
          `Successfully synchronized ${copiedFiles.length} stub files.`,
          'Open Stubs Directory'
        ).then(selection => {
          if (selection === 'Open Stubs Directory') {
            const stubsPath = path.join(targetPath, 'stubs/scaffold');
            vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(stubsPath));
          }
        });
      } catch (error) {
        vscode.window.showErrorMessage(`Error synchronizing stubs: ${(error as Error).message}`);
      }
    })
  );
}

export function registerCommands(
  context: vscode.ExtensionContext,
  webviewProvider: WebviewProvider,
  templateEngine: TemplateEngine,
  _schemaParser: SchemaParser // Renamed with underscore to indicate it's not used
) {
  // Open webview for scaffold generation
  context.subscriptions.push(
    vscode.commands.registerCommand('laravelForgemate.showWebview', () => {
      webviewProvider.openWebview();
    })
  );
  
  // Generate scaffold from command palette
  context.subscriptions.push(
    vscode.commands.registerCommand('laravelForgemate.generateScaffold', async () => {
      try {
        // Get model name
        const modelName = await vscode.window.showInputBox({
          prompt: 'Enter model name (PascalCase)',
          placeHolder: 'e.g. ArticleNews',
          validateInput: (value) => {
            if (!value) return 'Model name is required';
            if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
              return 'Model name must be in PascalCase';
            }
            return null;
          }
        });
        
        if (!modelName) return;
        
        // Build model attributes
        const attributes = await collectModelAttributes();
        
        if (!attributes || attributes.length === 0) {
          return;
        }
        
        // Define options
        const generateMigration = await vscode.window.showQuickPick(['Yes', 'No'], {
          placeHolder: 'Generate migration?'
        }) === 'Yes';
        
        const generateFrontend = await vscode.window.showQuickPick(['Yes', 'No'], {
          placeHolder: 'Generate frontend files?'
        }) === 'Yes';
        
        const generateApi = await vscode.window.showQuickPick(['Yes', 'No'], {
          placeHolder: 'Generate API controller?'
        }) === 'Yes';
        
        // Create model definition
        const model: ModelDefinition = {
          name: modelName,
          attributes,
          options: {
            generateMigration,
            generateFrontend,
            generateApiController: generateApi,
            generateModel: true,
            generateController: true,
            generateService: true,
            generateRepository: true,
            generateRequests: true,
            generateResource: true,
            generateFactory: generateMigration,
            generateSeeder: generateMigration,
            generateRoutes: true
          }
        };
        
        // Generate scaffold using webview provider's methods
        const config = vscode.workspace.getConfiguration('laravelForgemate');
        const laravelProjectPath = config.get<string>('laravelProjectPath', '');
        
        const projectRoot = getProjectRoot(laravelProjectPath);
        const generatedFiles: string[] = [];
        
        vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: `Generating ${modelName} scaffold...`,
          cancellable: false
        }, async (progress) => {
          progress.report({ increment: 20, message: 'Generating backend files...' });
          await webviewProvider.generateBackendFiles(model, projectRoot, generatedFiles);
          
          progress.report({ increment: 40, message: 'Generating frontend files...' });
          await webviewProvider.generateFrontendFiles(model, projectRoot, generatedFiles);
          
          progress.report({ increment: 40, message: 'Scaffold complete!' });
          
          vscode.window.showInformationMessage(
            `Generated ${generatedFiles.length} files for ${modelName}`,
            'Open Files'
          ).then(selection => {
            if (selection === 'Open Files') {
              // Open main model file
              const modelFile = generatedFiles.find(file => file.endsWith(`/Models/${modelName}.php`));
              if (modelFile) {
                vscode.window.showTextDocument(vscode.Uri.file(modelFile));
              }
            }
          });
        });
      } catch (error) {
        vscode.window.showErrorMessage(`Error generating scaffold: ${(error as Error).message}`);
      }
    })
  );
  
  // Synchronize stubs
  registerSynchronizeStubsCommand(context, templateEngine);

  // Refresh explorer view
  context.subscriptions.push(
    vscode.commands.registerCommand('laravelForgemate.refreshExplorer', () => {
      const treeDataProvider = webviewProvider.getTreeDataProvider();
      // Check if refresh method exists before calling it
      if ('refresh' in treeDataProvider && typeof treeDataProvider.refresh === 'function') {
        treeDataProvider.refresh();
      }
    })
  );
}

/**
 * Helper to collect model attributes interactively
 */
async function collectModelAttributes(): Promise<{ name: string; type: string; nullable?: boolean }[]> {
  const attributes: { name: string; type: string; nullable?: boolean }[] = [];
  let continueAdding = true;
  
  while (continueAdding) {
    // Get attribute name
    const name = await vscode.window.showInputBox({
      prompt: 'Enter attribute name (or leave empty to finish)',
      placeHolder: 'e.g. title',
      validateInput: (value) => {
        if (value && !/^[a-z][a-zA-Z0-9_]*$/.test(value)) {
          return 'Attribute name must start with lowercase letter and contain only alphanumeric characters and underscores';
        }
        return null;
      }
    });
    
    if (!name) {
      continueAdding = false;
      continue;
    }
    
    // Get attribute type
    const type = await vscode.window.showQuickPick([
      'string',
      'text',
      'integer',
      'bigInteger',
      'boolean',
      'date',
      'datetime',
      'timestamp',
      'decimal',
      'float',
      'json',
      'uuid'
    ], {
      placeHolder: 'Select attribute type'
    });
    
    if (!type) continue;
    
    // Is nullable?
    const nullable = await vscode.window.showQuickPick(['Yes', 'No'], {
      placeHolder: 'Is this attribute nullable?'
    }) === 'Yes';
    
    attributes.push({ name, type, nullable });
    
    // Ask if user wants to add more attributes
    if (attributes.length > 0) {
      const addMore = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: 'Add another attribute?'
      });
      
      continueAdding = addMore === 'Yes';
    }
  }
  
  return attributes;
}

/**
 * Get project root from config or workspace
 */
function getProjectRoot(customPath: string): string {
  if (customPath) {
    return customPath;
  }
  
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    throw new Error('No workspace folder or Laravel project path found');
  }
  
  return workspaceFolders[0].uri.fsPath;
}
