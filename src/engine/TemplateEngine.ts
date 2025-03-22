import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ModelDefinition } from '../types/ModelDefinition';
import { TemplateProcessor } from './TemplateProcessor';

export class TemplateEngine {
  private templateProcessor: TemplateProcessor;
  
  constructor(private context: vscode.ExtensionContext) {
    this.templateProcessor = new TemplateProcessor();
  }
  
  /**
   * Generate a file from a template
   */
  public async generateFile(stubName: string, model: ModelDefinition, outputPath: string): Promise<void> {
    // Get template content
    const templateContent = await this.getStubContent(stubName);
    if (!templateContent) {
      throw new Error(`Stub file ${stubName} not found in either custom or default locations`);
    }
    
    // Process template
    const processedContent = this.templateProcessor.processTemplate(templateContent, model);
    
    // Create directory if it doesn't exist
    const dirPath = path.dirname(outputPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(outputPath, processedContent);
  }
  
  /**
   * Get stub content from either custom or default location
   */
  public async getStubContent(stubName: string): Promise<string> {
    try {
      // Try to get from custom location first
      const config = vscode.workspace.getConfiguration('laravelForgemate');
      const useCustomStubs = config.get<boolean>('useCustomStubs', false);
      const laravelProjectPath = config.get<string>('laravelProjectPath', '');
      const stubsDir = config.get<string>('stubsDirectory', 'stubs/scaffold');
      
      if (useCustomStubs && laravelProjectPath) {
        const customStubPath = path.join(laravelProjectPath, stubsDir, `${stubName}.stub`);
        if (fs.existsSync(customStubPath)) {
          return fs.readFileSync(customStubPath, 'utf-8');
        }
      }
      
      // Fall back to default stubs
      const defaultStubPath = this.context.asAbsolutePath(path.join('resources/stubs', `${stubName}.stub`));
      if (fs.existsSync(defaultStubPath)) {
        return fs.readFileSync(defaultStubPath, 'utf-8');
      }
      
      // Check if it's a file path instead of a stub name
      if (fs.existsSync(stubName)) {
        return fs.readFileSync(stubName, 'utf-8');
      }
      
      throw new Error(`Stub file ${stubName} not found in either custom or default locations`);
    } catch (error) {
      console.error('Error getting stub content:', error);
      throw error;
    }
  }
}
