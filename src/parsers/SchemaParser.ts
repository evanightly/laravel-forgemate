import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ModelDefinition, AttributeDefinition, RelationshipDefinition } from '../types/ModelDefinition';

export class SchemaParser {
  /**
   * Parse migrations to extract model attributes
   * @param modelName The name of the model
   * @param projectRoot The root of the Laravel project
   */
  public async extractAttributesFromMigration(modelName: string, projectRoot: string): Promise<AttributeDefinition[]> {
    try {
      const attributes: AttributeDefinition[] = [];
      const tableName = this.getTableNameFromModel(modelName);
      const migrationFiles = await this.findMigrationFiles(projectRoot, tableName);
      
      if (migrationFiles.length === 0) {
        return attributes;
      }
      
      // Use the latest migration
      const latestMigration = migrationFiles[migrationFiles.length - 1];
      const migrationContent = fs.readFileSync(latestMigration, 'utf-8');
      
      // Parse the migration content to extract column definitions
      const columnMatches = migrationContent.matchAll(/\$table->(\w+)\(['"]([\w_]+)['"](?:,\s*([^)]+))?\)(?:->([^;]+))?/g);
      
      for (const match of columnMatches) {
        const type = match[1];
        const name = match[2];
        const options = match[3] || '';
        const modifiers = match[4] || '';
        
        const attribute: AttributeDefinition = {
          name,
          type,
          nullable: modifiers.includes('nullable'),
          unique: modifiers.includes('unique'),
          unsigned: modifiers.includes('unsigned'),
          index: modifiers.includes('index'),
        };
        
        // Extract default value if present
        const defaultMatch = modifiers.match(/default\(['"]?([^'")]+)['"]?\)/);
        if (defaultMatch) {
          attribute.defaultValue = defaultMatch[1];
        }
        
        // Extract max length if specified for string type
        if (type === 'string' && options) {
          const lengthMatch = options.match(/(\d+)/);
          if (lengthMatch) {
            attribute.maxLength = parseInt(lengthMatch[1]);
          }
        }
        
        attributes.push(attribute);
      }
      
      return attributes;
    } catch (error) {
      console.error('Error extracting attributes from migration:', error);
      return [];
    }
  }
  
  /**
   * Extract relationships from model file
   */
  public async extractRelationshipsFromModel(modelName: string, projectRoot: string): Promise<RelationshipDefinition[]> {
    try {
      const relationships: RelationshipDefinition[] = [];
      const modelPath = path.join(projectRoot, 'app/Models', `${modelName}.php`);
      
      if (!fs.existsSync(modelPath)) {
        return relationships;
      }
      
      const modelContent = fs.readFileSync(modelPath, 'utf-8');
      
      // Regular expressions to match relationship methods
      const relationPatterns = [
        { type: 'hasOne', pattern: /public\s+function\s+(\w+)\s*\(\s*\)\s*{[\s\S]*?return\s+\$this->hasOne\s*\(\s*([^,)]+)(?:,\s*['"]([\w_]+)['"]\s*)?(?:,\s*['"]([\w_]+)['"]\s*)?\s*\)/g },
        { type: 'hasMany', pattern: /public\s+function\s+(\w+)\s*\(\s*\)\s*{[\s\S]*?return\s+\$this->hasMany\s*\(\s*([^,)]+)(?:,\s*['"]([\w_]+)['"]\s*)?(?:,\s*['"]([\w_]+)['"]\s*)?\s*\)/g },
        { type: 'belongsTo', pattern: /public\s+function\s+(\w+)\s*\(\s*\)\s*{[\s\S]*?return\s+\$this->belongsTo\s*\(\s*([^,)]+)(?:,\s*['"]([\w_]+)['"]\s*)?(?:,\s*['"]([\w_]+)['"]\s*)?\s*\)/g },
        { type: 'belongsToMany', pattern: /public\s+function\s+(\w+)\s*\(\s*\)\s*{[\s\S]*?return\s+\$this->belongsToMany\s*\(\s*([^,)]+)(?:,\s*['"]([\w_]+)['"]\s*)?(?:,\s*['"]([\w_]+)['"]\s*)?(?:,\s*['"]([\w_]+)['"]\s*)?\s*\)/g }
      ];
      
      for (const { type, pattern } of relationPatterns) {
        const matches = [...modelContent.matchAll(pattern)];
        
        for (const match of matches) {
          const methodName = match[1]; // The name of the relationship method
          const relatedModelClass = match[2].trim(); // The related model class
          
          // Extract the model name from the class reference
          const relatedModel = relatedModelClass.includes('::class') 
            ? relatedModelClass.split('::')[0].replace(/.*\\/, '')
            : relatedModelClass;
          
          const relationship: RelationshipDefinition = {
            type,
            relatedModel,
            foreignKey: match[3] || undefined,
            localKey: match[4] || undefined
          };
          
          // For belongsToMany, add pivot information if available
          if (type === 'belongsToMany' && match[5]) {
            relationship.pivot = match[3];
            relationship.pivotForeignKey = match[4];
            relationship.pivotRelatedKey = match[5];
          }
          
          relationships.push(relationship);
        }
      }
      
      return relationships;
    } catch (error) {
      console.error('Error extracting relationships from model:', error);
      return [];
    }
  }
  
  /**
   * Convert string to snake_case
   */
  private snakeCase(input: string): string {
    return input
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }
  
  /**
   * Simple pluralization (Laravel has more sophisticated rules)
   */
  private pluralize(input: string): string {
    if (input.endsWith('y')) {
      return input.slice(0, -1) + 'ies';
    } else if (input.endsWith('s')) {
      return input;
    } else {
      return input + 's';
    }
  }
  
  /**
   * Find migration files for a given table
   */
  private async findMigrationFiles(projectRoot: string, tableName: string): Promise<string[]> {
    const migrationsDir = path.join(projectRoot, 'database/migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      return [];
    }
    
    const files = fs.readdirSync(migrationsDir);
    
    // Look for migration files that create the given table
    const relevantFiles = files
      .filter(file => file.endsWith('.php') && (
        file.includes(`_create_${tableName}_table`) ||
        file.includes(`_modify_${tableName}_table`) ||
        file.includes(`_update_${tableName}_table`) ||
        file.includes(`_add_to_${tableName}_table`)
      ))
      .map(file => path.join(migrationsDir, file))
      .sort(); // Sort by timestamp
    
    return relevantFiles;
  }

  /**
   * Get table name from model name
   */
  public getTableNameFromModel(modelName: string): string {
    return this.snakeCase(this.pluralize(modelName));
  }
}
