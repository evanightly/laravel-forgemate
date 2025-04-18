import * as vscode from 'vscode';
import { TemplateEngine } from '../engine/TemplateEngine';
import { SchemaParser } from '../parsers/SchemaParser';
import { ModelDefinition } from '../types/ModelDefinition';
import { TreeDataProvider } from './TreeDataProvider';
import path from 'path';
import fs from 'fs';
import { ProjectInitializer } from '../initializer/ProjectInitializer';

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
      // Get configuration
      const config = vscode.workspace.getConfiguration('laravelForgemate');
      
      // Get custom frontend paths from configuration, with defaults if not specified
      const modelsPath = config.get<string>('frontendModelsPath', 'Support/Interfaces/Models');
      const resourcesPath = config.get<string>('frontendResourcesPath', 'Support/Interfaces/Resources');
      const servicesPath = config.get<string>('frontendServicesPath', 'Services');
      const constantsPath = config.get<string>('frontendConstantsPath', 'Support/Constants');
      
      // Determine base js directory
      const jsRoot = path.join(projectRoot, 'resources/js');
      
      // Create model interface
      const modelInterfacePath = path.join(jsRoot, `${modelsPath}/${model.name}.ts`);
      await this.templateEngine.generateFile('frontend/model', model, modelInterfacePath);
      generatedFiles.push(modelInterfacePath);
      
      // Create resource interface
      const resourceInterfacePath = path.join(jsRoot, `${resourcesPath}/${model.name}Resource.ts`);
      await this.templateEngine.generateFile('frontend/resource', model, resourceInterfacePath);
      generatedFiles.push(resourceInterfacePath);
      
      // Create service hook
      const serviceHookPath = path.join(jsRoot, `${servicesPath}/${this.toCamelCase(model.name)}ServiceHook.ts`);
      await this.templateEngine.generateFile('frontend/service.hook', model, serviceHookPath);
      generatedFiles.push(serviceHookPath);
      
      // Update exports in model index.ts
      await this.updateModelExports(jsRoot, model.name, modelsPath);
      
      // Update exports in resource index.ts
      await this.updateResourceExports(jsRoot, model.name, resourcesPath);
      
      // Update routes.ts with new route
      await this.updateRoutes(jsRoot, model, constantsPath);
      
    } catch (error) {
      console.error('Error generating frontend files:', error);
      throw error;
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
  private async updateModelExports(jsRoot: string, modelName: string, modelsPath: string): Promise<void> {
    try {
      const modelIndexPath = path.join(jsRoot, `${modelsPath}/index.ts`);
      
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
  private async updateResourceExports(jsRoot: string, modelName: string, resourcesPath: string): Promise<void> {
    try {
      const resourceIndexPath = path.join(jsRoot, `${resourcesPath}/index.ts`);
      
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
  private async updateRoutes(jsRoot: string, model: ModelDefinition, constantsPath: string): Promise<void> {
    try {
      const routesPath = path.join(jsRoot, `${constantsPath}/routes.ts`);
      
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

    const tailwindScriptUri = getResourceUri('js/tailwind.min.js');

    return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Laravel Forgemate</title>
      <script src="${tailwindScriptUri}"></script>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                laravel: '#FF2D20',
                vscodeBackground: 'var(--vscode-editor-background)',
                vscodeForeground: 'var(--vscode-editor-foreground)',
                vscodeInputBackground: 'var(--vscode-input-background)',
                vscodeInputForeground: 'var(--vscode-input-foreground)',
                vscodeInputBorder: 'var(--vscode-input-border)',
                vscodeButtonBackground: 'var(--vscode-button-background)',
                vscodeButtonForeground: 'var(--vscode-button-foreground)',
                vscodeButtonHoverBackground: 'var(--vscode-button-hoverBackground)',
                vscodePanelBorder: 'var(--vscode-panel-border)',
              }
            }
          }
        }
      </script>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
        }
        
        /* Base styles that work with Tailwind */
        input[type="checkbox"] {
          width: auto !important;
        }
      </style>
    </head>
    <body class="p-6">
      <h1 class="text-2xl font-bold mb-6 text-vscodeForeground flex items-center">
        <svg class="w-8 h-8 mr-2 text-laravel" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
          <path d="M504.4,115.83a5.72,5.72,0,0,0-.28-.68,8.52,8.52,0,0,0-.53-1.25,6,6,0,0,0-.54-.71,9.36,9.36,0,0,0-.72-.94c-.23-.22-.52-.4-.77-.6a8.84,8.84,0,0,0-.9-.68L404.4,55.55a8,8,0,0,0-8,0L300.12,111h0a8.07,8.07,0,0,0-.88.69,7.68,7.68,0,0,0-.78.6,8.23,8.23,0,0,0-.72.93c-.17.24-.39.45-.54.71a9.7,9.7,0,0,0-.52,1.25c-.08.23-.21.44-.28.68a8.08,8.08,0,0,0-.28,2.08V223.18l-80.22,46.19V63.44a7.8,7.8,0,0,0-.28-2.09c-.06-.24-.2-.45-.28-.68a8.35,8.35,0,0,0-.52-1.24c-.14-.26-.37-.47-.54-.72a9.36,9.36,0,0,0-.72-.94,9.46,9.46,0,0,0-.78-.6,9.8,9.8,0,0,0-.88-.68h0L115.61,1.07a8,8,0,0,0-8,0L11.34,56.49h0a6.52,6.52,0,0,0-.88.69,7.81,7.81,0,0,0-.79.6,8.15,8.15,0,0,0-.71.93c-.18.25-.4.46-.55.72a7.88,7.88,0,0,0-.51,1.24,6.46,6.46,0,0,0-.29.67,8.18,8.18,0,0,0-.28,2.1v329.7a8,8,0,0,0,4,6.95l192.5,110.84a8.83,8.83,0,0,0,1.33.54c.21.08.41.2.63.26a7.92,7.92,0,0,0,4.1,0c.21-.06.42-.18.63-.26a7.44,7.44,0,0,0,1.33-.54L404.4,400.09a8,8,0,0,0,4-6.95V287.88l92.24-53.11a8,8,0,0,0,4-7V117.92A8.63,8.63,0,0,0,504.4,115.83ZM111.6,17.28h0l80.19,46.15-80.2,46.18L31.41,63.44Zm88.25,60V278.6l-46.53,26.79-33.69,19.4V123.5l46.53-26.79Zm0,412.78L23.37,388.5V77.32L57.06,96.7l46.52,26.8V338.68a6.94,6.94,0,0,0,.12.9,8,8,0,0,0,.16,1.18h0a5.92,5.92,0,0,0,.38.9,6.38,6.38,0,0,0,.42,1v0a8.54,8.54,0,0,0,.6.78,7.62,7.62,0,0,0,.66.84l0,0c.23.22.52.38.77.58a8.93,8.93,0,0,0,.86.66l0,0,0,0,92.19,52.18Zm8-106.17-80.06-45.32,84.09-48.41,92.26-53.11,80.13,46.13-58.8,33.56Zm184.52,4.57L215.88,490.11V397.8L346.6,323.2l45.77-26.15Zm0-119.13L358.68,250l-46.53-26.79V131.79l33.69,19.4L392.37,178Zm8-105.28-80.2-46.17,80.2-46.16,80.18,46.15Zm8,105.28V178L455,151.19l33.68-19.4v91.39Z"/>
        </svg>
        Laravel Forgemate - Scaffold Generator
      </h1>
      
      <div class="flex border-b border-vscodePanelBorder mb-6">
        <div class="tab cursor-pointer py-2 px-4 border border-transparent active" data-tab="basics">Model Basics</div>
        <div class="tab cursor-pointer py-2 px-4 border border-transparent" data-tab="attributes">Attributes</div>
        <div class="tab cursor-pointer py-2 px-4 border border-transparent" data-tab="relationships">Relationships</div>
        <div class="tab cursor-pointer py-2 px-4 border border-transparent" data-tab="options">Generation Options</div>
      </div>
      
      <div class="tab-content active" id="basics-tab">
        <div class="mb-4">
          <label for="modelName" class="block font-semibold mb-2">Model Name:</label>
          <input type="text" id="modelName" placeholder="e.g. ArticleNews" 
                 class="w-full p-2 border border-vscodeInputBorder bg-vscodeInputBackground text-vscodeInputForeground rounded" />
        </div>
        
        <div class="mb-4">
          <label for="tableName" class="block font-semibold mb-2">Table Name (leave empty for default):</label>
          <input type="text" id="tableName" placeholder="e.g. article_news" 
                 class="w-full p-2 border border-vscodeInputBorder bg-vscodeInputBackground text-vscodeInputForeground rounded" />
        </div>
        
        <div class="flex gap-6 mb-4">
          <div class="flex items-center">
            <input type="checkbox" id="timestamps" checked class="mr-2" />
            <label for="timestamps" class="font-medium">Include Timestamps</label>
          </div>
          <div class="flex items-center">
            <input type="checkbox" id="softDeletes" class="mr-2" />
            <label for="softDeletes" class="font-medium">Use Soft Deletes</label>
          </div>
        </div>
      </div>
      
      <div class="tab-content hidden" id="attributes-tab">
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">Model Attributes</h3>
          <div id="attributes-list" class="space-y-3">
            <!-- Attributes will be added here -->
          </div>
          <button id="add-attribute" class="mt-4 px-4 py-2 bg-vscodeButtonBackground text-vscodeButtonForeground rounded hover:bg-vscodeButtonHoverBackground">
            Add Attribute
          </button>
        </div>
      </div>
      
      <div class="tab-content hidden" id="relationships-tab">
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">Model Relationships</h3>
          <div id="relationships-list" class="space-y-3">
            <!-- Relationships will be added here -->
          </div>
          <button id="add-relationship" class="mt-4 px-4 py-2 bg-vscodeButtonBackground text-vscodeButtonForeground rounded hover:bg-vscodeButtonHoverBackground">
            Add Relationship
          </button>
        </div>
      </div>
      
      <div class="tab-content hidden" id="options-tab">
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">Generation Options</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            <div class="flex items-center">
              <input type="checkbox" id="generateMigration" checked class="mr-2" />
              <label for="generateMigration" class="font-medium">Generate Migration</label>
            </div>
            <div class="flex items-center">
              <input type="checkbox" id="generateFactory" checked class="mr-2" />
              <label for="generateFactory" class="font-medium">Generate Factory</label>
            </div>
            <div class="flex items-center">
              <input type="checkbox" id="generateSeeder" class="mr-2" />
              <label for="generateSeeder" class="font-medium">Generate Seeder</label>
            </div>
            <div class="flex items-center">
              <input type="checkbox" id="generateController" checked class="mr-2" />
              <label for="generateController" class="font-medium">Generate Controller</label>
            </div>
            <div class="flex items-center">
              <input type="checkbox" id="generateApiController" class="mr-2" />
              <label for="generateApiController" class="font-medium">Generate API Controller</label>
            </div>
            <div class="flex items-center">
              <input type="checkbox" id="generateService" checked class="mr-2" />
              <label for="generateService" class="font-medium">Generate Service</label>
            </div>
            <div class="flex items-center">
              <input type="checkbox" id="generateRepository" checked class="mr-2" />
              <label for="generateRepository" class="font-medium">Generate Repository</label>
            </div>
            <div class="flex items-center">
              <input type="checkbox" id="generateRequests" checked class="mr-2" />
              <label for="generateRequests" class="font-medium">Generate Form Requests</label>
            </div>
            <div class="flex items-center">
              <input type="checkbox" id="generateResource" checked class="mr-2" />
              <label for="generateResource" class="font-medium">Generate Resource</label>
            </div>
            <div class="flex items-center">
              <input type="checkbox" id="generateFrontend" checked class="mr-2" />
              <label for="generateFrontend" class="font-medium">Generate Frontend Files</label>
            </div>
          </div>
        </div>
      </div>
      
      <button id="generate" class="px-6 py-2 bg-vscodeButtonBackground text-vscodeButtonForeground rounded-md hover:bg-vscodeButtonHoverBackground transition-colors">
        Generate Scaffold
      </button>
      <div id="status" class="mt-5 py-2 rounded-md"></div>
      
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
              document.querySelectorAll('.tab').forEach(t => {
                t.classList.remove('active');
                t.classList.remove('border-vscodePanelBorder');
                t.classList.remove('border-b-vscodeBackground');
                t.classList.remove('bg-vscodeBackground');
              });
              document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
              
              this.classList.add('active');
              this.classList.add('border-vscodePanelBorder');
              this.classList.add('border-b-vscodeBackground');
              this.classList.add('bg-vscodeBackground');
              
              const tabContent = document.getElementById(this.dataset.tab + '-tab');
              tabContent.classList.remove('hidden');
            });
          });
          
          // Activate the first tab
          document.querySelector('.tab.active').classList.add('border-vscodePanelBorder');
          document.querySelector('.tab.active').classList.add('border-b-vscodeBackground');
          document.querySelector('.tab.active').classList.add('bg-vscodeBackground');
          
          // Add attribute handling
          document.getElementById('add-attribute').addEventListener('click', function() {
            const attributeId = Date.now(); // Unique ID for the attribute
            const attributesList = document.getElementById('attributes-list');
            const attributeRow = document.createElement('div');
            attributeRow.className = 'attribute-row grid grid-cols-12 gap-3 items-center bg-vscodeInputBackground p-3 rounded-md';
            attributeRow.dataset.id = attributeId;
            
            attributeRow.innerHTML = \`
              <div class="col-span-4">
                <input type="text" placeholder="Attribute Name" class="attr-name w-full p-2 border border-vscodeInputBorder bg-vscodeInputBackground text-vscodeInputForeground rounded" />
              </div>
              <div class="col-span-4">
                <select class="attr-type w-full p-2 border border-vscodeInputBorder bg-vscodeInputBackground text-vscodeInputForeground rounded">
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
              <div class="col-span-3 flex gap-3">
                <div class="flex items-center">
                  <input type="checkbox" class="attr-nullable mr-2" />
                  <label class="text-sm">Nullable</label>
                </div>
                <div class="flex items-center">
                  <input type="checkbox" class="attr-unique mr-2" />
                  <label class="text-sm">Unique</label>
                </div>
              </div>
              <div class="col-span-1 flex justify-end">
                <button class="remove-attribute p-1 bg-red-600 text-white rounded-md hover:bg-red-700">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
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
            relationshipRow.className = 'relationship-row grid grid-cols-12 gap-3 items-center bg-vscodeInputBackground p-3 rounded-md';
            relationshipRow.dataset.id = relationshipId;
            
            // Create model options from available models
            const modelOptions = availableModels.length > 0 
              ? availableModels.map(model => \`<option value="\${model}">\${model}</option>\`).join('')
              : '<option value="">No models available</option>';
            
            relationshipRow.innerHTML = \`
              <div class="col-span-3">
                <select class="rel-type w-full p-2 border border-vscodeInputBorder bg-vscodeInputBackground text-vscodeInputForeground rounded">
                  <option value="hasOne">Has One</option>
                  <option value="hasMany">Has Many</option>
                  <option value="belongsTo">Belongs To</option>
                  <option value="belongsToMany">Belongs To Many</option>
                </select>
              </div>
              <div class="col-span-4">
                <select class="rel-model w-full p-2 border border-vscodeInputBorder bg-vscodeInputBackground text-vscodeInputForeground rounded">
                  <option value="">Select Model</option>
                  \${modelOptions}
                </select>
              </div>
              <div class="col-span-4">
                <input type="text" placeholder="Foreign Key (optional)" class="rel-foreign-key w-full p-2 border border-vscodeInputBorder bg-vscodeInputBackground text-vscodeInputForeground rounded" />
              </div>
              <div class="col-span-1 flex justify-end">
                <button class="remove-relationship p-1 bg-red-600 text-white rounded-md hover:bg-red-700">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
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
            statusElem.className = 'mt-5 py-2 px-4 bg-yellow-100 text-yellow-800 rounded-md';
            
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
                  statusElem.innerHTML = \`<div class="flex items-center">
                    <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Generation completed successfully! Generated \${message.files.length} files.</span>
                  </div>\`;
                  statusElem.className = 'mt-5 py-2 px-4 bg-green-100 text-green-800 rounded-md';
                } else {
                  statusElem.innerHTML = \`<div class="flex items-center">
                    <svg class="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    <span>Error during generation: \${message.error}</span>
                  </div>\`;
                  statusElem.className = 'mt-5 py-2 px-4 bg-red-100 text-red-800 rounded-md';
                }
                break;
              case 'availableModels':
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
      
      // Ensure baseline files are present
      // await this.ensureBaselineFilesExist(projectRoot);
      
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
   * Ensure baseline files exist before generating scaffolds
   */
  private async ensureBaselineFilesExist(projectRoot: string): Promise<void> {
    try {
      // Create project initializer
      const templateEngine = new TemplateEngine(this.context);
      const initializer = new ProjectInitializer(this.context, templateEngine);
      
      // Check for essential backend files
      await this.ensureBackendBaseline(projectRoot, initializer);
      
      // Check for essential frontend files
      await this.ensureFrontendBaseline(projectRoot, initializer);
    } catch (error) {
      console.error('Error ensuring baseline files:', error);
      throw new Error(`Failed to initialize project: ${(error as Error).message}`);
    }
  }

  /**
   * Ensure backend baseline files exist
   */
  private async ensureBackendBaseline(projectRoot: string, initializer: ProjectInitializer): Promise<void> {
    // Check for BaseRepositoryInterface
    const baseRepoInterfacePath = path.join(projectRoot, 'app/Support/Interfaces/Repositories/BaseRepositoryInterface.php');
    if (!fs.existsSync(baseRepoInterfacePath)) {
      // Create the necessary directories and files
      await initializer.createBaseRepositoryInterface(projectRoot);
      await initializer.createBaseRepository(projectRoot);
      await initializer.createRepositoryServiceProvider(projectRoot);
      await initializer.createBackendTraits(projectRoot);
      await initializer.createIntentEnum(projectRoot);
      await initializer.createPermissionEnum(projectRoot);
      
      vscode.window.showInformationMessage('Project initialized: Created base repository files');
    }
  }

  /**
   * Ensure frontend baseline files exist
   */
  private async ensureFrontendBaseline(projectRoot: string, _initializer: ProjectInitializer): Promise<void> {
    // Check for serviceHooksFactory.ts
    const serviceHooksFactoryPath = path.join(projectRoot, 'resources/js/Services/serviceHooksFactory.ts');
    if (!fs.existsSync(serviceHooksFactoryPath)) {
      // Create frontend helper directories
      await this.createServiceHooksFactory(projectRoot);
      await this.createHelperFunctions(projectRoot);
      await this.createFrontendInterfaces(projectRoot);
      
      vscode.window.showInformationMessage('Project initialized: Created frontend service hooks and interfaces');
    }
  }

  /**
   * Create serviceHooksFactory.ts and related helpers
   */
  private async createServiceHooksFactory(projectRoot: string): Promise<void> {
    const servicesDir = path.join(projectRoot, 'resources/js/Services');
    if (!fs.existsSync(servicesDir)) {
      fs.mkdirSync(servicesDir, { recursive: true });
    }
    
    const serviceHooksFactoryPath = path.join(servicesDir, 'serviceHooksFactory.ts');
    const serviceHooksFactoryContent = `import { generateUseGetAllQueryKey, generateUseGetQueryKey } from '@/Helpers';
import {
    PaginateResponse,
    ServiceHooks,
    UseCreateOptions,
    UseDeleteOptions,
    UseGetAllOptions,
    UseGetOptions,
    UseUpdateOptions,
} from '@/Support/Interfaces/Others';
import { Resource } from '@/Support/Interfaces/Resources';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type ExtendedResource<T> = T & Record<string, any>;

export function serviceHooksFactory<T extends Resource>({ baseKey, baseRoute }: ServiceHooks) {
    if (!baseKey) baseKey = baseRoute;

    return {
        getAll: async ({ filters, axiosRequestConfig }: UseGetAllOptions<T> = {}) => {
            const url = route(\`\${baseRoute}.index\`);
            const response = await window.axios.get(url, {
                params: filters,
                ...axiosRequestConfig,
            });
            return response.data;
        },

        useGetAll: ({ filters, axiosRequestConfig, useQueryOptions }: UseGetAllOptions<T> = {}) => {
            const url = route(\`\${baseRoute}.index\`);

            return useQuery<PaginateResponse<T>>({
                queryKey: generateUseGetAllQueryKey(baseKey, filters),
                queryFn: async () => {
                    const response = await window.axios.get(url, {
                        params: filters,
                        ...axiosRequestConfig,
                    });
                    return response.data;
                },
                placeholderData: keepPreviousData,
                ...useQueryOptions,
            });
        },

        useGet: ({ id, axiosRequestConfig, useQueryOptions }: UseGetOptions<T>) => {
            const url = route(\`\${baseRoute}.show\`, id);

            return useQuery({
                queryKey: generateUseGetQueryKey(baseKey, id),
                queryFn: async () => {
                    const response = await window.axios.get(url, axiosRequestConfig);
                    return response.data;
                },
                enabled: !!id,
                ...useQueryOptions,
            });
        },

        useCreate: ({ axiosRequestConfig, useMutationOptions }: UseCreateOptions<T> = {}) => {
            const queryClient = useQueryClient();

            return useMutation<Partial<T>, Error, { data: Partial<ExtendedResource<T>> }>({
                mutationFn: async ({ data }: { data: Partial<ExtendedResource<T>> }) => {
                    const url = route(\`\${baseRoute}.store\`);
                    const response = await window.axios.post(url, data, axiosRequestConfig);
                    return response.data;
                },
                onSuccess: async (...args) => {
                    await queryClient.invalidateQueries({ queryKey: [baseKey], exact: false });

                    if (useMutationOptions?.onSuccess) {
                        await useMutationOptions.onSuccess(...args);
                    }
                },
                ...useMutationOptions,
            });
        },

        useUpdate: ({ axiosRequestConfig, useMutationOptions }: UseUpdateOptions<T> = {}) => {
            const queryClient = useQueryClient();

            return useMutation<
                Partial<T>,
                Error,
                { id: number; data: Partial<ExtendedResource<T>> }
            >({
                mutationFn: async ({
                    id,
                    data,
                }: {
                    id: number;
                    data: Partial<ExtendedResource<T>>;
                }) => {
                    const url = route(\`\${baseRoute}.update\`, id);
                    const response = await window.axios.post(url, data, {
                        params: { _method: 'PUT' },
                        ...axiosRequestConfig,
                    });
                    return response.data;
                },
                onSuccess: async (...args) => {
                    await queryClient.invalidateQueries({ queryKey: [baseKey], exact: false });

                    if (useMutationOptions?.onSuccess) {
                        await useMutationOptions.onSuccess(...args);
                    }
                },
                ...useMutationOptions,
            });
        },

        useDelete: ({ axiosRequestConfig, useMutationOptions }: UseDeleteOptions<T> = {}) => {
            const queryClient = useQueryClient();

            return useMutation<Partial<T>, Error, { id: number }>({
                mutationFn: async ({ id }: { id: number }) => {
                    const url = route(\`\${baseRoute}.destroy\`, id);
                    const response = await window.axios.post(
                        url,
                        { _method: 'DELETE' },
                        axiosRequestConfig,
                    );
                    return response.data;
                },
                onSuccess: async (...args) => {
                    await queryClient.invalidateQueries({ queryKey: [baseKey], exact: false });

                    if (useMutationOptions?.onSuccess) {
                        await useMutationOptions.onSuccess(...args);
                    }
                },
                ...useMutationOptions,
            });
        },
    };
}`;

    fs.writeFileSync(serviceHooksFactoryPath, serviceHooksFactoryContent);
  }

  /**
   * Create helper functions for frontend
   */
  private async createHelperFunctions(projectRoot: string): Promise<void> {
    const helpersDir = path.join(projectRoot, 'resources/js/Helpers');
    if (!fs.existsSync(helpersDir)) {
      fs.mkdirSync(helpersDir, { recursive: true });
    }
    
    // Create index.ts
    const indexPath = path.join(helpersDir, 'index.ts');
    const indexContent = `export * from './generateDynamicBreadcrumbs';
export * from './generateServiceHooksFactoryQueryKey';
export * from './tanstackQueryHelpers';
`;
    fs.writeFileSync(indexPath, indexContent);
    
    // Create generateServiceHooksFactoryQueryKey.ts
    const queryKeyPath = path.join(helpersDir, 'generateServiceHooksFactoryQueryKey.ts');
    const queryKeyContent = `import { ServiceFilterOptions } from '@/Support/Interfaces/Others';

const generateUseGetAllQueryKey = (baseKey: string, filters?: ServiceFilterOptions) => {
    return [baseKey, 'all', filters];
};

const generateUseGetQueryKey = (baseKey: string, id: number) => {
    return [baseKey, 'detail', id];
};

export { generateUseGetAllQueryKey, generateUseGetQueryKey };
`;
    fs.writeFileSync(queryKeyPath, queryKeyContent);
    
    // Create generateDynamicBreadcrumbs.ts
    const breadcrumbsPath = path.join(helpersDir, 'generateDynamicBreadcrumbs.ts');
    const breadcrumbsContent = `import { ROUTES } from '@/Support/Constants/routes';
import { GenericBreadcrumbItem } from '@/Support/Interfaces/Others';
import { usePage } from '@inertiajs/react';

function generateDynamicBreadcrumbs(): GenericBreadcrumbItem[] {
    const { url } = usePage();

    // Parse the URL to handle query parameters
    const urlObj = new URL(window.location.origin + url);
    const pathWithoutQuery = urlObj.pathname;

    // Extract only the path part from the dashboard route
    const dashboardPath = new URL(route(\`\${ROUTES.DASHBOARD}.index\`)).pathname;

    // Handle dashboard route
    if (pathWithoutQuery === dashboardPath) {
        return [
            {
                name: 'Home',
                link: route(\`\${ROUTES.DASHBOARD}.index\`),
                active: true,
            },
        ];
    }

    const paths = pathWithoutQuery.split('/').filter(Boolean);

    const breadcrumbs: GenericBreadcrumbItem[] = paths.map((path, index) => {
        const isActive = index === paths.length - 1;

        // Format the name by replacing hyphens with spaces and capitalizing each word
        const name = path
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        // Construct the link maintaining the same path structure
        const link = \`/\${paths.slice(0, index + 1).join('/')}\`;

        // Add query parameters only to the active (last) breadcrumb if they exist
        const finalLink = isActive ? \`\${link}\${urlObj.search}\` : link;

        return {
            name,
            link: finalLink,
            active: isActive,
        };
    });

    // Add "Home" as the root breadcrumb
    breadcrumbs.unshift({
        name: 'Home',
        link: route(\`\${ROUTES.DASHBOARD}.index\`),
        active: false,
    });

    return breadcrumbs;
}

export { generateDynamicBreadcrumbs };
`;
    fs.writeFileSync(breadcrumbsPath, breadcrumbsContent);
    
    // Create tanstackQueryHelpers.ts
    const tanstackPath = path.join(helpersDir, 'tanstackQueryHelpers.ts');
    const tanstackContent = `import { ServiceFilterOptions } from '@/Support/Interfaces/Others';
import {
    InvalidateQueryFilters,
    QueryFunction,
    useMutation,
    useQuery,
    useQueryClient,
    UseQueryOptions,
} from '@tanstack/react-query';
import { AxiosRequestConfig, Method } from 'axios';

const mutationApi = async ({
    method,
    url,
    data = {},
    params = {},
    requestConfig = {},
}: {
    method: Method;
    url: string;
    data?: Record<string, any>;
    params?: ServiceFilterOptions;
    requestConfig?: AxiosRequestConfig;
}) => {
    return await window.axios({
        method,
        url,
        data,
        params,
        ...requestConfig,
    });
};

const createMutation = ({
    mutationFn,
    onSuccess,
    invalidateQueryKeys,
}: {
    mutationFn: (...args: any[]) => Promise<any>;
    onSuccess?: () => Promise<void>;
    invalidateQueryKeys?: InvalidateQueryFilters[];
}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn,
        onSuccess: async () => {
            if (invalidateQueryKeys) {
                for (const key of invalidateQueryKeys) {
                    await queryClient.invalidateQueries(key);
                }
                if (onSuccess) {
                    await onSuccess();
                }
            }
        },
    });
};

const createQuery = <TQueryFnData, TError, TData>({
    queryKey,
    queryFn,
    queryOptions,
}: {
    queryKey: any[];
    queryFn: QueryFunction<TQueryFnData>;
    queryOptions?: Omit<UseQueryOptions<TQueryFnData, TError, TData>, 'queryKey' | 'queryFn'>;
}) => {
    return useQuery<TQueryFnData, TError, TData>({
        queryKey,
        queryFn,
        ...queryOptions,
    });
};

export { createMutation, createQuery, mutationApi };
`;
    fs.writeFileSync(tanstackPath, tanstackContent);
  }

  /**
   * Create frontend interfaces
   */
  private async createFrontendInterfaces(projectRoot: string): Promise<void> {
    // Create directories
    const interfacesDir = path.join(projectRoot, 'resources/js/Support/Interfaces');
    if (!fs.existsSync(interfacesDir)) {
      fs.mkdirSync(interfacesDir, { recursive: true });
    }
    
    const modelsDir = path.join(interfacesDir, 'Models');
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }
    
    const resourcesDir = path.join(interfacesDir, 'Resources');
    if (!fs.existsSync(resourcesDir)) {
      fs.mkdirSync(resourcesDir, { recursive: true });
    }
    
    const othersDir = path.join(interfacesDir, 'Others');
    if (!fs.existsSync(othersDir)) {
      fs.mkdirSync(othersDir, { recursive: true });
    }
    
    // Create base model interface
    const modelInterfacePath = path.join(modelsDir, 'Model.ts');
    const modelInterfaceContent = `export interface Model {
    id: number;
    created_at?: string | null;
    updated_at?: string | null;
}`;
    fs.writeFileSync(modelInterfacePath, modelInterfaceContent);
    
    const modelIndexPath = path.join(modelsDir, 'index.ts');
    fs.writeFileSync(modelIndexPath, "export * from './Model';\n");
    
    // Create base resource interface
    const resourceInterfacePath = path.join(resourcesDir, 'Resource.ts');
    const resourceInterfaceContent = `import { Model } from '../Models/Model';

export interface Resource extends Model {
    // Base resource properties
}`;
    fs.writeFileSync(resourceInterfacePath, resourceInterfaceContent);
    
    const resourceIndexPath = path.join(resourcesDir, 'index.ts');
    fs.writeFileSync(resourceIndexPath, "export * from './Resource';\n");
    
    // Create other interfaces 
    const genericBreadcrumbPath = path.join(othersDir, 'GenericBreadcrumbItem.ts');
    const genericBreadcrumbContent = `export interface GenericBreadcrumbItem {
    name: string;
    link: string;
    icon?: string;
    active?: boolean;
}`;
    fs.writeFileSync(genericBreadcrumbPath, genericBreadcrumbContent);
    
    // Create ServiceFilterOptions interface
    const serviceFilterOptionsPath = path.join(othersDir, 'ServiceFilterOptions.ts');
    const serviceFilterOptionsContent = `import { Model } from '../Models/Model';

export interface ServiceFilterOptions<T extends Model | undefined = undefined> {
    page?: number;
    page_size?: number | 'all';
    sortBy?: T extends Model
        ? Array<[keyof T | string, 'asc' | 'desc']>
        : Array<[string, 'asc' | 'desc']>; 
    search?: string;
    relations?: string; 
    relations_count?: string;
    column_filters?: T extends Model
        ? {
              [K in keyof T]?: any;
          } & Record<string, any>
        : Record<string, any>;

    [key: string]: any; // Allow for additional filter options
}`;
    fs.writeFileSync(serviceFilterOptionsPath, serviceFilterOptionsContent);
    
    // Create pagination interfaces
    const paginateMetaLinkPath = path.join(othersDir, 'PaginateMetaLink.ts');
    const paginateMetaLinkContent = `export interface PaginateMetaLink {
    active: boolean;
    label: string;
    url: string;
}`;
    fs.writeFileSync(paginateMetaLinkPath, paginateMetaLinkContent);
    
    const paginateMetaPath = path.join(othersDir, 'PaginateMeta.ts');
    const paginateMetaContent = `import { PaginateMetaLink } from './PaginateMetaLink';

export interface PaginateMeta {
    current_page?: number;
    from?: number;
    last_page?: number;
    links?: PaginateMetaLink[];
    path?: string;
    per_page?: number;
    to?: number;
    total?: number;
}`;
    fs.writeFileSync(paginateMetaPath, paginateMetaContent);
    
    const paginateResponsePath = path.join(othersDir, 'PaginateResponse.ts');
    const paginateResponseContent = `import { PaginateMeta } from './PaginateMeta';

export interface PaginateResponse<Resource> {
    data?: Resource[];
    meta?: PaginateMeta;
}`;
    fs.writeFileSync(paginateResponsePath, paginateResponseContent);
    
    // Create ServiceHooksFactory interface
    const serviceHooksFactoryPath = path.join(othersDir, 'ServiceHooksFactory.ts');
    const serviceHooksFactoryContent = `import { PaginateResponse } from './PaginateResponse';
import { ServiceFilterOptions } from './ServiceFilterOptions';
import { Resource } from '../Resources/Resource';
import type {
    UseMutationOptions as ReactQueryUseMutationOptions,
    UseQueryOptions,
} from '@tanstack/react-query';
import { AxiosRequestConfig } from 'axios';

export interface ServiceHooks {
    baseRoute: string;
    baseKey?: string;
}

export interface DefaultOptions<T = unknown> {
    axiosRequestConfig?: AxiosRequestConfig;
    useQueryOptions?: UseQueryOptions<T>;
}

export interface DefaultMutationOptions<
    TData = unknown,
    TError = unknown,
    TVariables = void,
    TContext = unknown,
> extends Omit<DefaultOptions, 'useQueryOptions'> {
    useMutationOptions?: ReactQueryUseMutationOptions<TData, TError, TVariables, TContext>;
}

export interface UseGetAllOptions<T> extends DefaultOptions<PaginateResponse<T>> {
    filters?: ServiceFilterOptions;
}

export interface UseGetOptions<T> extends DefaultOptions<T> {
    id: number;
}

export interface UseCreateOptions<T extends Resource>
    extends DefaultMutationOptions<Partial<T>, Error, { data: Partial<T> }> {}

export interface UseUpdateOptions<T extends Resource>
    extends DefaultMutationOptions<Partial<T>, Error, { id: number; data: Partial<T> }> {}

export interface UseDeleteOptions<T extends Resource>
    extends DefaultMutationOptions<Partial<T>, Error, { id: number }> {}`;
    fs.writeFileSync(serviceHooksFactoryPath, serviceHooksFactoryContent);
    
    // Create other interfaces index
    const othersIndexPath = path.join(othersDir, 'index.ts');
    const othersIndexContent = `export * from './GenericBreadcrumbItem';
export * from './PaginateMeta';
export * from './PaginateMetaLink';
export * from './PaginateResponse';
export * from './ServiceFilterOptions';
export * from './ServiceHooksFactory';`;
    fs.writeFileSync(othersIndexPath, othersIndexContent);
    
    // Create constants directory and routes
    const constantsDir = path.join(projectRoot, 'resources/js/Support/Constants');
    if (!fs.existsSync(constantsDir)) {
      fs.mkdirSync(constantsDir, { recursive: true });
    }
    
    const routesPath = path.join(constantsDir, 'routes.ts');
    const routesContent = `export const ROUTES = {
    // Application routes
    DASHBOARD: 'dashboard',
    USERS: 'users',
    // Add your routes here
};`;
    
    if (!fs.existsSync(routesPath)) {
      fs.writeFileSync(routesPath, routesContent);
    }
  }

  /**
   * Get project root from config or workspace
   */
  private getProjectRoot(customPath: string): string {
    if (customPath) {
      // Handle relative paths
      if (!path.isAbsolute(customPath)) {
        // Get workspace folder as the base for relative paths
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
          throw new Error('Cannot resolve relative path: No workspace folder is open');
        }
        
        // Join workspace path with the relative path
        const resolvedPath = path.join(workspaceFolders[0].uri.fsPath, customPath);
        if (fs.existsSync(resolvedPath)) {
          return resolvedPath;
        }
        throw new Error(`The relative path "${customPath}" could not be resolved from the current workspace`);
      }
      
      // For absolute paths, check if they exist
      if (fs.existsSync(customPath)) {
        return customPath;
      }
      throw new Error(`The path "${customPath}" does not exist`);
    }
    
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folder or Laravel project path found');
    }
    
    const projectRoot = workspaceFolders[0].uri.fsPath;
    
    // Validate Laravel project
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
}
