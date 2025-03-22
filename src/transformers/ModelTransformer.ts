import * as pluralize from 'pluralize';

export class ModelTransformer {
  /**
   * Convert string to camelCase
   */
  public toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.replace(/[\s_-](\w)/g, (_, c) => c.toUpperCase()).substring(1);
  }
  
  /**
   * Convert string to PascalCase
   */
  public toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + this.toCamelCase(str).substring(1);
  }
  
  /**
   * Convert string to snake_case
   */
  public toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]/g, '_')
      .toLowerCase();
  }
  
  /**
   * Convert string to kebab-case
   */
  public toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]/g, '-')
      .toLowerCase();
  }
  
  /**
   * Convert string to plural form
   */
  public pluralize(str: string): string {
    return pluralize.plural(str);
  }
  
  /**
   * Convert string to singular form
   */
  public singularize(str: string): string {
    return pluralize.singular(str);
  }
}
