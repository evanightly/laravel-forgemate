import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TemplateEngine } from '../engine/TemplateEngine';

export class ProjectInitializer {
  constructor(
    private context: vscode.ExtensionContext,
    private templateEngine: TemplateEngine
  ) {}

  /**
   * Initialize a Laravel project with service repository pattern base files
   */
  public async initialize(): Promise<void> {
    const config = vscode.workspace.getConfiguration('laravelForgemate');
    const laravelProjectPath = config.get<string>('laravelProjectPath', '');
    
    const projectRoot = this.getProjectRoot(laravelProjectPath);
    
    // Ensure the project is a Laravel project
    this.validateLaravelProject(projectRoot);
    
    // Create necessary base files and directories
    await this.initializeBackend(projectRoot);
    await this.initializeFrontend(projectRoot);
    await this.synchronizeStubs();
  }

  /**
   * Synchronize stub files to the project
   */
  public async synchronizeStubs(): Promise<void> {
    const config = vscode.workspace.getConfiguration('laravelForgemate');
    const laravelProjectPath = config.get<string>('laravelProjectPath', '');
    const stubsDirectory = config.get<string>('stubsDirectory', 'stubs/scaffold');
    
    const projectRoot = this.getProjectRoot(laravelProjectPath);
    const targetStubsDirectory = path.join(projectRoot, stubsDirectory);
    
    // Create stubs directory if it doesn't exist
    if (!fs.existsSync(targetStubsDirectory)) {
      fs.mkdirSync(targetStubsDirectory, { recursive: true });
    }
    
    // Copy default stubs to project
    const defaultStubsDirectory = this.context.asAbsolutePath('resources/stubs');
    
    this.copyDirectory(defaultStubsDirectory, targetStubsDirectory);
    
    return Promise.resolve();
  }

  /**
   * Initialize backend service repository pattern files
   */
  private async initializeBackend(projectRoot: string): Promise<void> {
    // Create necessary directories
    const directories = [
      'app/Repositories',
      'app/Services',
      'app/Traits/Repositories',
      'app/Traits/Services',
      'app/Support/Interfaces/Repositories',
      'app/Support/Interfaces/Services',
      'app/Traits/Resources/JsonResource'
    ];
    
    directories.forEach(dir => {
      const fullPath = path.join(projectRoot, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
    
    // Create base repository interface
    await this.createBaseRepositoryInterface(projectRoot);
    
    // Create base repository implementation
    await this.createBaseRepository(projectRoot);
    
    // Create repository service provider
    await this.createRepositoryServiceProvider(projectRoot);
    
    // Create traits
    await this.createBackendTraits(projectRoot);
    
    // Create IntentEnum.php
    await this.createIntentEnum(projectRoot);
    
    // Create Permission enum
    await this.createPermissionEnum(projectRoot);
  }

  /**
   * Initialize frontend files for service repository pattern
   */
  private async initializeFrontend(projectRoot: string): Promise<void> {
    // Create necessary directories
    const directories = [
      'resources/js/Services',
      'resources/js/Support/Interfaces/Models',
      'resources/js/Support/Interfaces/Resources',
      'resources/js/Support/Interfaces/Others',
      'resources/js/Support/Constants',
      'resources/js/Helpers'
    ];
    
    directories.forEach(dir => {
      const fullPath = path.join(projectRoot, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
    
    // Create service hooks factory
    await this.createServiceHooksFactory(projectRoot);
    
    // Create model interface
    await this.createModelInterface(projectRoot);
    
    // Create resource interface
    await this.createResourceInterface(projectRoot);
    
    // Create routes
    await this.createRoutes(projectRoot);
    
    // Create helpers
    await this.createHelpers(projectRoot);
    
    // Create support interfaces
    await this.createSupportInterfaces(projectRoot);

    // Setup vite plugins for enum generation
    await this.setupVitePlugins(projectRoot);
  }

  /**
   * Create BaseRepositoryInterface file
   */
  private async createBaseRepositoryInterface(projectRoot: string): Promise<void> {
    try {
      const filePath = path.join(projectRoot, 'app/Support/Interfaces/Repositories/BaseRepositoryInterface.php');
      
      if (!fs.existsSync(filePath)) {
        const content = await this.templateEngine.getStubContent('backend/base-repository-interface');
        fs.writeFileSync(filePath, content);
      }
    } catch (error) {
      console.error('Error creating BaseRepositoryInterface:', error);
    }
  }

  /**
   * Create BaseRepository file
   */
  private async createBaseRepository(projectRoot: string): Promise<void> {
    try {
      const filePath = path.join(projectRoot, 'app/Repositories/BaseRepository.php');
      
      if (!fs.existsSync(filePath)) {
        const content = await this.templateEngine.getStubContent('backend/base-repository');
        fs.writeFileSync(filePath, content);
      }
    } catch (error) {
      console.error('Error creating BaseRepository:', error);
    }
  }

  /**
   * Create RepositoryServiceProvider file
   */
  private async createRepositoryServiceProvider(projectRoot: string): Promise<void> {
    try {
      const filePath = path.join(projectRoot, 'app/Providers/RepositoryServiceProvider.php');
      
      if (!fs.existsSync(filePath)) {
        const content = await this.templateEngine.getStubContent('backend/repository-service-provider');
        fs.writeFileSync(filePath, content);
        
        // Register the service provider in config/app.php
        this.registerServiceProvider(projectRoot);
      }
    } catch (error) {
      console.error('Error creating RepositoryServiceProvider:', error);
    }
  }

  /**
   * Create IntentEnum file
   */
  private async createIntentEnum(projectRoot: string): Promise<void> {
    try {
      const filePath = path.join(projectRoot, 'app/Support/Enums/IntentEnum.php');
      const dirPath = path.dirname(filePath);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      if (!fs.existsSync(filePath)) {
        const content = await this.templateEngine.getStubContent('backend/enums/intent-enum');
        fs.writeFileSync(filePath, content);
      }
    } catch (error) {
      console.error('Error creating IntentEnum:', error);
    }
  }
  
  /**
   * Create PermissionEnum file
   */
  private async createPermissionEnum(projectRoot: string): Promise<void> {
    try {
      const filePath = path.join(projectRoot, 'app/Support/Enums/PermissionEnum.php');
      const dirPath = path.dirname(filePath);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      if (!fs.existsSync(filePath)) {
        const content = await this.templateEngine.getStubContent('backend/enums/permission-enum');
        fs.writeFileSync(filePath, content);
      }
    } catch (error) {
      console.error('Error creating PermissionEnum:', error);
    }
  }

  /**
   * Register the RepositoryServiceProvider in config/app.php
   */
  private registerServiceProvider(projectRoot: string): void {
    try {
      const appConfigPath = path.join(projectRoot, 'config/app.php');
      
      if (fs.existsSync(appConfigPath)) {
        let content = fs.readFileSync(appConfigPath, 'utf-8');
        
        // Check if the provider is already registered
        if (!content.includes('App\\Providers\\RepositoryServiceProvider::class')) {
          // Find the providers array
          const providersRegex = /'providers'\s*=>\s*\[([\s\S]*?)\]/m;
          const match = content.match(providersRegex);
          
          if (match && match[1]) {
            // Add our provider to the end of the array
            const newContent = content.replace(
              providersRegex,
              (fullMatch, providersContent) => {
                // Check if the last line already has a comma
                const lastLine = providersContent.trim().split('\n').pop()?.trim();
                const comma = lastLine && lastLine.endsWith(',') ? '' : ',';
                
                return fullMatch.replace(
                  ']',
                  `${comma}\n        App\\Providers\\RepositoryServiceProvider::class,\n    ]`
                );
              }
            );
            
            fs.writeFileSync(appConfigPath, newContent);
          }
        }
      }
    } catch (error) {
      console.error('Error registering service provider:', error);
    }
  }

  /**
   * Create backend traits files
   */
  private async createBackendTraits(projectRoot: string): Promise<void> {
    // Repository traits
    const repositoryTraits = [
      { name: 'HandlesFiltering', stub: 'backend/traits/repositories/handles-filtering' },
      { name: 'HandlesRelations', stub: 'backend/traits/repositories/handles-relations' },
      { name: 'HandlesSorting', stub: 'backend/traits/repositories/handles-sorting' },
      { name: 'RelationQueryable', stub: 'backend/traits/repositories/relation-queryable' }
    ];
    
    for (const trait of repositoryTraits) {
      const filePath = path.join(projectRoot, `app/Traits/Repositories/${trait.name}.php`);
      
      if (!fs.existsSync(filePath)) {
        try {
          const content = await this.templateEngine.getStubContent(trait.stub);
          fs.writeFileSync(filePath, content);
        } catch (error) {
          console.error(`Error creating ${trait.name}:`, error);
        }
      }
    }
    
    // Service traits
    const serviceTraits = [
      { name: 'HandlesPageSizeAll', stub: 'backend/traits/services/handles-page-size-all' }
    ];
    
    for (const trait of serviceTraits) {
      const filePath = path.join(projectRoot, `app/Traits/Services/${trait.name}.php`);
      
      if (!fs.existsSync(filePath)) {
        try {
          const content = await this.templateEngine.getStubContent(trait.stub);
          fs.writeFileSync(filePath, content);
        } catch (error) {
          console.error(`Error creating ${trait.name}:`, error);
        }
      }
    }
    
    // JsonResource traits
    const jsonResourceTraits = [
      { name: 'HandlesResourceDataSelection', stub: 'backend/traits/json_resource/handles-resource-data-selection' }
    ];
    
    for (const trait of jsonResourceTraits) {
      const filePath = path.join(projectRoot, `app/Traits/Resources/JsonResource/${trait.name}.php`);
      
      if (!fs.existsSync(filePath)) {
        try {
          const content = await this.templateEngine.getStubContent(trait.stub);
          fs.writeFileSync(filePath, content);
        } catch (error) {
          console.error(`Error creating ${trait.name}:`, error);
        }
      }
    }
  }

  /**
   * Create ServiceHooksFactory file
   */
  private async createServiceHooksFactory(projectRoot: string): Promise<void> {
    try {
      const filePath = path.join(projectRoot, 'resources/js/Services/serviceHooksFactory.ts');
      
      if (!fs.existsSync(filePath)) {
        const content = await this.templateEngine.getStubContent('frontend/service-hooks-factory');
        fs.writeFileSync(filePath, content);
      }
    } catch (error) {
      console.error('Error creating ServiceHooksFactory:', error);
    }
  }

  /**
   * Create Model interface file
   */
  private async createModelInterface(projectRoot: string): Promise<void> {
    try {
      const filePath = path.join(projectRoot, 'resources/js/Support/Interfaces/Models/Model.ts');
      const indexPath = path.join(projectRoot, 'resources/js/Support/Interfaces/Models/index.ts');
      
      if (!fs.existsSync(filePath)) {
        const content = await this.templateEngine.getStubContent('frontend/model-interface');
        fs.writeFileSync(filePath, content);
      }
      
      if (!fs.existsSync(indexPath)) {
        fs.writeFileSync(indexPath, "export * from './Model';\n");
      }
    } catch (error) {
      console.error('Error creating Model interface:', error);
    }
  }

  /**
   * Create Resource interface file
   */
  private async createResourceInterface(projectRoot: string): Promise<void> {
    try {
      const filePath = path.join(projectRoot, 'resources/js/Support/Interfaces/Resources/Resource.ts');
      const indexPath = path.join(projectRoot, 'resources/js/Support/Interfaces/Resources/index.ts');
      
      if (!fs.existsSync(filePath)) {
        const content = await this.templateEngine.getStubContent('frontend/resource-interface');
        fs.writeFileSync(filePath, content);
      }
      
      if (!fs.existsSync(indexPath)) {
        fs.writeFileSync(indexPath, "export * from './Resource';\n");
      }
    } catch (error) {
      console.error('Error creating Resource interface:', error);
    }
  }

  /**
   * Create Routes file
   */
  private async createRoutes(projectRoot: string): Promise<void> {
    try {
      const filePath = path.join(projectRoot, 'resources/js/Support/Constants/routes.ts');
      
      if (!fs.existsSync(filePath)) {
        const content = await this.templateEngine.getStubContent('frontend/routes');
        fs.writeFileSync(filePath, content);
      }
    } catch (error) {
      console.error('Error creating Routes:', error);
    }
  }

  /**
   * Create Helper files
   */
  private async createHelpers(projectRoot: string): Promise<void> {
    const helpers = [
      { name: 'addRippleEffect', stub: 'frontend/helpers/add-ripple-effect' },
      { name: 'generateDynamicBreadcrumbs', stub: 'frontend/helpers/generate-dynamic-breadcrumbs' },
      { name: 'generateServiceHooksFactoryQueryKey', stub: 'frontend/helpers/generate-service-hooks-factory-query-key' },
      { name: 'tanstackQueryHelpers', stub: 'frontend/helpers/tanstack-query-helpers' }
    ];
    
    for (const helper of helpers) {
      const filePath = path.join(projectRoot, `resources/js/Helpers/${helper.name}.ts`);
      
      if (!fs.existsSync(filePath)) {
        try {
          const content = await this.templateEngine.getStubContent(helper.stub);
          fs.writeFileSync(filePath, content);
        } catch (error) {
          console.error(`Error creating ${helper.name}:`, error);
        }
      }
    }
    
    // Create index file to export all helpers
    const indexPath = path.join(projectRoot, 'resources/js/Helpers/index.ts');
    
    if (!fs.existsSync(indexPath)) {
      const exports = helpers.map(h => `export * from './${h.name}';`).join('\n');
      fs.writeFileSync(indexPath, exports + '\n');
    }
  }

  /**
   * Create Support Interface files
   */
  private async createSupportInterfaces(projectRoot: string): Promise<void> {
    const interfaceItems = [
      { name: 'GenericBreadcrumbItem', stub: 'frontend/others/generic-breadcrumb-item' },
      { name: 'PaginateMeta', stub: 'frontend/others/paginate-meta' },
      { name: 'PaginateMetaLink', stub: 'frontend/others/paginate-meta-link' },
      { name: 'PaginateResponse', stub: 'frontend/others/paginate-response' },
      { name: 'ServiceFilterOptions', stub: 'frontend/others/service-filter-options' },
      { name: 'ServiceHooksFactory', stub: 'frontend/others/service-hooks-factory' }
    ];
    
    for (const item of interfaceItems) {
      const filePath = path.join(projectRoot, `resources/js/Support/Interfaces/Others/${item.name}.ts`);
      
      if (!fs.existsSync(filePath)) {
        try {
          const content = await this.templateEngine.getStubContent(item.stub);
          fs.writeFileSync(filePath, content);
        } catch (error) {
          console.error(`Error creating ${item.name}:`, error);
        }
      }
    }
    
    // Create index file to export all interfaces
    const indexPath = path.join(projectRoot, 'resources/js/Support/Interfaces/Others/index.ts');
    
    if (!fs.existsSync(indexPath)) {
      const exports = interfaceItems.map(i => `export * from './${i.name}';`).join('\n');
      fs.writeFileSync(indexPath, exports + '\n');
    }
  }

  /**
   * Setup Vite plugins for enum generation
   */
  private async setupVitePlugins(projectRoot: string): Promise<void> {
    const vitePluginsDir = path.join(projectRoot, 'vite_plugins');
    const viteLibDir = path.join(vitePluginsDir, 'lib');
    
    // Create directories if they don't exist
    if (!fs.existsSync(vitePluginsDir)) {
      fs.mkdirSync(vitePluginsDir, { recursive: true });
    }
    
    if (!fs.existsSync(viteLibDir)) {
      fs.mkdirSync(viteLibDir, { recursive: true });
    }
    
    // Create utility libraries
    const libFiles = [
      { name: 'colors', stub: 'frontend/vite_plugins/lib/colors' },
      { name: 'generatePrefixText', stub: 'frontend/vite_plugins/lib/generate-prefix-text' },
      { name: 'getCurrentTimestamp', stub: 'frontend/vite_plugins/lib/get-current-timestamp' }
    ];
    
    for (const lib of libFiles) {
      const filePath = path.join(viteLibDir, `${lib.name}.js`);
      
      if (!fs.existsSync(filePath)) {
        try {
          const content = await this.templateEngine.getStubContent(lib.stub);
          fs.writeFileSync(filePath, content);
        } catch (error) {
          console.error(`Error creating ${lib.name}:`, error);
        }
      }
    }
    
    // Create plugin files
    const plugins = [
      { name: 'checkRoutesOverridePlugin', stub: 'frontend/vite_plugins/check-routes-override-plugin' },
      { name: 'transformIntentEnumPlugin', stub: 'frontend/vite_plugins/transform-intent-enum-plugin' }
    ];
    
    for (const plugin of plugins) {
      const filePath = path.join(vitePluginsDir, `${plugin.name}.js`);
      
      if (!fs.existsSync(filePath)) {
        try {
          const content = await this.templateEngine.getStubContent(plugin.stub);
          fs.writeFileSync(filePath, content);
        } catch (error) {
          console.error(`Error creating ${plugin.name}:`, error);
        }
      }
    }
    
    // Update vite.config.ts if it exists
    this.updateViteConfig(projectRoot);
  }

  /**
   * Update Vite config to include our plugins
   */
  private updateViteConfig(projectRoot: string): void {
    try {
      const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
      
      if (fs.existsSync(viteConfigPath)) {
        let content = fs.readFileSync(viteConfigPath, 'utf-8');
        
        // Check if our plugins are already included
        if (!content.includes('transformIntentEnumPlugin')) {
          // Check for plugins section in the configuration
          if (content.includes('plugins: [')) {
            const newContent = content.replace(
              'plugins: [',
              `plugins: [
    transformIntentEnumPlugin(),
    checkRoutesOverridePlugin(),`
            );
            
            // Add imports if needed
            if (!content.includes('import transformIntentEnumPlugin')) {
              const importStr = `import transformIntentEnumPlugin from './vite_plugins/transformIntentEnumPlugin';\nimport checkRoutesOverridePlugin from './vite_plugins/checkRoutesOverridePlugin';\n`;
              
              // Find a good place to add imports
              if (content.includes('import { defineConfig }')) {
                newContent.replace(
                  'import { defineConfig }',
                  importStr + 'import { defineConfig }'
                );
              } else {
                // Just add at the beginning
                const updatedContent = importStr + newContent;
                fs.writeFileSync(viteConfigPath, updatedContent);
                return;
              }
            }
            
            fs.writeFileSync(viteConfigPath, newContent);
          }
        }
      }
    } catch (error) {
      console.error('Error updating Vite config:', error);
    }
  }

  /**
   * Get the project root directory
   */
  private getProjectRoot(customPath: string): string {
    if (customPath && fs.existsSync(customPath)) {
      return customPath;
    }
    
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folder or Laravel project path found');
    }
    
    return workspaceFolders[0].uri.fsPath;
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
   * Copy directory and its contents recursively
   */
  private copyDirectory(source: string, target: string): void {
    // Check if source exists
    if (!fs.existsSync(source)) {
      return;
    }
    
    // Create target directory if it doesn't exist
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }
    
    // Get all files and directories in the source
    const entries = fs.readdirSync(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively copy directory
        this.copyDirectory(sourcePath, targetPath);
      } else {
        // Copy file if it doesn't exist or force overwrite is enabled
        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(sourcePath, targetPath);
        }
      }
    }
  }
}
