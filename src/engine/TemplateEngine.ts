import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ModelDefinition } from '../types/ModelDefinition';
import { TemplateProcessor } from './TemplateProcessor';

export class TemplateEngine {
  private templateProcessor: TemplateProcessor;
  
  constructor(private context: vscode.ExtensionContext) {
    this.templateProcessor = new TemplateProcessor();
    
    // Initialize by validating the stubs directory exists
    this.validateStubsExist();
  }
  
  /**
   * Validate that essential stubs exist
   */
  private validateStubsExist(): void {
    const essentialStubs = [
      'backend/base-repository-interface',
      'backend/base-repository',
      'backend/enums/intent-enum',
      'backend/enums/permission-enum',
      'backend/repository-service-provider',
      'backend/traits/repositories/handles-filtering'
    ];
    
    const missingStubs = essentialStubs.filter(stub => {
      const stubPath = this.context.asAbsolutePath(path.join('resources/stubs', `${stub}.stub`));
      return !fs.existsSync(stubPath);
    });
    
    if (missingStubs.length > 0) {
      console.warn('Missing essential stubs:', missingStubs);
    }
  }

  /**
   * Generate a file using a stub template
   */
  public async generateFile(stubName: string, model: ModelDefinition, outputPath: string): Promise<void> {
    const content = await this.getStubContent(stubName, model);
    
    // Create directory if it doesn't exist
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(outputPath, content);
  }

  /**
   * Get stub content by name, checking for custom stubs first if enabled
   */
  public async getStubContent(stubName: string, model?: ModelDefinition): Promise<string> {
    // Get stub content from file
    let stubContent: string;
    
    // Check if custom stubs are enabled
    const config = vscode.workspace.getConfiguration('laravelForgemate');
    const useCustomStubs = config.get<boolean>('useCustomStubs', false);
    const laravelProjectPath = config.get<string>('laravelProjectPath', '');
    const stubsDir = config.get<string>('stubsDirectory', 'stubs/scaffold');
    
    // Initialize project root path - either from settings or first workspace folder
    let projectRoot = '';
    if (laravelProjectPath && fs.existsSync(laravelProjectPath)) {
      projectRoot = laravelProjectPath;
    } else if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      projectRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    }
    
    // If custom stubs are enabled, check for a custom stub file first
    if (useCustomStubs && projectRoot) {
      const customStubPath = path.join(projectRoot, stubsDir, `${stubName}.stub`);
      
      vscode.window.showInformationMessage(`Checking for custom stub: ${customStubPath}`);
      console.log(`Checking for custom stub: ${customStubPath}`);
      
      if (fs.existsSync(customStubPath)) {
        vscode.window.showInformationMessage(`Using custom stub: ${customStubPath}`);
        console.log(`Using custom stub: ${customStubPath}`);
        stubContent = fs.readFileSync(customStubPath, 'utf8');
        return model ? this.templateProcessor.processTemplate(stubContent, model) : stubContent;
      } else {
        console.log(`Custom stub not found at: ${customStubPath}, using default stub`);
      }
    }
    
    // Fall back to default stub
    const stubPath = this.context.asAbsolutePath(path.join('resources/stubs', `${stubName}.stub`));
    if (!fs.existsSync(stubPath)) {
      throw new Error(`Stub file not found: ${stubPath}`);
    }
    
    console.log(`Using default stub: ${stubPath}`);
    stubContent = fs.readFileSync(stubPath, 'utf8');
    return model ? this.templateProcessor.processTemplate(stubContent, model) : stubContent;
  }
  
  /**
   * Read a template file and process it with the given model
   */
  public async processTemplate(templatePath: string, model: ModelDefinition): Promise<string> {
    const content = await this.getStubContent(templatePath, model);
    return this.templateProcessor.processTemplate(content, model);
  }
}
