# Laravel Forgemate

A powerful VS Code extension for automatically generating Laravel scaffolding with service-repository pattern support for both backend and frontend layers.

## Key Features

- Dynamic scaffolding based on your model structure
- Comprehensive code generation for service-repository pattern
- Full TypeScript support for frontend components
- Integration with your existing project structure
- Intelligent relationship handling
- UI for visually creating your models

## Installation

1. Install the extension from VS Code Marketplace
2. Open your Laravel project in VS Code
3. Initialize your project structure with `Laravel Forgemate: Initialize Project`

## Quick Start

### 1. Initialize Project Structure

Run `Laravel Forgemate: Initialize Project` to set up base files for service-repository pattern.

### 2. Generate Your First Scaffold

Either:
- Use `Laravel Forgemate: Open UI Panel` to use the visual interface
- Or run `Laravel Forgemate: Generate Scaffold` to use the command palette

### 3. Define Model Attributes

For example, for an ArticleNews model:

| Attribute | Type | Description |
|-----------|------|-------------|
| title | string | Article title |
| description | text | Article content |
| published_date | datetime | Publication date |
| is_archived | boolean | Archive status |

### 4. Generate Code

Click "Generate Scaffold" and the extension will create:

#### Backend Files
- Models/ArticleNews.php
- Repositories/ArticleNewsRepository.php
- Support/Interfaces/Repositories/ArticleNewsRepositoryInterface.php
- Services/ArticleNewsService.php
- Support/Interfaces/Services/ArticleNewsServiceInterface.php
- Http/Controllers/ArticleNewsController.php
- Http/Controllers/Api/ArticleNewsController.php (if API enabled)
- Http/Requests/ArticleNews/StoreArticleNewsRequest.php
- Http/Requests/ArticleNews/UpdateArticleNewsRequest.php
- Http/Resources/ArticleNewsResource.php
- Databases/Migrations/yyyy_mm_dd_create_article_news_table.php
- Databases/Factories/ArticleNewsFactory.php
- Databases/Seeders/ArticleNewsSeeder.php

#### Frontend Files
- Support/Interfaces/Models/ArticleNews.ts
- Support/Interfaces/Resources/ArticleNewsResource.ts
- Services/articleNewsServiceHook.ts
- Updates to routes.ts and index exports

## Template Variables

The extension supports numerous template variables for custom stubs:

### General Naming Variables
- `{{model}}` - Raw model name (e.g. ArticleNews)
- `{{modelLowercase}}` - Lowercase name
- `{{modelUppercase}}` - Uppercase name
- `{{modelCamelCase}}` - camelCase name
- `{{modelPascalCase}}` - PascalCase name
- `{{modelSnakeCase}}` - snake_case name
- `{{modelKebabCase}}` - kebab-case name
- `{{modelUpperSnakeCase}}` - UPPER_SNAKE_CASE name

### Pluralization Variables
- `{{modelPlural}}` - Pluralized name
- `{{modelPluralLowercase}}` - Lowercase plural
- `{{tableName}}` - Database table name (plural snake_case)

### Attribute Variables
- `{{modelStringAttributesWithComma}}` - Comma-separated list of attributes
- `{{modelStringAttributesWithCommaQuoted}}` - Quoted comma-separated list of attributes
- `{{migrationColumns}}` - Full migration column definitions
- `{{tsInterfaceProperties}}` - TypeScript interface properties
- `{{requestRules}}` - Laravel validation rules
- `{{factoryDefinitions}}` - Factory definitions for each attribute
- `{{resourceAttributes}}` - Resource attributes
- `{{resourceRelationships}}` - Resource relationships
- `{{modelCasts}}` - Model attribute casting
- `{{modelRelationships}}` - Model relationship methods

## Customizing Stubs

Run `Laravel Forgemate: Synchronize Stubs` to copy default stubs to your project, then customize them at:
