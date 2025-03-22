import * as vscode from 'vscode';
import { TemplateEngine } from '../engine/TemplateEngine';
import { SchemaParser } from '../parsers/SchemaParser';
import { ModelDefinition } from '../types/ModelDefinition';
import { TreeDataProvider } from './TreeDataProvider';
import path from 'path';
import fs from 'fs';

export class WebviewProvider {
  private panel: vscode.WebviewPanel | undefined;
  private treeDataProvider: TreeDataProvider;

  constructor(
    private context: vscode.ExtensionContext,
    private templateEngine: TemplateEngine,
    private schemaParser: SchemaParser
  ) {
    this.treeDataProvider = new TreeDataProvider();
  }

  public getTreeDataProvider(): vscode.TreeDataProvider<any> {
    return this.treeDataProvider;
  }

  /**
   * Open or focus the webview panel
   */
  public async openWebview(): Promise<void> {
    // If panel already exists, show it
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    // Create and show the panel
    this.panel = vscode.window.createWebviewPanel(
      'laravelForgemate',
      'Laravel Forgemate',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, 'resources')
        ]
      }
    );

    // Set webview content
    this.panel.webview.html = this.getWebviewContent(this.panel.webview);

    // Handle messages from the webview
    this.setupMessageHandling(this.panel);

    // Reset when the panel is closed
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  /**
   * Generate all scaffold files for a model
   */
  private async generateScaffold(model: ModelDefinition): Promise<string[]> {
    const generatedFiles: string[] = [];
    const config = vscode.workspace.getConfiguration('laravelForgemate');
    const laravelProjectPath = config.get<string>('laravelProjectPath', '');
    
    const projectRoot = this.getProjectRoot(laravelProjectPath);
    
    // Generate files based on model definition
    await this.generateBackendFiles(model, projectRoot, generatedFiles);
    await this.generateFrontendFiles(model, projectRoot, generatedFiles);
    
    return generatedFiles;
  }

  /**
   * Public method to generate backend files
   */
  public async generateBackendFiles(model: ModelDefinition, projectRoot: string, generatedFiles: string[]): Promise<void> {
    return this.generateBackendFilesInternal(model, projectRoot, generatedFiles);
  }

  /**
   * Public method to generate frontend files
   */
  public async generateFrontendFiles(model: ModelDefinition, projectRoot: string, generatedFiles: string[]): Promise<void> {
    return this.generateFrontendFilesInternal(model, projectRoot, generatedFiles);
  }

  /**
   * Generate backend files (PHP)
   */
  private async generateBackendFilesInternal(model: ModelDefinition, projectRoot: string, generatedFiles: string[]): Promise<void> {
    try {
      // Generate model
      if (model.options?.generateModel !== false) {
        const modelPath = path.join(projectRoot, `app/Models/${model.name}.php`);
        await this.templateEngine.generateFile('backend/model', model, modelPath);
        generatedFiles.push(modelPath);
      }

      // Generate migration with proper timestamp format
      if (model.options?.generateMigration !== false) {
        // Generate a proper timestamp in the format YYYY_MM_DD_HHMMSS
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const timestamp = `${year}_${month}_${day}_${hours}${minutes}${seconds}`;
        
        const tableName = this.getTableNameFromModel(model.name);
        const migrationPath = path.join(
          projectRoot,
          `database/migrations/${timestamp}_create_${tableName}_table.php`
        );
        await this.templateEngine.generateFile('backend/migration', model, migrationPath);
        generatedFiles.push(migrationPath);
      }

      // Generate repository interface
      if (model.options?.generateRepository !== false) {
        const repoInterfacePath = path.join(
          projectRoot,
          `app/Support/Interfaces/Repositories/${model.name}RepositoryInterface.php`
        );
        await this.templateEngine.generateFile('backend/repository.interface', model, repoInterfacePath);
        generatedFiles.push(repoInterfacePath);
      }

      // Generate repository
      if (model.options?.generateRepository !== false) {
        const repoPath = path.join(projectRoot, `app/Repositories/${model.name}Repository.php`);
        await this.templateEngine.generateFile('backend/repository', model, repoPath);
        generatedFiles.push(repoPath);
        
        // Register repository in the service provider
        this.registerRepositoryInServiceProvider(projectRoot, model.name);
      }

      // Generate service interface
      if (model.options?.generateService !== false) {
        const serviceInterfacePath = path.join(
          projectRoot,
          `app/Support/Interfaces/Services/${model.name}ServiceInterface.php`
        );
        await this.templateEngine.generateFile('backend/service.interface', model, serviceInterfacePath);
        generatedFiles.push(serviceInterfacePath);
      }

      // Generate service
      if (model.options?.generateService !== false) {
        const servicePath = path.join(projectRoot, `app/Services/${model.name}Service.php`);
        await this.templateEngine.generateFile('backend/service', model, servicePath);
        generatedFiles.push(servicePath);
      }

      // Generate controller
      if (model.options?.generateController !== false) {
        const controllerPath = path.join(projectRoot, `app/Http/Controllers/${model.name}Controller.php`);
        await this.templateEngine.generateFile('backend/controller', model, controllerPath);
        generatedFiles.push(controllerPath);
      }

      // Generate API controller
      if (model.options?.generateApiController !== false) {
        const apiControllerDir = path.join(projectRoot, `app/Http/Controllers/Api`);
        if (!fs.existsSync(apiControllerDir)) {
          fs.mkdirSync(apiControllerDir, { recursive: true });
        }
        
        const apiControllerPath = path.join(apiControllerDir, `${model.name}Controller.php`);
        await this.templateEngine.generateFile('backend/controller.api', model, apiControllerPath);
        generatedFiles.push(apiControllerPath);
      }

      // Store request
      if (model.options?.generateRequests !== false) {
        const requestDir = path.join(projectRoot, `app/Http/Requests/${model.name}`);
        if (!fs.existsSync(requestDir)) {
          fs.mkdirSync(requestDir, { recursive: true });
        }
        
        const storeRequestPath = path.join(requestDir, `Store${model.name}Request.php`);
        await this.templateEngine.generateFile('backend/store.request', model, storeRequestPath);
        generatedFiles.push(storeRequestPath);
        
        const updateRequestPath = path.join(requestDir, `Update${model.name}Request.php`);
        await this.templateEngine.generateFile('backend/update.request', model, updateRequestPath);
        generatedFiles.push(updateRequestPath);
      }

      // Generate resource
      if (model.options?.generateResource !== false) {
        const resourcePath = path.join(projectRoot, `app/Http/Resources/${model.name}Resource.php`);
        await this.templateEngine.generateFile('backend/resource', model, resourcePath);
        generatedFiles.push(resourcePath);
      }

      // Generate factory
      if (model.options?.generateFactory !== false) {
        const factoryPath = path.join(projectRoot, `database/factories/${model.name}Factory.php`);
        await this.templateEngine.generateFile('backend/factory', model, factoryPath);
        generatedFiles.push(factoryPath);
      }

      // Generate seeder
      if (model.options?.generateSeeder !== false) {
        const seederPath = path.join(projectRoot, `database/seeders/${model.name}Seeder.php`);
        await this.templateEngine.generateFile('backend/seeder', model, seederPath);
        generatedFiles.push(seederPath);
      }

      // Update permission enum if needed
      await this.updatePermissionEnum(projectRoot, model);

      // Generate routes if needed
      if (model.options?.generateRoutes !== false) {
        await this.addRoutes(projectRoot, model);
      }
    } catch (error) {
      console.error('Error generating backend files:', error);
      throw error;
    }
  }

  /**
   * Generate frontend files (TypeScript)
   */
  private async generateFrontendFilesInternal(model: ModelDefinition, projectRoot: string, generatedFiles: string[]): Promise<void> {
    if (model.options?.generateFrontend === false) {
      return;
    }
    
    try {
      const jsRoot = path.join(projectRoot, 'resources/js');
      
      // Create model interface
      const modelInterfacePath = path.join(jsRoot, `Support/Interfaces/Models/${model.name}.ts`);
      await this.templateEngine.generateFile('frontend/model', model, modelInterfacePath);
      generatedFiles.push(modelInterfacePath);
      
      // Create resource interface
      const resourceInterfacePath = path.join(jsRoot, `Support/Interfaces/Resources/${model.name}Resource.ts`);
      await this.templateEngine.generateFile('frontend/resource', model, resourceInterfacePath);
      generatedFiles.push(resourceInterfacePath);
      
      // Create service hook
      const serviceHookPath = path.join(jsRoot, `Services/${this.toCamelCase(model.name)}ServiceHook.ts`);
      await this.templateEngine.generateFile('frontend/service.hook', model, serviceHookPath);
      generatedFiles.push(serviceHookPath);
      
      // Update exports in model index.ts
      await this.updateModelExports(jsRoot, model.name);
      
      // Update exports in resource index.ts
      await this.updateResourceExports(jsRoot, model.name);
      
      // Update routes.ts with new route
      await this.updateRoutes(jsRoot, model);
      
    } catch (error) {
      console.error('Error generating frontend files:', error);
      throw error;
    }
  }

  /**
   * Register the repository in the service provider
   */
  private registerRepositoryInServiceProvider(projectRoot: string, modelName: string): void {
    try {
      const providerPath = path.join(projectRoot, 'app/Providers/RepositoryServiceProvider.php');
      
      if (!fs.existsSync(providerPath)) {
        return;
      }
      
      let content = fs.readFileSync(providerPath, 'utf-8');
      
      // Check if the repository is already registered
      if (content.includes(`${modelName}RepositoryInterface`)) {
        return;
      }
      
      const newBinding = `
        \\App\\Support\\Interfaces\\Repositories\\${modelName}RepositoryInterface::class => \\App\\Repositories\\${modelName}Repository::class,
      `;
      
      const registerClosingBraceIndex = content.indexOf('    public function boot(');
      if (registerClosingBraceIndex !== -1) {
        const newContent = 
          content.substring(0, registerClosingBraceIndex) + 
          newBinding + 
          content.substring(registerClosingBraceIndex);
        fs.writeFileSync(providerPath, newContent);
      }
    } catch (error) {
      console.error('Error registering repository in service provider:', error);
    }
  }

  /**
   * Update permission enum with new model permissions
   */
  private async updatePermissionEnum(projectRoot: string, model: ModelDefinition): Promise<void> {
    try {
      const permEnumPath = path.join(projectRoot, 'app/Support/Enums/PermissionEnum.php');
        
      if (!fs.existsSync(permEnumPath)) {
        return;
      }
      
      let content = fs.readFileSync(permEnumPath, 'utf-8');
      
      // Generate model permissions
      const modelSnakeUpper = model.name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
      const modelPermissions = `
        // ${model.name} permissions
        case ${modelSnakeUpper}_READ = '${model.name.toLowerCase()}.read';
        case ${modelSnakeUpper}_CREATE = '${model.name.toLowerCase()}.create';
        case ${modelSnakeUpper}_UPDATE = '${model.name.toLowerCase()}.update';
        case ${modelSnakeUpper}_DELETE = '${model.name.toLowerCase()}.delete';
      `;
      
      // Check if permissions are already added
      if (content.includes(`${modelSnakeUpper}_READ`)) {
        return;
      }
      
      // Find where to add the permissions
      const marker = '    // Add your model permissions here';
      if (content.includes(marker)) {
        content = content.replace(marker, `${modelPermissions}\n    \n    // Add your model permissions here`);
        fs.writeFileSync(permEnumPath, content);
      }
    } catch (error) {
      console.error('Error updating permission enum:', error);
    }
  }

  /**
   * Add routes for the model to web.php
   */
  private async addRoutes(projectRoot: string, model: ModelDefinition): Promise<void> {
    try {
      const webRoutesPath = path.join(projectRoot, 'routes/web.php');
      
      if (!fs.existsSync(webRoutesPath)) {
        return;
      }
      
      let content = fs.readFileSync(webRoutesPath, 'utf-8');
      
      // Check if routes are already added
      const controllerName = `${model.name}Controller`;
      if (content.includes(controllerName)) {
        return;
      }
      
      // Use pluralized form for resource name
      const modelKebabCasePlural = this.toKebabCase(this.pluralize(model.name));
      const modelSnakeCase = this.toSnakeCase(model.name);
      
      const newRoute = `
// ${model.name} routes
Route::resource('${modelKebabCasePlural}', App\\Http\\Controllers\\${controllerName}::class);
`;
      
      content += newRoute;
      fs.writeFileSync(webRoutesPath, content);
      
      // Add API routes if API controller is generated
      if (model.options?.generateApiController !== false) {
        const apiRoutesPath = path.join(projectRoot, 'routes/api.php');
        
        if (!fs.existsSync(apiRoutesPath)) {
          return;
        }
        
        let apiContent = fs.readFileSync(apiRoutesPath, 'utf-8');
        
        // Check if API routes are already added - use plural form
        if (apiContent.includes(`/api/${modelKebabCasePlural}`)) {
          return;
        }
        
        // Add new API route at the end of the file
        const newApiRoute = `
// ${model.name} API routes
Route::apiResource('${modelKebabCasePlural}', App\\Http\\Controllers\\Api\\${controllerName}::class);
`;
        
        apiContent += newApiRoute;
        fs.writeFileSync(apiRoutesPath, apiContent);
      }
    } catch (error) {
      console.error('Error adding routes:', error);
    }
  }

  /**
   * Update model index.ts exports with new model
   */
  private async updateModelExports(jsRoot: string, modelName: string): Promise<void> {
    try {
      const modelIndexPath = path.join(jsRoot, 'Support/Interfaces/Models/index.ts');
      
      if (!fs.existsSync(modelIndexPath)) {
        return;
      }
      
      let content = fs.readFileSync(modelIndexPath, 'utf-8');
      
      // Check if model is already exported
      if (content.includes(`export * from './${modelName}';`)) {
        return;
      }
      
      // Add export
      content += `export * from './${modelName}';\n`;
      fs.writeFileSync(modelIndexPath, content);
    } catch (error) {
      console.error('Error updating model exports:', error);
    }
  }

  /**
   * Update resource index.ts exports with new resource
   */
  private async updateResourceExports(jsRoot: string, modelName: string): Promise<void> {
    try {
      const resourceIndexPath = path.join(jsRoot, 'Support/Interfaces/Resources/index.ts');
      
      if (!fs.existsSync(resourceIndexPath)) {
        return;
      }
      
      let content = fs.readFileSync(resourceIndexPath, 'utf-8');
      
      // Check if resource is already exported
      if (content.includes(`export * from './${modelName}Resource';`)) {
        return;
      }
      
      // Add export
      content += `export * from './${modelName}Resource';\n`;
      fs.writeFileSync(resourceIndexPath, content);
    } catch (error) {
      console.error('Error updating resource exports:', error);
    }
  }

  /**
   * Update routes.ts with new route
   */
  private async updateRoutes(jsRoot: string, model: ModelDefinition): Promise<void> {
    try {
      const routesPath = path.join(jsRoot, 'Support/Constants/routes.ts');
      
      if (!fs.existsSync(routesPath)) {
        return;
      }
      
      let content = fs.readFileSync(routesPath, 'utf-8');
      
      // Convert model name to route format
      const modelSnakeUpper = model.name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
      const modelKebabCase = model.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      
      // Check if route is already added
      if (content.includes(`${modelSnakeUpper}S:`)) {
        return;
      }
      
      // Check if we're adding before the closing brace
      const closingBraceIndex = content.lastIndexOf('}');
      if (closingBraceIndex !== -1) {
        const newRoute = `    ${modelSnakeUpper}S: '${modelKebabCase}s',\n`;
        content = 
          content.substring(0, closingBraceIndex) + 
          newRoute + 
          content.substring(closingBraceIndex);
        fs.writeFileSync(routesPath, content);
      }
    } catch (error) {
      console.error('Error updating routes.ts:', error);
    }
  }

  /**
   * Convert string to camelCase
   */
  private toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.replace(/[\s_-](\w)/g, (_, c) => c.toUpperCase()).substring(1);
  }

  /**
   * Convert string to snake_case
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]/g, '_')
      .toLowerCase();
  }
  
  /**
   * Convert string to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]/g, '-')
      .toLowerCase();
  }
  
  /**
   * Pluralize a string (model name)
   */
  private pluralize(str: string): string {
    // Handle irregular plurals
    const irregulars: Record<string, string> = {
      'person': 'people',
      'child': 'children',
      'man': 'men',
      'woman': 'women',
      'foot': 'feet',
      'tooth': 'teeth',
      'goose': 'geese',
      'mouse': 'mice',
      'criterion': 'criteria',
      'datum': 'data',
      'analysis': 'analyses',
      'diagnosis': 'diagnoses',
      'basis': 'bases',
      'crisis': 'crises',
      'thesis': 'theses',
      'index': 'indices'
    };
    
    // Check for irregular plural forms
    const lower = str.toLowerCase();
    if (irregulars[lower]) {
      // Preserve original case for first letter
      const plural = irregulars[lower];
      return str[0] === str[0].toUpperCase() 
        ? plural.charAt(0).toUpperCase() + plural.slice(1) 
        : plural;
    }
    
    // Handle standard pluralization rules
    if (str.match(/[^aeiou]y$/i)) {
      // Words ending in a consonant + y: change y to ies
      return str.replace(/y$/i, 'ies');
    } else if (str.match(/[sxz]$|[^aeioudgkprt]h$/i)) {
      // Words ending in s, x, z, ch, sh: add es
      return str + 'es';
    } else if (str.match(/[^aeiou]o$/i)) {
      // Some words ending in o: add es
      return str + 'es';
    } else {
      // Default: add s
      return str + 's';
    }
  }

  /**
   * Get table name from model name (pluralized snake_case)
   */
  private getTableNameFromModel(modelName: string): string {
    return this.toSnakeCase(this.pluralize(modelName));
  }

  /**
   * Generate the HTML content for the webview
   */
  private getWebviewContent(webview: vscode.Webview): string {
    // Generate a URI for a local resource
    const getResourceUri = (fileName: string) => {
      const onDiskPath = vscode.Uri.joinPath(this.context.extensionUri, 'resources', fileName);
      return webview.asWebviewUri(onDiskPath);
    };

    return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Laravel Forgemate</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          padding: 20px;
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
        }
        h1 {
          color: var(--vscode-editor-foreground);
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: inline-block;
          margin-right: 10px;
          font-weight: bold;
        }
        input, select, textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--vscode-input-border);
          background-color: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
        }
        button {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 8px 15px;
          cursor: pointer;
          margin-top: 10px;
        }
        button:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
        .attributes-container {
          margin-top: 20px;
          border: 1px solid var(--vscode-panel-border);
          padding: 15px;
        }
        .attribute-row {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }
        .attribute-field {
          flex: 1;
        }
        .attribute-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .tabs {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--vscode-panel-border);
        }
        .tab {
          padding: 10px 15px;
          cursor: pointer;
          border: 1px solid transparent;
        }
        .tab.active {
          border: 1px solid var(--vscode-panel-border);
          border-bottom: none;
          background-color: var(--vscode-editor-background);
          position: relative;
          top: 1px;
        }
        .tab-content {
          display: none;
        }
        .tab-content.active {
          display: block;
        }
        .relationship-row {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }
        .checkbox-group {
          display: flex;
          gap: 20px;
          align-items: center;
        }
        .checkbox-item {
          display: flex;
          align-items: center;
          margin-right: 15px;
        }
        .checkbox-item input[type="checkbox"] {
          width: auto;
          margin-right: 5px;
        }
        .checkbox-item label {
          margin-bottom: 0;
        }
        .inline-checkboxes {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-top: 5px;
        }
      </style>
    </head>
    <body>
      <h1>Laravel Forgemate - Scaffold Generator</h1>
      <div class="tabs">
        <div class="tab active" data-tab="basics">Model Basics</div>
        <div class="tab" data-tab="attributes">Attributes</div>
        <div class="tab" data-tab="relationships">Relationships</div>
        <div class="tab" data-tab="options">Generation Options</div>
      </div>
      <div class="tab-content active" id="basics-tab">
        <div class="form-group">
          <label for="modelName">Model Name:</label>
          <input type="text" id="modelName" placeholder="e.g. ArticleNews" />
        </div>
        
        <div class="form-group">
          <label for="tableName">Table Name (leave empty for default):</label>
          <input type="text" id="tableName" placeholder="e.g. article_news" />
        </div>
        
        <div class="form-group checkbox-group">
          <div class="checkbox-item">
            <input type="checkbox" id="timestamps" checked />
            <label for="timestamps">Include Timestamps</label>
          </div>
          <div class="checkbox-item">
            <input type="checkbox" id="softDeletes" />
            <label for="softDeletes">Use Soft Deletes</label>
          </div>
        </div>
      </div>
      
      <div class="tab-content" id="attributes-tab">
        <div class="attributes-container">
          <h3>Model Attributes</h3>
          <div id="attributes-list">
            <!-- Attributes will be added here -->
          </div>
          <button id="add-attribute">Add Attribute</button>
        </div>
      </div>
      
      <div class="tab-content" id="relationships-tab">
        <div class="attributes-container">
          <h3>Model Relationships</h3>
          <div id="relationships-list">
            <!-- Relationships will be added here -->
          </div>
          <button id="add-relationship">Add Relationship</button>
        </div>
      </div>
      
      <div class="tab-content" id="options-tab">
        <div class="form-group">
          <h3>Generation Options</h3>
          <div class="inline-checkboxes">
            <div class="checkbox-item">
              <input type="checkbox" id="generateMigration" checked />
              <label for="generateMigration">Generate Migration</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="generateFactory" checked />
              <label for="generateFactory">Generate Factory</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="generateSeeder" />
              <label for="generateSeeder">Generate Seeder</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="generateController" checked />
              <label for="generateController">Generate Controller</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="generateApiController" />
              <label for="generateApiController">Generate API Controller</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="generateService" checked />
              <label for="generateService">Generate Service</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="generateRepository" checked />
              <label for="generateRepository">Generate Repository</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="generateRequests" checked />
              <label for="generateRequests">Generate Form Requests</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="generateResource" checked />
              <label for="generateResource">Generate Resource</label>
            </div>
            <div class="checkbox-item">
              <input type="checkbox" id="generateFrontend" checked />
              <label for="generateFrontend">Generate Frontend Files</label>
            </div>
          </div>
        </div>
      </div>
      
      <button id="generate">Generate Scaffold</button>
      <div id="status" style="margin-top: 20px;"></div>
      
      <script>
        (function() {
          const vscode = acquireVsCodeApi();
          let attributes = [];
          let relationships = [];
          let availableModels = [];
          
          // Get available models from VS Code
          vscode.postMessage({ command: 'getAvailableModels' });
          
          // Tab handling
          document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function() {
              document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
              document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
              this.classList.add('active');
              document.getElementById(this.dataset.tab + '-tab').classList.add('active');
            });
          });
          
          // Add attribute handling
          document.getElementById('add-attribute').addEventListener('click', function() {
            const attributeId = Date.now(); // Unique ID for the attribute
            const attributesList = document.getElementById('attributes-list');
            const attributeRow = document.createElement('div');
            attributeRow.className = 'attribute-row';
            attributeRow.dataset.id = attributeId;
            
            attributeRow.innerHTML = \`
              <div class="attribute-field">
                <input type="text" placeholder="Attribute Name" class="attr-name" />
              </div>
              <div class="attribute-field">
                <select class="attr-type">
                  <option value="string">String</option>
                  <option value="text">Text</option>
                  <option value="integer">Integer</option>
                  <option value="bigInteger">Big Integer</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Date</option>
                  <option value="datetime">DateTime</option>
                  <option value="timestamp">Timestamp</option>
                  <option value="decimal">Decimal</option>
                  <option value="float">Float</option>
                  <option value="json">JSON</option>
                  <option value="uuid">UUID</option>
                </select>
              </div>
              <div class="attribute-field" style="display: flex; gap: 10px;">
                <div class="checkbox-item">
                  <input type="checkbox" class="attr-nullable" />
                  <label>Nullable</label>
                </div>
                <div class="checkbox-item">
                  <input type="checkbox" class="attr-unique" />
                  <label>Unique</label>
                </div>
              </div>
              <div class="attribute-actions">
                <button class="remove-attribute">Remove</button>
              </div>
            \`;
            
            attributesList.appendChild(attributeRow);
            
            // Add remove event
            attributeRow.querySelector('.remove-attribute').addEventListener('click', function() {
              attributeRow.remove();
              attributes = attributes.filter(attr => attr.id !== attributeId);
            });
          });
          
          // Add relationship handling
          document.getElementById('add-relationship').addEventListener('click', function() {
            const relationshipId = Date.now(); // Unique ID for the relationship
            const relationshipsList = document.getElementById('relationships-list');
            const relationshipRow = document.createElement('div');
            relationshipRow.className = 'relationship-row';
            relationshipRow.dataset.id = relationshipId;
            
            // Create model options from available models
            const modelOptions = availableModels.length > 0 
              ? availableModels.map(model => \`<option value="\${model}">\${model}</option>\`).join('')
              : '<option value="">No models available</option>';
            
            relationshipRow.innerHTML = \`
              <div class="attribute-field">
                <select class="rel-type">
                  <option value="hasOne">Has One</option>
                  <option value="hasMany">Has Many</option>
                  <option value="belongsTo">Belongs To</option>
                  <option value="belongsToMany">Belongs To Many</option>
                </select>
              </div>
              <div class="attribute-field">
                <select class="rel-model">
                  <option value="">Select Model</option>
                  \${modelOptions}
                </select>
              </div>
              <div class="attribute-field">
                <input type="text" placeholder="Foreign Key (optional)" class="rel-foreign-key" />
              </div>
              <div class="attribute-actions">
                <button class="remove-relationship">Remove</button>
              </div>
            \`;
            
            relationshipsList.appendChild(relationshipRow);
            
            // Add remove event
            relationshipRow.querySelector('.remove-relationship').addEventListener('click', function() {
              relationshipRow.remove();
              relationships = relationships.filter(rel => rel.id !== relationshipId);
            });
          });
          
          // Generate button handling
          document.getElementById('generate').addEventListener('click', function() {
            const statusElem = document.getElementById('status');
            statusElem.textContent = 'Generating scaffold...';
            
            // Collect attributes
            attributes = [];
            document.querySelectorAll('.attribute-row').forEach(row => {
              attributes.push({
                id: row.dataset.id,
                name: row.querySelector('.attr-name').value,
                type: row.querySelector('.attr-type').value,
                nullable: row.querySelector('.attr-nullable').checked,
                unique: row.querySelector('.attr-unique').checked
              });
            });
            
            // Collect relationships
            relationships = [];
            document.querySelectorAll('.relationship-row').forEach(row => {
              const foreignKey = row.querySelector('.rel-foreign-key').value;
              relationships.push({
                id: row.dataset.id,
                type: row.querySelector('.rel-type').value,
                relatedModel: row.querySelector('.rel-model').value,
                foreignKey: foreignKey || undefined
              });
            });
            
            // Build model definition
            const model = {
              name: document.getElementById('modelName').value,
              tableName: document.getElementById('tableName').value || undefined,
              timestamps: document.getElementById('timestamps').checked,
              softDeletes: document.getElementById('softDeletes').checked,
              attributes: attributes,
              relationships: relationships,
              options: {
                generateMigration: document.getElementById('generateMigration').checked,
                generateFactory: document.getElementById('generateFactory').checked,
                generateSeeder: document.getElementById('generateSeeder').checked,
                generateController: document.getElementById('generateController').checked,
                generateApiController: document.getElementById('generateApiController').checked,
                generateService: document.getElementById('generateService').checked,
                generateRepository: document.getElementById('generateRepository').checked,
                generateRequests: document.getElementById('generateRequests').checked,
                generateResource: document.getElementById('generateResource').checked,
                generateFrontend: document.getElementById('generateFrontend').checked
              }
            };
            
            // Send to extension
            vscode.postMessage({ command: 'generateScaffold', model });
          });
          
          // Handle messages from the extension
          window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
              case 'generationComplete':
                const statusElem = document.getElementById('status');
                if (message.success) {
                  statusElem.innerHTML = \`Generation completed successfully! Generated \${message.files.length} files.\`;
                } else {
                  statusElem.innerHTML = \`Error during generation: \${message.error}\`;
                }
                break;
              case 'availableModels':
                // Update available models list
                availableModels = message.models || [];
                // Update any existing relationship selects
                document.querySelectorAll('.rel-model').forEach(select => {
                  const currentValue = select.value;
                  select.innerHTML = '<option value="">Select Model</option>' + 
                    availableModels.map(model => \`<option value="\${model}" \${currentValue === model ? 'selected' : ''}>\${model}</option>\`).join('');
                });
                break;
            }
          });
          
          // Add some default attributes for user convenience
          document.getElementById('add-attribute').click();
          document.querySelector('.attr-name').value = 'title';
          document.querySelector('.attr-type').value = 'string';
          
          document.getElementById('add-attribute').click();
          const rows = document.querySelectorAll('.attribute-row');
          if (rows.length >= 2) {
            const secondRow = rows[1];
            secondRow.querySelector('.attr-name').value = 'description';
            secondRow.querySelector('.attr-type').value = 'text';
          }
        })();
      </script>
    </body>
    </html>`;
  }

  /**
   * Setup message handling for the webview
   */
  private setupMessageHandling(panel: vscode.WebviewPanel) {
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      async (message) => {
        try {
          switch (message.command) {
            case 'generateScaffold':
              await this.handleScaffoldGeneration(message.model, panel);
              break;
            case 'getAvailableModels':
              await this.sendAvailableModels(panel);
              break;
          }
        } catch (error) {
          panel.webview.postMessage({
            command: 'generationComplete',
            success: false,
            error: (error as Error).message
          });
          console.error('Error handling message:', error);
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  /**
   * Send available models list to the webview
   */
  private async sendAvailableModels(panel: vscode.WebviewPanel): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration('laravelForgemate');
      const laravelProjectPath = config.get<string>('laravelProjectPath', '');
      const projectRoot = this.getProjectRoot(laravelProjectPath);
      const modelsDir = path.join(projectRoot, 'app/Models');
      let models: string[] = [];
      
      if (fs.existsSync(modelsDir)) {
        const files = fs.readdirSync(modelsDir);
        models = files
          .filter(file => file.endsWith('.php'))
          .map(file => file.replace('.php', ''));
      }
      
      panel.webview.postMessage({
        command: 'availableModels',
        models
      });
    } catch (error) {
      console.error('Error getting available models:', error);
      panel.webview.postMessage({
        command: 'availableModels',
        models: []
      });
    }
  }

  /**
   * Handle scaffold generation from webview submission
   */
  private async handleScaffoldGeneration(model: ModelDefinition, panel: vscode.WebviewPanel): Promise<void> {
    try {
      // Validate model
      this.validateModel(model);
      
      // Configure project paths
      const config = vscode.workspace.getConfiguration('laravelForgemate');
      const laravelProjectPath = config.get<string>('laravelProjectPath', '');
      const projectRoot = this.getProjectRoot(laravelProjectPath);
      
      // Generate files
      const generatedFiles: string[] = [];
      
      // Generate backend files
      await this.generateBackendFilesInternal(model, projectRoot, generatedFiles);
      
      // Generate frontend files if enabled
      if (model.options?.generateFrontend !== false) {
        await this.generateFrontendFilesInternal(model, projectRoot, generatedFiles);
      }
      
      // Send success message to webview
      panel.webview.postMessage({
        command: 'generationComplete',
        success: true,
        files: generatedFiles
      });
      
      // Show success message
      vscode.window.showInformationMessage(
        `Generated ${generatedFiles.length} files for ${model.name}`,
        'Show Files'
      ).then(selection => {
        if (selection === 'Show Files') {
          // Open model file
          const modelFile = generatedFiles.find(f => f.includes(`/Models/${model.name}.php`));
          if (modelFile) {
            vscode.window.showTextDocument(vscode.Uri.file(modelFile));
          }
        }
      });
      
      // Refresh explorer view
      const treeDataProvider = this.getTreeDataProvider();
      if ('refresh' in treeDataProvider && typeof treeDataProvider.refresh === 'function') {
        treeDataProvider.refresh();
      }
    } catch (error) {
      console.error('Error generating scaffold:', error);
      
      // Send error message to webview
      panel.webview.postMessage({
        command: 'generationComplete',
        success: false,
        error: (error as Error).message
      });
      
      // Show error message
      vscode.window.showErrorMessage(`Error generating scaffold: ${(error as Error).message}`);
    }
  }

  /**
   * Validate model definition before generation
   */
  private validateModel(model: ModelDefinition): void {
    if (!model.name) {
      throw new Error('Model name is required');
    }
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(model.name)) {
      throw new Error('Model name must be in PascalCase');
    }
    if (!model.attributes || model.attributes.length === 0) {
      throw new Error('At least one attribute is required');
    }
    
    // Validate attributes
    for (const attr of model.attributes) {
      if (!attr.name) {
        throw new Error('Attribute name is required');
      }
      if (!attr.type) {
        throw new Error(`Type is required for attribute "${attr.name}"`);
      }
      // Check for valid attribute name format (snake_case)
      if (!/^[a-z][a-z0-9_]*$/.test(attr.name)) {
        throw new Error(`Attribute name "${attr.name}" must be in snake_case format`);
      }
    }
    
    // Validate relationships if any
    if (model.relationships && model.relationships.length > 0) {
      for (const rel of model.relationships) {
        if (!rel.type) {
          throw new Error('Relationship type is required');
        }
        if (!rel.relatedModel) {
          throw new Error('Related model is required for relationship');
        }
        // Check valid relationship types
        const validTypes = ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'];
        if (!validTypes.includes(rel.type)) {
          throw new Error(`Invalid relationship type: "${rel.type}"`);
        }
      }
    }
  }

  /**
   * Get project root from config or workspace
   */
  private getProjectRoot(customPath: string): string {
    if (customPath && fs.existsSync(customPath)) {
      return customPath;
    }
    
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folder or Laravel project path found');
    }
    
    const projectRoot = workspaceFolders[0].uri.fsPath;
    this.validateLaravelProject(projectRoot);
    return projectRoot;
  }

  /**
   * Validate that the given path is a Laravel project
   */
  private validateLaravelProject(projectRoot: string): void {
    // Check for key Laravel files/directories
    const artisanPath = path.join(projectRoot, 'artisan');
    const appDirPath = path.join(projectRoot, 'app');
    const configDirPath = path.join(projectRoot, 'config');
    
    if (!fs.existsSync(artisanPath) || !fs.existsSync(appDirPath) || !fs.existsSync(configDirPath)) {
      throw new Error(`The directory at "${projectRoot}" does not appear to be a valid Laravel project`);
    }
  }
}
