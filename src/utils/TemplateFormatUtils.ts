/**
 * Utility for template formatting
 */
export class TemplateFormatUtils {
  /**
   * Format code block with consistent indentation
   * 
   * @param content The content to format
   * @param baseIndent The base indentation level (in spaces)
   * @returns Formatted content
   */
  public static formatCodeBlock(content: string, baseIndent: number = 4): string {
    if (!content || content.trim() === '') {
      return '';
    }
    
    const indent = ' '.repeat(baseIndent);
    
    return content
      .split('\n')
      .map(line => line.trim() ? `${indent}${line}` : line)
      .join('\n');
  }
  
  /**
   * Format template variable replacement with proper indentation
   * 
   * @param template The template string
   * @param replacements Key-value pairs to replace in template
   * @returns Formatted string
   */
  public static formatTemplateReplacement(template: string, replacements: Record<string, string>): string {
    let result = template;
    
    // Find all template variables and their indentation
    const variablePattern = /^(\s*)({{[^}]+}})/gm;
    
    for (const match of result.matchAll(variablePattern)) {
      const [fullMatch, indentation, variable] = match;
      const value = replacements[variable];
      
      if (value) {
        // Apply indentation to each line of the replacement value
        const formattedValue = value
          .split('\n')
          .map((line, index) => index === 0 ? line : `${indentation}${line}`)
          .join('\n');
        
        result = result.replace(fullMatch, indentation + formattedValue);
      }
    }
    
    return result;
  }
}
