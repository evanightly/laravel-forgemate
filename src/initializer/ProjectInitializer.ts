import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TemplateEngine } from '../engine/TemplateEngine';
import { getProjectRoot, validateLaravelProject } from '../utils/PathUtils';

/**
 * Handles project initialization
 */
export class ProjectInitializer {
  /**
   * Constructor
   */
  constructor(private context: vscode.ExtensionContext, private templateEngine: TemplateEngine) {}

  /**
   * Initialize a new Laravel project with all required files
   */
  public async initialize(): Promise<void> {
    try {
      // Set up initializer stubs directory first
      await this.setupInitializerStubs();
      
      // Read configuration
      const config = vscode.workspace.getConfiguration('laravelForgemate');
      const laravelProjectPath = config.get<string>('laravelProjectPath', '');
      
      // Get project root
      const projectRoot = getProjectRoot(laravelProjectPath, validateLaravelProject);
      
      // Create backend files
      await this.createBackendFiles(projectRoot);
      
      // Create frontend files
      await this.createFrontendFiles(projectRoot);
      
      // Show success message
      vscode.window.showInformationMessage('Laravel project initialized successfully!');
    } catch (error) {
      console.error('Error initializing project:', error);
      
      // Show error message
      vscode.window.showErrorMessage(`Error initializing project: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Setup initializer stubs directory structure
   */
  public async setupInitializerStubs(): Promise<void> {
    try {
      const initializeStubsDir = path.join(this.context.extensionUri.fsPath, 'resources/stubs/initializers');
      
      // Create main initializers directory if it doesn't exist
      if (!fs.existsSync(initializeStubsDir)) {
        fs.mkdirSync(initializeStubsDir, { recursive: true });
      }

      // Create subdirectories for backend files
      const backendDirs = [
        'backend/traits/repositories',
        'backend/traits/services',
        'backend/traits/resources/json_resource',
        'backend/support/enums',
        'backend/support/interfaces/repositories'
      ];

      backendDirs.forEach(dir => {
        const fullPath = path.join(initializeStubsDir, dir);
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
        }
      });

      // Create subdirectories for frontend files
      const frontendDirs = [
        'frontend/support/constants',
        'frontend/support/interfaces/others',
        'frontend/support/interfaces/resources',
        'frontend/support/interfaces/models',
        'frontend/services',
        'frontend/helpers'
      ];

      frontendDirs.forEach(dir => {
        const fullPath = path.join(initializeStubsDir, dir);
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
        }
      });

      return Promise.resolve();
    } catch (error) {
      console.error('Error setting up initializer stubs directory:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Create all backend files
   */
  private async createBackendFiles(projectRoot: string): Promise<void> {
    // Create backend directories
    const backendDirs = [
      'app/Support/Interfaces/Repositories',
      'app/Support/Interfaces/Services',
      'app/Services',
      'app/Repositories',
      'app/Support/Enums',
      'app/Traits/Repositories',
      'app/Traits/Services',
      'app/Traits/Resources/JsonResource'
    ];

    backendDirs.forEach(dir => {
      const dirPath = path.join(projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });

    // Create base repository files
    await this.createBaseRepositoryInterface(projectRoot);
    await this.createBaseRepository(projectRoot);
    await this.createRepositoryServiceProvider(projectRoot);
    
    // Create traits
    await this.createBackendTraits(projectRoot);
    
    // Create enums
    await this.createIntentEnum(projectRoot);
    await this.createPermissionEnum(projectRoot);
  }

  /**
   * Create all frontend files
   */
  private async createFrontendFiles(projectRoot: string): Promise<void> {
    // Get configuration
    const config = vscode.workspace.getConfiguration('laravelForgemate');
    
    // Get custom frontend paths from configuration, with defaults if not specified
    const modelsPath = config.get<string>('frontendModelsPath', 'resources/js/Support/Interfaces/Models');
    const resourcesPath = config.get<string>('frontendResourcesPath', 'resources/js/Support/Interfaces/Resources');
    const othersPath = config.get<string>('frontendOthersPath', 'resources/js/Support/Interfaces/Others');
    const constantsPath = config.get<string>('frontendConstantsPath', 'resources/js/Support/Constants');
    const servicesPath = config.get<string>('frontendServicesPath', 'resources/js/Services');
    const helpersPath = config.get<string>('frontendHelpersPath', 'resources/js/Helpers');
    
    // Create directories for each path
    const frontendDirs = [
      modelsPath,
      resourcesPath,
      othersPath,
      constantsPath,
      servicesPath,
      helpersPath
    ];

    frontendDirs.forEach(dir => {
      const dirPath = path.join(projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });

    // Create frontend model interfaces
    await this.createModelInterfaces(projectRoot, modelsPath);
    
    // Create frontend resource interfaces
    await this.createResourceInterfaces(projectRoot, resourcesPath);
    
    // Create other interfaces
    await this.createOtherInterfaces(projectRoot, othersPath);
    
    // Create constants
    await this.createConstants(projectRoot, constantsPath);
    
    // Create service hooks factory
    await this.createServiceHooksFactory(projectRoot, servicesPath);
    
    // Create helpers
    await this.createHelpers(projectRoot, helpersPath);
  }
  
  /**
   * Create base repository interface
   */
  public async createBaseRepositoryInterface(projectRoot: string): Promise<void> {
    try {
      const dirPath = path.join(projectRoot, 'app/Support/Interfaces/Repositories');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      const filePath = path.join(dirPath, 'BaseRepositoryInterface.php');
      
      if (!fs.existsSync(filePath)) {
        const content = await this.templateEngine.getStubContent('initializers/backend/base-repository-interface');
        fs.writeFileSync(filePath, content);
      }
    } catch (error) {
      console.error('Error creating BaseRepositoryInterface:', error);
      throw error;
    }
  }
  
  /**
   * Create base repository
   */
  public async createBaseRepository(projectRoot: string): Promise<void> {
    try {
      const dirPath = path.join(projectRoot, 'app/Repositories');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      const filePath = path.join(dirPath, 'BaseRepository.php');
      
      if (!fs.existsSync(filePath)) {
        const content = await this.templateEngine.getStubContent('initializers/backend/base-repository');
        fs.writeFileSync(filePath, content);
      }
    } catch (error) {
      console.error('Error creating BaseRepository:', error);
      throw error;
    }
  }
  
  /**
   * Create repository service provider
   */
  public async createRepositoryServiceProvider(projectRoot: string): Promise<void> {
    try {
      const dirPath = path.join(projectRoot, 'app/Providers');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      const filePath = path.join(dirPath, 'RepositoryServiceProvider.php');
      
      if (!fs.existsSync(filePath)) {
        const content = await this.templateEngine.getStubContent('initializers/backend/repository-service-provider');
        fs.writeFileSync(filePath, content);
        
        // Register the service provider in config/app.php
        this.registerServiceProvider(projectRoot);
      }
    } catch (error) {
      console.error('Error creating RepositoryServiceProvider:', error);
      throw error;
    }
  }

  /**
   * Register service provider in config/app.php
   */
  private registerServiceProvider(projectRoot: string): void {
    try {
      const configAppPath = path.join(projectRoot, 'config/app.php');
      if (!fs.existsSync(configAppPath)) {
        return;
      }

      let content = fs.readFileSync(configAppPath, 'utf-8');

      // Check if provider is already registered
      if (content.includes('App\\Providers\\RepositoryServiceProvider::class')) {
        return;
      }

      // Find the providers array
      const providersMatch = content.match(/'providers'\s*=>\s*\[([\s\S]*?)\]/);
      if (!providersMatch || !providersMatch[1]) {
        return;
      }

      // Replace the end of providers array with our provider
      const lastProviderMatch = providersMatch[1].match(/.*?,(\s*)$/);
      if (lastProviderMatch) {
        const indent = lastProviderMatch[1];
        const replacement = `        App\\Providers\\RepositoryServiceProvider::class,${indent}`;
        content = content.replace(/.*?,(\s*)$/m, `$&${replacement}`);
        fs.writeFileSync(configAppPath, content);
      }
    } catch (error) {
      console.error('Error registering service provider:', error);
    }
  }

  /**
   * Create backend traits files
   */
  public async createBackendTraits(projectRoot: string): Promise<void> {
    const traits = [
      { dir: 'app/Traits/Repositories', name: 'HandlesFiltering', stub: 'initializers/backend/traits/repositories/handles-filtering' },
      { dir: 'app/Traits/Repositories', name: 'HandlesRelations', stub: 'initializers/backend/traits/repositories/handles-relations' },
      { dir: 'app/Traits/Repositories', name: 'HandlesSorting', stub: 'initializers/backend/traits/repositories/handles-sorting' },
      { dir: 'app/Traits/Repositories', name: 'RelationQueryable', stub: 'initializers/backend/traits/repositories/relation-queryable' },
      { dir: 'app/Traits/Services', name: 'HandlesFileUpload', stub: 'initializers/backend/traits/services/handles-file-upload' },
      { dir: 'app/Traits/Services', name: 'HandlesPageSizeAll', stub: 'initializers/backend/traits/services/handles-page-size-all' },
      { dir: 'app/Traits/Resources/JsonResource', name: 'HandlesResourceDataSelection', stub: 'initializers/backend/traits/resources/json_resource/handles-resource-data-selection' }
    ];

    for (const trait of traits) {
      const filePath = path.join(projectRoot, `${trait.dir}/${trait.name}.php`);
      const dirPath = path.dirname(filePath);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
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
   * Create intent enum file
   */
  public async createIntentEnum(projectRoot: string): Promise<void> {
    const filePath = path.join(projectRoot, 'app/Support/Enums/IntentEnum.php');
    const dirPath = path.dirname(filePath);
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    if (!fs.existsSync(filePath)) {
      try {
        const content = await this.templateEngine.getStubContent('initializers/backend/support/enums/intent-enum');
        fs.writeFileSync(filePath, content);
      } catch (error) {
        console.error('Error creating IntentEnum:', error);
      }
    }
  }
  
  /**
   * Create permission enum file
   */
  public async createPermissionEnum(projectRoot: string): Promise<void> {
    const filePath = path.join(projectRoot, 'app/Support/Enums/PermissionEnum.php');
    const dirPath = path.dirname(filePath);
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    if (!fs.existsSync(filePath)) {
      try {
        const content = await this.templateEngine.getStubContent('initializers/backend/support/enums/permission-enum');
        fs.writeFileSync(filePath, content);
      } catch (error) {
        console.error('Error creating PermissionEnum:', error);
      }
    }
  }

  /**
   * Create model interfaces
   */
  private async createModelInterfaces(projectRoot: string, modelsPath: string): Promise<void> {
    // Create base model interface
    const baseModelPath = path.join(projectRoot, modelsPath, 'Model.ts');
    if (!fs.existsSync(baseModelPath)) {
      const content = await this.templateEngine.getStubContent('initializers/frontend/support/interfaces/models/model');
      fs.writeFileSync(baseModelPath, content);
    }

    // Create index file
    const indexPath = path.join(projectRoot, modelsPath, 'index.ts');
    if (!fs.existsSync(indexPath)) {
      const content = await this.templateEngine.getStubContent('initializers/frontend/support/interfaces/models/index');
      fs.writeFileSync(indexPath, content);
    }
  }

  /**
   * Create resource interfaces
   */
  private async createResourceInterfaces(projectRoot: string, resourcesPath: string): Promise<void> {
    // Create base resource interface
    const baseResourcePath = path.join(projectRoot, resourcesPath, 'Resource.ts');
    if (!fs.existsSync(baseResourcePath)) {
      const content = await this.templateEngine.getStubContent('initializers/frontend/support/interfaces/resources/resource');
      fs.writeFileSync(baseResourcePath, content);
    }

    // Create index file
    const indexPath = path.join(projectRoot, resourcesPath, 'index.ts');
    if (!fs.existsSync(indexPath)) {
      const content = await this.templateEngine.getStubContent('initializers/frontend/support/interfaces/resources/index');
      fs.writeFileSync(indexPath, content);
    }
  }

  /**
   * Create other interfaces
   */
  private async createOtherInterfaces(projectRoot: string, othersPath: string): Promise<void> {
    const interfaces = [
      { name: 'PaginateMeta', stub: 'initializers/frontend/support/interfaces/others/paginate-meta' },
      { name: 'PaginateMetaLink', stub: 'initializers/frontend/support/interfaces/others/paginate-meta-link' },
      { name: 'PaginateResponse', stub: 'initializers/frontend/support/interfaces/others/paginate-response' },
      { name: 'ServiceFilterOptions', stub: 'initializers/frontend/support/interfaces/others/service-filter-options' },
      { name: 'ServiceHooksFactory', stub: 'initializers/frontend/support/interfaces/others/service-hooks-factory' },
      { name: 'GenericBreadcrumbItem', stub: 'initializers/frontend/support/interfaces/others/generic-breadcrumb-item' },
      { name: 'DashboardMenuItem', stub: 'initializers/frontend/support/interfaces/others/dashboard-menu-item' },
    ];

    for (const item of interfaces) {
      const filePath = path.join(projectRoot, othersPath, `${item.name}.ts`);
      const dirPath = path.dirname(filePath);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      if (!fs.existsSync(filePath)) {
        try {
          const content = await this.templateEngine.getStubContent(item.stub);
          fs.writeFileSync(filePath, content);
        } catch (error) {
          console.error(`Error creating ${item.name}:`, error);
        }
      }
    }

    // Create index file
    const indexPath = path.join(projectRoot, othersPath, 'index.ts');
    if (!fs.existsSync(indexPath)) {
      const content = await this.templateEngine.getStubContent('initializers/frontend/support/interfaces/others/index');
      fs.writeFileSync(indexPath, content);
    }
  }

  /**
   * Create constants
   */
  private async createConstants(projectRoot: string, constantsPath: string): Promise<void> {
    const constants = [
      { name: 'routes', stub: 'initializers/frontend/support/constants/routes' },
      { name: 'tanstackQueryKeys', stub: 'initializers/frontend/support/constants/tanstack-query-keys' },
      { name: 'styling', stub: 'initializers/frontend/support/constants/styling' },
      { name: 'permissionValidActions', stub: 'initializers/frontend/support/constants/permission-valid-actions' },
      { name: 'paginationNavigator', stub: 'initializers/frontend/support/constants/pagination-navigator' },
    ];

    for (const constant of constants) {
      const filePath = path.join(projectRoot, constantsPath, `${constant.name}.ts`);
      const dirPath = path.dirname(filePath);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      if (!fs.existsSync(filePath)) {
        try {
          const content = await this.templateEngine.getStubContent(constant.stub);
          fs.writeFileSync(filePath, content);
        } catch (error) {
          console.error(`Error creating ${constant.name}:`, error);
        }
      }
    }
  }
  
  /**
   * Create service hooks factory
   */
  private async createServiceHooksFactory(projectRoot: string, servicesPath: string): Promise<void> {
    const filePath = path.join(projectRoot, servicesPath, 'serviceHooksFactory.ts');
    const dirPath = path.dirname(filePath);
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    if (!fs.existsSync(filePath)) {
      try {
        const content = await this.templateEngine.getStubContent('initializers/frontend/services/service-hooks-factory');
        fs.writeFileSync(filePath, content);
      } catch (error) {
        console.error('Error creating serviceHooksFactory:', error);
      }
    }
  }

  /**
   * Create helpers
   */
  private async createHelpers(projectRoot: string, helpersPath: string): Promise<void> {
    const filePath = path.join(projectRoot, helpersPath, 'index.ts');
    const dirPath = path.dirname(filePath);
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    if (!fs.existsSync(filePath)) {
      try {
        const content = await this.templateEngine.getStubContent('initializers/frontend/helpers/index');
        fs.writeFileSync(filePath, content);
      } catch (error) {
        console.error('Error creating Helpers:', error);
      }
    }
  }

  /**
   * Synchronize stubs from extension to project for customization
   */
  public async synchronizeStubs(targetPath: string): Promise<string[]> {
    try {
      // Create stubs directory in the target project
      const projectStubsDir = path.join(targetPath, 'stubs/scaffold');
      if (!fs.existsSync(projectStubsDir)) {
        fs.mkdirSync(projectStubsDir, { recursive: true });
      }

      // Get the extension's stub directory
      const extensionStubsDir = this.context.asAbsolutePath('resources/stubs');
      
      // Copy all stubs from backend and frontend directories but skip initializers
      const copiedFiles: string[] = [];
      
      // Copy backend stubs (excluding initializers)
      await this.copyStubsFromDirectory(
        path.join(extensionStubsDir, 'backend'), 
        path.join(projectStubsDir, 'backend'),
        copiedFiles
      );
      
      // Copy frontend stubs (excluding initializers)
      await this.copyStubsFromDirectory(
        path.join(extensionStubsDir, 'frontend'), 
        path.join(projectStubsDir, 'frontend'),
        copiedFiles
      );
      
      return copiedFiles;
    } catch (error) {
      console.error('Error synchronizing stubs:', error);
      throw error;
    }
  }
  
  /**
   * Copy stubs from source to destination directory, excluding initializers
   */
  private async copyStubsFromDirectory(sourceDir: string, destDir: string, copiedFiles: string[] = []): Promise<void> {
    if (!fs.existsSync(sourceDir)) {
      return;
    }
    
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Read all files in the source directory
    const files = fs.readdirSync(sourceDir, { withFileTypes: true });
    
    for (const file of files) {
      const sourcePath = path.join(sourceDir, file.name);
      const destPath = path.join(destDir, file.name);
      
      // Skip initializers directory
      if (file.isDirectory() && file.name === 'initializers') {
        continue;
      }
      
      if (file.isDirectory()) {
        // Recursively copy subdirectories
        await this.copyStubsFromDirectory(sourcePath, destPath, copiedFiles);
      } else {
        // Copy stub file
        fs.copyFileSync(sourcePath, destPath);
        copiedFiles.push(destPath);
      }
    }
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
      fs.mkdirSync(modelsDir);
    }
    
    const resourcesDir = path.join(interfacesDir, 'Resources');
    if (!fs.existsSync(resourcesDir)) {
      fs.mkdirSync(resourcesDir);
    }
    
    const othersDir = path.join(interfacesDir, 'Others');
    if (!fs.existsSync(othersDir)) {
      fs.mkdirSync(othersDir);
    }
    
    // Create base model interface
    const modelInterfacePath = path.join(modelsDir, 'Model.ts');
    const modelInterfaceContent = `export interface Model {
    id: number;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
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
    
    const dashboardMenuItemPath = path.join(othersDir, 'DashboardMenuItem.ts');
    const dashboardMenuItemContent = `import { LucideIcon } from 'lucide-react';

export interface BaseMenuItem {
    title: string;
    icon?: LucideIcon;
    permissions?: string[];
}

export interface SingleMenuItem extends BaseMenuItem {
    url: string;
    type: 'menu';
}

export interface DropdownMenuItem extends BaseMenuItem {
    type: 'dropdown';
    items: {
        title: string;
        url: string;
        permissions?: string[];
    }[];
}

export interface MenuGroup {
    type: 'group';
    title: string;
    items: (SingleMenuItem | DropdownMenuItem)[];
}

export type MenuItem = SingleMenuItem | DropdownMenuItem | MenuGroup;`;
    fs.writeFileSync(dashboardMenuItemPath, dashboardMenuItemContent);
    
    // Create the other interface files as needed
    const paginateMetaPath = path.join(othersDir, 'PaginateMeta.ts');
    const paginateMetaContent = `import { PaginateMetaLink } from './PaginateMetaLink';

export interface PaginateMeta {
    current_page: number;
    from: number;
    last_page: number;
    links: PaginateMetaLink[];
    path: string;
    per_page: number;
    to: number;
    total: number;
}`;
    fs.writeFileSync(paginateMetaPath, paginateMetaContent);
    
    // Create other interfaces index
    const othersIndexPath = path.join(othersDir, 'index.ts');
    const othersIndexContent = `export * from './DashboardMenuItem';
export * from './GenericBreadcrumbItem';
export * from './PaginateMeta';
export * from './PaginateMetaLink';
export * from './PaginateResponse';
export * from './ServiceFilterOptions';
export * from './ServiceHooksFactory';`;
    fs.writeFileSync(othersIndexPath, othersIndexContent);
  }
}
