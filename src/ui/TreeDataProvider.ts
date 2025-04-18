import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getProjectRootOrNull } from '../utils/PathUtils';

export class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private models: TreeItem[] = [];
  
  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loadModels();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeItem): Thenable<TreeItem[]> {
    if (element) {
      return Promise.resolve(element.children || []);
    } else {
      // Root items
      return Promise.resolve([
        new TreeItem('Models', vscode.TreeItemCollapsibleState.Expanded, 'models', this.models),
        new TreeItem('Generate Scaffold', vscode.TreeItemCollapsibleState.None, 'generate', [], {
          command: 'laravelForgemate.showWebview',
          title: 'Generate Scaffold',
          arguments: []
        }),
        new TreeItem('Initialize Project', vscode.TreeItemCollapsibleState.None, 'init', [], {
          command: 'laravelForgemate.initializeProject',
          title: 'Initialize Project',
          arguments: []
        }),
        new TreeItem('Synchronize Stubs', vscode.TreeItemCollapsibleState.None, 'sync', [], {
          command: 'laravelForgemate.synchronizeStubs',
          title: 'Synchronize Stubs',
          arguments: []
        })
      ]);
    }
  }

  private loadModels(): void {
    try {
      const config = vscode.workspace.getConfiguration('laravelForgemate');
      const laravelProjectPath = config.get<string>('laravelProjectPath', '');
      const projectRoot = getProjectRootOrNull(laravelProjectPath);
      
      if (!projectRoot) {
        return;
      }

      const modelsDir = path.join(projectRoot, 'app/Models');
      
      if (fs.existsSync(modelsDir)) {
        const files = fs.readdirSync(modelsDir);
        
        this.models = files
          .filter(file => file.endsWith('.php'))
          .map(file => {
            const modelName = file.replace('.php', '');
            return new TreeItem(
              modelName, 
              vscode.TreeItemCollapsibleState.None, 
              'model', 
              [], 
              {
                command: 'vscode.open',
                title: 'Open Model',
                arguments: [vscode.Uri.file(path.join(modelsDir, file))]
              }
            );
          });
      }
    } catch (error) {
      console.error('Error loading models:', error);
      this.models = [];
    }
  }
}

export class TreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public readonly children?: TreeItem[],
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    // Set icon based on context
    switch (contextValue) {
      case 'models':
        this.iconPath = new vscode.ThemeIcon('database');
        break;
      case 'model':
        this.iconPath = new vscode.ThemeIcon('symbol-class');
        break;
      case 'generate':
        this.iconPath = new vscode.ThemeIcon('add');
        break;
      case 'init':
        this.iconPath = new vscode.ThemeIcon('rocket');
        break;
      case 'sync':
        this.iconPath = new vscode.ThemeIcon('refresh');
        break;
      case 'controller':
        this.iconPath = new vscode.ThemeIcon('symbol-method');
        break;
      case 'repository':
        this.iconPath = new vscode.ThemeIcon('repo');
        break;
      case 'service':
        this.iconPath = new vscode.ThemeIcon('server');
        break;
      case 'resource':
        this.iconPath = new vscode.ThemeIcon('output');
        break;
      case 'migration':
        this.iconPath = new vscode.ThemeIcon('file-binary');
        break;
      case 'requestForm':
        this.iconPath = new vscode.ThemeIcon('file-code');
        break;
    }
  }
}
