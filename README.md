# Laravel Forgemate

A powerful VS Code extension for automatically generating Laravel scaffolding with service-repository pattern support for both backend and frontend layers.

![Laravel Forgemate Demo](resources/images/laravel-forgemate-demo.gif)

## Key Features

- Dynamic scaffolding based on your model structure
- Comprehensive code generation for service-repository pattern
- Full TypeScript support for frontend components
- Integration with your existing project structure
- Intelligent relationship handling
- UI for visually creating your models

## Laravel Compatibility

### Laravel 11+ Support

Laravel Forgemate fully supports Laravel 11+ with the following enhancements:

| Feature | Description |
|---------|-------------|
| New Directory Structure | Automatically adapts to Laravel 11's streamlined directory structure |
| PHP 8.2+ Compatibility | All generated code uses PHP 8.2+ syntax and features |
| Invokable Controllers | Option to generate single-action invokable controllers |
| Pest Testing | Support for generating Pest test files instead of PHPUnit |
| Route Attributes | Support for PHP attributes-based routing in controllers |

### Minimum Requirements

- Laravel 9.0+
- PHP 8.1+ (PHP 8.2+ recommended for Laravel 11)
- Node.js 16+ for frontend assets
- VS Code 1.85.0+

## Installation

1. Install the extension from VS Code Marketplace
2. Open your Laravel project in VS Code
3. (optional) Initialize your project structure with `Laravel Forgemate: Initialize Project`

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

Using this sample model for examples:

**Model: WarehouseItem**  
**Attributes:**
- title (string)  
- description (text)  
- qty (integer)  

### General Naming Variables

| Variable | Description | Example Value |
|----------|-------------|--------------|
| {{modelName}} | Raw model name | WarehouseItem |
| {{modelLowercase}} | Lowercase name | warehouseitem |
| {{modelUppercase}} | Uppercase name | WAREHOUSEITEM |
| {{modelCamelCase}} | camelCase name | warehouseItem |
| {{modelPascalCase}} | PascalCase name | WarehouseItem |
| {{modelSnakeCase}} | snake_case name | warehouse_item |
| {{modelKebabCase}} | kebab-case name | warehouse-item |
| {{modelUpperSnakeCase}} | UPPER_SNAKE_CASE name | WAREHOUSE_ITEM |

### Pluralization Variables

| Variable | Description | Example Value |
|----------|-------------|--------------|
| {{modelPlural}} | Pluralized name | WarehouseItems |
| {{modelPluralLowercase}} | Lowercase plural | warehouseitems |
| {{tableName}} | Database table name (plural snake_case) | warehouse_items |

### Attribute Variables

| Variable | Description | Example Value |
|----------|-------------|--------------|
| {{modelStringAttributesWithComma}} | Comma-separated list of attributes | title, description, qty |
| {{modelStringAttributesWithCommaQuoted}} | Quoted comma-separated list of attributes | 'title', 'description', 'qty' |
| {{tsInterfaceProperties}} | TypeScript interface properties | title: string;<br>description: string;<br>qty: number; |
| {{requestRules}} | Laravel validation rules | 'title' => 'required\|string\|max:255',<br>'description' => 'nullable\|string',<br>'qty' => 'required\|integer', |
| {{factoryDefinitions}} | Factory definitions | 'title' => $this->faker->word(),<br>'description' => $this->faker->text(),<br>'qty' => $this->faker->numberBetween(1, 100), |
| {{migrationColumns}} | Full migration column definitions | $table->string('title');<br>$table->text('description')->nullable();<br>$table->integer('qty'); |
| {{resourceAttributes}} | Resource attributes | 'title' => $this->title,<br>'description' => $this->description,<br>'qty' => $this->qty, |
| {{modelCasts}} | Model attribute casting | 'qty' => 'integer', |

### Relationship Variables

| Variable | Description | Example Value |
|----------|-------------|--------------|
| {{modelRelationships}} | Model relationship methods | public function category()<br>{<br>    return $this->belongsTo(Category::class);<br>} |
| {{resourceRelationships}} | Resource relationships | 'category' => CategoryResource::make($this->whenLoaded('category')), |

## Customizing Stubs

One of Laravel Forgemate's most powerful features is the ability to customize the templates (stubs) used for code generation. This allows you to tailor the generated code to match your project's coding style and requirements.

### Using the Synchronize Stubs Command

The easiest way to customize stubs is to use the built-in "Synchronize Stubs" command:

1. Open the command palette with `Ctrl+Shift+P`
2. Type "Laravel Forgemate: Synchronize Stubs" and press Enter
3. This will copy all the default stubs to your Laravel project's stubs directory
4. You can then customize any of these stubs to match your project's needs

Alternatively, you can use the "Laravel Forgemate: Synchronize Stubs" command from the UI panel.
![Laravel Forgemate Synchronize Stubs Demo](resources/images/laravel-forgemate-customizing-stubs-demo.gif)

### Benefits of Customizing Stubs

- **Consistent coding style**: Ensure all generated code follows your team's conventions
- **Project-specific requirements**: Add custom methods or properties that your project needs
- **Enhanced TypeScript support**: Improve type safety in your frontend code
- **Time-saving**: Define the structure once, reuse it across your entire project

### Available Stub Types

- Backend stubs (PHP): models, controllers, repositories, services, etc.
- Frontend stubs (TypeScript): interfaces, service hooks, etc.

Customizing stubs gives you complete control over the generated code while still benefiting from the automation that Laravel Forgemate provides!

## Support

If you encounter any issues or have feature requests, please file an issue on our [GitHub repository](https://github.com/evanightly/laravel-forgemate).

## License

This extension is licensed under the MIT License.
