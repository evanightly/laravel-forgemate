import * as pluralize from 'pluralize';
import { ModelTransformer } from '../transformers/ModelTransformer';
import { AttributeDefinition, ModelDefinition } from '../types/ModelDefinition';

export class TemplateProcessor {
    private transformer: ModelTransformer;
    private indentationMap: Record<string, string> = {
        default: '    ',
        migration: '            ',
        factory: '            ',
        rules: '            ',
    };

    constructor() {
        this.transformer = new ModelTransformer();
    }

    /**
     * Helper method to get consistent indentation
     */
    private getIndentation(type: string = 'default'): string {
        return this.indentationMap[type] || this.indentationMap['default'];
    }

    /**
     * Create custom indentation with specified depth
     */
    private createIndentation(depth: number = 1, spaceChar: string = '    '): string {
        return spaceChar.repeat(depth);
    }

    /**
     * Process a template by replacing template variables with model data
     */
    public processTemplate(template: string, model: ModelDefinition): string {
        // Replace simple variables first
        let result = this.replaceSimpleVariables(template, model);

        // Replace conditional sections
        result = this.replaceConditionalSections(result, model);

        // Replace complex variables
        result = this.replaceComplexVariables(result, model);

        return result;
    }

    /**
     * Replace simple variables like {{modelName}}, {{tableName}}, etc.
     */
    private replaceSimpleVariables(template: string, model: ModelDefinition): string {
        const modelName = model.name;
        const tableName =
            model.tableName || this.transformer.toSnakeCase(pluralize.plural(modelName));

        const replacements: Record<string, string> = {
            '{{modelName}}': modelName,
            '{{modelLowercase}}': modelName.toLowerCase(),
            '{{modelUppercase}}': modelName.toUpperCase(),
            '{{modelCamelCase}}': this.transformer.toCamelCase(modelName),
            '{{modelPascalCase}}': modelName, // Already in PascalCase
            '{{modelSnakeCase}}': this.transformer.toSnakeCase(modelName),
            '{{modelKebabCase}}': this.transformer.toKebabCase(modelName),
            '{{modelUpperSnakeCase}}': this.transformer.toSnakeCase(modelName).toUpperCase(),

            // Plurals
            '{{modelPlural}}': pluralize.plural(modelName),
            '{{modelPluralLowercase}}': pluralize.plural(modelName).toLowerCase(),
            '{{modelPluralCamelCase}}': this.transformer.toCamelCase(pluralize.plural(modelName)),
            '{{modelPluralPascalCase}}': this.transformer.toPascalCase(pluralize.plural(modelName)),
            '{{modelPluralSnakeCase}}': this.transformer.toSnakeCase(pluralize.plural(modelName)),
            '{{modelPluralKebabCase}}': this.transformer.toKebabCase(pluralize.plural(modelName)),
            '{{modelPluralUpperSnakeCase}}': this.transformer
                .toSnakeCase(pluralize.plural(modelName))
                .toUpperCase(),

            '{{tableName}}': tableName,
        };

        let processedTemplate = template;
        for (const [key, value] of Object.entries(replacements)) {
            // Use regex to replace all occurrences
            const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            processedTemplate = processedTemplate.replace(regex, value);
        }

        return processedTemplate;
    }

    /**
     * Replace conditional sections like {{#softDeletes}}...{{/softDeletes}}
     */
    private replaceConditionalSections(template: string, model: ModelDefinition): string {
        const conditions: Record<string, boolean> = {
            softDeletes: model.softDeletes === true,
            timestamps: model.timestamps !== false, // Default to true
        };

        let processedTemplate = template;

        for (const [key, value] of Object.entries(conditions)) {
            const openTag = `{{#${key}}}`;
            const closeTag = `{{/${key}}}`;

            // Find all conditional sections
            let startIndex = processedTemplate.indexOf(openTag);
            while (startIndex !== -1) {
                const endIndex = processedTemplate.indexOf(closeTag, startIndex);

                if (endIndex === -1) {
                    // No matching close tag, break to avoid infinite loop
                    break;
                }

                const sectionContent = processedTemplate.substring(
                    startIndex + openTag.length,
                    endIndex,
                );

                // Replace the entire section with the content (if condition is true) or empty string
                const replacement = value ? sectionContent : '';
                processedTemplate =
                    processedTemplate.substring(0, startIndex) +
                    replacement +
                    processedTemplate.substring(endIndex + closeTag.length);

                // Look for next occurrence
                startIndex = processedTemplate.indexOf(openTag);
            }
        }

        return processedTemplate;
    }

    /**
     * Replace complex variables that require additional processing
     */
    private replaceComplexVariables(template: string, model: ModelDefinition): string {
        // Define replacements that require computation
        const replacements: Record<string, string> = {
            '{{modelStringAttributesWithComma}}': this.getAttributeNames(model.attributes).join(
                ', ',
            ),
            '{{modelStringAttributesWithCommaQuoted}}': this.getAttributeNames(model.attributes)
                .map((name) => `'${name}'`)
                .join(', '),
            '{{migrationColumns}}': this.getMigrationColumns(model.attributes),
            '{{tsInterfaceProperties}}': this.getTsInterfaceProperties(model.attributes),
            '{{requestRules}}': this.getRequestRules(model.attributes),
            '{{factoryDefinitions}}': this.getFactoryDefinitions(model.attributes),
            '{{modelCasts}}': this.getModelCasts(model.attributes),
            '{{modelRelationships}}': this.getModelRelationships(model),
            '{{resourceAttributes}}': this.getResourceAttributes(model.attributes),
            '{{resourceRelationships}}': this.getResourceRelationships(model),
            '{{frontendResourceRelationImports}}': this.getFrontendResourceRelationImports(model),
            '{{frontendResourceRelationProperties}}':
                this.getFrontendResourceRelationProperties(model),
        };

        let processedTemplate = template;
        for (const [key, value] of Object.entries(replacements)) {
            // Use regex to replace all occurrences
            const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            processedTemplate = processedTemplate.replace(regex, value);
        }

        return processedTemplate;
    }

    /**
     * Get attribute names
     */
    private getAttributeNames(attributes: AttributeDefinition[] = []): string[] {
        if (!attributes || attributes.length === 0) {
            return [];
        }

        return attributes.map((attr) => attr.name);
    }

    /**
     * Get migration columns
     */
    private getMigrationColumns(attributes: AttributeDefinition[] = []): string {
        if (!attributes || attributes.length === 0) {
            return '';
        }

        return attributes
            .map((attr) => {
                let column = `${this.getIndentation('migration')}$table->${attr.type}('${attr.name}')`;

                // Add modifiers
                const modifiers = [];

                if (attr.nullable) {
                    modifiers.push('nullable()');
                }

                if (attr.unique) {
                    modifiers.push('unique()');
                }

                if (attr.default !== undefined) {
                    const defaultValue =
                        typeof attr.default === 'string' ? `'${attr.default}'` : attr.default;
                    modifiers.push(`default(${defaultValue})`);
                }

                if (attr.unsigned) {
                    modifiers.push('unsigned()');
                }

                if (attr.index) {
                    modifiers.push('index()');
                }

                if (modifiers.length > 0) {
                    column += '->' + modifiers.join('->');
                }

                return column + ';';
            })
            .join('\n');
    }

    /**
     * Get TypeScript interface properties
     */
    private getTsInterfaceProperties(attributes: AttributeDefinition[] = []): string {
        if (!attributes || attributes.length === 0) {
            return '';
        }

        return attributes
            .map((attr) => {
                const tsType = this.getTsType(attr.type, attr.nullable ?? false);
                return `  ${attr.name}${attr.nullable ? '?' : ''}: ${tsType};`;
            })
            .join('\n');
    }

    /**
     * Map PHP/Database type to TypeScript type
     */
    private getTsType(type: string, _nullable: boolean): string {
        const typeMapping: Record<string, string> = {
            string: 'string',
            text: 'string',
            integer: 'number',
            bigInteger: 'number',
            boolean: 'boolean',
            date: 'string',
            datetime: 'string',
            time: 'string',
            timestamp: 'string',
            decimal: 'number',
            float: 'number',
            json: 'Record<string, any>',
            jsonb: 'Record<string, any>',
            uuid: 'string',
        };

        return typeMapping[type] || 'any';
    }

    /**
     * Get Laravel validation rules
     */
    private getRequestRules(attributes: AttributeDefinition[] = []): string {
        if (!attributes || attributes.length === 0) {
            return '';
        }

        return attributes
            .map((attr) => {
                const rules = [];

                // Base rule based on type
                switch (attr.type) {
                    case 'string':
                    case 'text':
                        rules.push('string');
                        break;
                    case 'integer':
                    case 'bigInteger':
                        rules.push('integer');
                        break;
                    case 'decimal':
                    case 'float':
                        rules.push('numeric');
                        break;
                    case 'boolean':
                        rules.push('boolean');
                        break;
                    case 'date':
                        rules.push('date');
                        break;
                    case 'datetime':
                    case 'timestamp':
                        rules.push('date_format:Y-m-d H:i:s');
                        break;
                    case 'json':
                    case 'jsonb':
                        rules.push('json');
                        break;
                    case 'uuid':
                        rules.push('uuid');
                        break;
                }

                // Required if not nullable
                if (!attr.nullable) {
                    rules.unshift('required');
                } else {
                    rules.unshift('nullable');
                }

                // Max length for strings
                if (attr.type === 'string' && attr.maxLength) {
                    rules.push(`max:${attr.maxLength}`);
                }

                // Unique
                if (attr.unique) {
                    rules.push('unique');
                }

                return `${this.getIndentation('rules')}'${attr.name}' => ['${rules.join("', '")}'],`;
            })
            .join('\n');
    }

    /**
     * Get factory definitions
     */
    private getFactoryDefinitions(attributes: AttributeDefinition[] = []): string {
        if (!attributes || attributes.length === 0) {
            return '';
        }

        return attributes
            .map((attr) => {
                // Determine faker method based on type
                let fakerMethod: string;

                switch (attr.type) {
                    case 'string':
                        fakerMethod = 'sentence()';
                        break;
                    case 'text':
                        fakerMethod = 'paragraphs(3, true)';
                        break;
                    case 'integer':
                    case 'bigInteger':
                        fakerMethod = 'numberBetween(1, 1000)';
                        break;
                    case 'decimal':
                    case 'float':
                        fakerMethod = 'randomFloat(2, 1, 1000)';
                        break;
                    case 'boolean':
                        fakerMethod = 'boolean()';
                        break;
                    case 'date':
                    case 'datetime':
                    case 'timestamp':
                        fakerMethod = "dateTimeThisMonth()->format('Y-m-d H:i:s')";
                        break;
                    case 'json':
                    case 'jsonb':
                        fakerMethod = "json_encode(['key' => 'value'])";
                        break;
                    case 'uuid':
                        fakerMethod = 'uuid()';
                        break;
                    default:
                        fakerMethod = 'word()';
                }

                return `${this.getIndentation('factory')}'${attr.name}' => $this->faker->${fakerMethod},`;
            })
            .join('\n');
    }

    /**
     * Get model casts
     */
    private getModelCasts(attributes: AttributeDefinition[] = []): string {
        if (!attributes || attributes.length === 0) {
            return '';
        }

        const castableTypes = [
            'boolean',
            'date',
            'datetime',
            'timestamp',
            'decimal',
            'float',
            'integer',
            'json',
            'jsonb',
        ];

        const casts = attributes
            .filter((attr) => castableTypes.includes(attr.type))
            .map((attr) => {
                let cast: string;

                switch (attr.type) {
                    case 'boolean':
                        cast = 'boolean';
                        break;
                    case 'date':
                        cast = 'date';
                        break;
                    case 'datetime':
                    case 'timestamp':
                        cast = 'datetime';
                        break;
                    case 'decimal':
                    case 'float':
                        cast = attr.precision ? `decimal:${attr.precision}` : 'decimal';
                        break;
                    case 'integer':
                    case 'bigInteger':
                        cast = 'integer';
                        break;
                    case 'json':
                    case 'jsonb':
                        cast = 'array';
                        break;
                    default:
                        cast = 'string';
                }

                return `${this.getIndentation('default')}'${attr.name}' => '${cast}',`;
            });

        return casts.join('\n');
    }

    /**
     * Get model relationships
     */
    private getModelRelationships(model: ModelDefinition): string {
        if (!model.relationships || model.relationships.length === 0) {
            return '';
        }

        return model.relationships
            .map((relation) => {
                const relatedPascal = this.transformer.toPascalCase(relation.relatedModel);
                const methodName =
                    relation.type === 'belongsTo'
                        ? this.transformer.toCamelCase(relation.relatedModel)
                        : relation.type === 'hasOne'
                          ? this.transformer.toCamelCase(relation.relatedModel)
                          : this.transformer.toCamelCase(pluralize.plural(relation.relatedModel));

                let relationCode = `    /**
     * ${relation.type} relationship with ${relatedPascal}.
     */
    public function ${methodName}()
    {
        return $this->${relation.type}(${relatedPascal}::class`;

                // Add foreign key if specified
                if (relation.foreignKey) {
                    relationCode += `, '${relation.foreignKey}'`;
                }

                // Add local key if specified
                if (relation.localKey) {
                    relationCode += `, '${relation.localKey}'`;
                }

                // Handle belongsToMany pivot info
                if (relation.type === 'belongsToMany' && relation.pivot) {
                    relationCode += `, '${relation.pivot}'`;

                    if (relation.pivotForeignKey) {
                        relationCode += `, '${relation.pivotForeignKey}'`;
                    }

                    if (relation.pivotRelatedKey) {
                        relationCode += `, '${relation.pivotRelatedKey}'`;
                    }
                }

                relationCode += `);
    }`;

                return relationCode;
            })
            .join('\n\n');
    }

    /**
     * Get resource attributes
     */
    private getResourceAttributes(attributes: AttributeDefinition[] = []): string {
        if (!attributes || attributes.length === 0) {
            return '';
        }

        return attributes
            .map((attr) => {
                return `${this.getIndentation('default')}'${attr.name}' => $this->${attr.name},`;
            })
            .join('\n');
    }

    /**
     * Get resource relationships
     */
    private getResourceRelationships(model: ModelDefinition): string {
        if (!model.relationships || model.relationships.length === 0) {
            return '';
        }

        return model.relationships
            .map((relation) => {
                const relatedPascal = this.transformer.toPascalCase(relation.relatedModel);
                const methodName =
                    relation.type === 'belongsTo'
                        ? this.transformer.toCamelCase(relation.relatedModel)
                        : relation.type === 'hasOne'
                          ? this.transformer.toCamelCase(relation.relatedModel)
                          : this.transformer.toCamelCase(pluralize.plural(relation.relatedModel));

                const isCollection =
                    relation.type === 'hasMany' || relation.type === 'belongsToMany';

                if (isCollection) {
                    return `${this.getIndentation('default')}'${methodName}' => ${relatedPascal}Resource::collection($this->whenLoaded('${methodName}')),`;
                } else {
                    return `${this.getIndentation('default')}'${methodName}' => new ${relatedPascal}Resource($this->whenLoaded('${methodName}')),`;
                }
            })
            .join('\n');
    }

    /**
     * Get frontend resource relationship imports
     * Generates separate import statements for each related model's resource
     */
    private getFrontendResourceRelationImports(model: ModelDefinition): string {
        if (!model.relationships || model.relationships.length === 0) {
            return '';
        }

        // Get unique related models to avoid duplicate imports
        const uniqueRelatedModels = Array.from(
            new Set(model.relationships.map((relation) => relation.relatedModel)),
        );

        return uniqueRelatedModels
            .map((relatedModel) => {
                const relatedPascal = this.transformer.toPascalCase(relatedModel);
                return `import { ${relatedPascal}Resource } from '@/Support/Interfaces/Resources';`;
            })
            .join('\n');
    }

    /**
     * Get frontend resource relationship properties
     * Generates interface properties for related models
     */
    private getFrontendResourceRelationProperties(model: ModelDefinition): string {
        if (!model.relationships || model.relationships.length === 0) {
            return '';
        }

        return model.relationships
            .map((relation) => {
                const relatedPascal = this.transformer.toPascalCase(relation.relatedModel);
                const methodName =
                    relation.type === 'belongsTo'
                        ? this.transformer.toCamelCase(relation.relatedModel)
                        : relation.type === 'hasOne'
                          ? this.transformer.toCamelCase(relation.relatedModel)
                          : this.transformer.toCamelCase(pluralize.plural(relation.relatedModel));

                const isCollection =
                    relation.type === 'hasMany' || relation.type === 'belongsToMany';

                if (isCollection) {
                    return `${this.getIndentation('default')}${methodName}?: ${relatedPascal}Resource[];`;
                } else {
                    return `${this.getIndentation('default')}${methodName}?: ${relatedPascal}Resource;`;
                }
            })
            .join('\n');
    }
}
