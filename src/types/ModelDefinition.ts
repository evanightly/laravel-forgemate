export interface ModelDefinition {
  name: string;
  tableName?: string;
  attributes: AttributeDefinition[];
  relationships?: RelationshipDefinition[];
  timestamps?: boolean;
  softDeletes?: boolean;
  fillable?: boolean;
  apiResource?: boolean;
  options?: GenerationOptions;
}

export interface AttributeDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  unique?: boolean;
  default?: any;
  unsigned?: boolean;
  index?: boolean;
  maxLength?: number;
  precision?: number;
  scale?: number;
}

export interface RelationshipDefinition {
  type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany' | string;
  relatedModel: string;
  foreignKey?: string;
  localKey?: string;
  pivot?: string;
  pivotForeignKey?: string;
  pivotRelatedKey?: string;
}

export interface GenerationOptions {
  generateModel?: boolean;
  generateMigration?: boolean;
  generateFactory?: boolean;
  generateSeeder?: boolean;
  generateController?: boolean;
  generateApiController?: boolean;
  generateService?: boolean;
  generateRepository?: boolean;
  generateRequests?: boolean;
  generateResource?: boolean;
  generateFrontend?: boolean;
  generateRoutes?: boolean;
}
