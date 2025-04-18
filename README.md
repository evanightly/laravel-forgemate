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

## Default Package Integrations

Laravel Forgemate is designed to work seamlessly with specific packages by default, but you can customize the generated code to work with any stack.

### Backend Defaults

- **[Laravel Repository Service Pattern](https://github.com/adobrovolsky97/laravel-repository-service-pattern)**: Used to handle service and repository processes, effectively decoupling the application's business logic from the specific implementation details of data storage. All generated backend code follows this pattern.

### Frontend Defaults

- **[@tanstack/react-query](https://tanstack.com/query/latest)**: The generated service hooks are built with TanStack Query (formerly React Query) to handle data transaction processes efficiently. You can see this in the implementation of the serviceHooksFactory.ts files.
- **NyxbUI**: The scaffolding is designed to work with this ReactJS component library, which is similar to ShadCN but with enhanced animations and unique components. Frontend templates assume the use of these UI components.

> **Note**: If your project uses different packages, you can customize the stubs to match your tech stack. See the "Customizing Stubs" section below for details.

## Configuration Options

Laravel Forgemate offers several configuration options to customize its behavior:

| Option                                   | Description                                                                            | Default                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------- |
| `laravelForgemate.laravelProjectPath`    | Path to Laravel project (Leave empty to use workspace folder)                          | `""`                                          |
| `laravelForgemate.useCustomStubs`        | Use custom stubs from Laravel project if available                                     | `true`                                        |
| `laravelForgemate.stubsDirectory`        | Directory for custom stubs (relative to Laravel project)                               | `"stubs/scaffold"`                            |
| `laravelForgemate.relationNameFormat`    | Format for relation method names in models and resources (`camelCase` or `snake_case`) | `"camelCase"`                                 |
| `laravelForgemate.frontendModelsPath`    | Custom path for frontend model interfaces                                              | `"resources/js/Support/Interfaces/Models"`    |
| `laravelForgemate.frontendResourcesPath` | Custom path for frontend resource interfaces                                           | `"resources/js/Support/Interfaces/Resources"` |
| `laravelForgemate.frontendServicesPath`  | Custom path for frontend services                                                      | `"resources/js/Services"`                     |
| `laravelForgemate.frontendConstantsPath` | Custom path for frontend constants                                                     | `"resources/js/Support/Constants"`            |
| `laravelForgemate.frontendHelpersPath`   | Custom path for frontend helpers                                                       | `"resources/js/Helpers"`                      |
| `laravelForgemate.frontendOthersPath`    | Custom path for other frontend interfaces                                              | `"resources/js/Support/Interfaces/Others"`    |

## Laravel Compatibility

### Laravel 11+ Support

Laravel Forgemate fully supports Laravel 11+ with the following enhancements:

| Feature                 | Description                                                          |
| ----------------------- | -------------------------------------------------------------------- |
| New Directory Structure | Automatically adapts to Laravel 11's streamlined directory structure |
| PHP 8.2+ Compatibility  | All generated code uses PHP 8.2+ syntax and features                 |
| Invokable Controllers   | Option to generate single-action invokable controllers               |
| Pest Testing            | Support for generating Pest test files instead of PHPUnit            |
| Route Attributes        | Support for PHP attributes-based routing in controllers              |

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

| Attribute      | Type     | Description      |
| -------------- | -------- | ---------------- |
| title          | string   | Article title    |
| description    | text     | Article content  |
| published_date | datetime | Publication date |
| is_archived    | boolean  | Archive status   |

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

| Variable                | Description           | Example Value  |
| ----------------------- | --------------------- | -------------- |
| {{modelName}}           | Raw model name        | WarehouseItem  |
| {{modelLowercase}}      | Lowercase name        | warehouseitem  |
| {{modelUppercase}}      | Uppercase name        | WAREHOUSEITEM  |
| {{modelCamelCase}}      | camelCase name        | warehouseItem  |
| {{modelPascalCase}}     | PascalCase name       | WarehouseItem  |
| {{modelSnakeCase}}      | snake_case name       | warehouse_item |
| {{modelKebabCase}}      | kebab-case name       | warehouse-item |
| {{modelUpperSnakeCase}} | UPPER_SNAKE_CASE name | WAREHOUSE_ITEM |

### Pluralization Variables

| Variable                 | Description                             | Example Value   |
| ------------------------ | --------------------------------------- | --------------- |
| {{modelPlural}}          | Pluralized name                         | WarehouseItems  |
| {{modelPluralLowercase}} | Lowercase plural                        | warehouseitems  |
| {{tableName}}            | Database table name (plural snake_case) | warehouse_items |

### Attribute Variables

| Variable                                 | Description                               | Example Value                                                                                                               |
| ---------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| {{modelStringAttributesWithComma}}       | Comma-separated list of attributes        | title, description, qty                                                                                                     |
| {{modelStringAttributesWithCommaQuoted}} | Quoted comma-separated list of attributes | 'title', 'description', 'qty'                                                                                               |
| {{tsInterfaceProperties}}                | TypeScript interface properties           | title: string;<br>description: string;<br>qty: number;                                                                      |
| {{requestRules}}                         | Laravel validation rules                  | 'title' => 'required\|string\|max:255',<br>'description' => 'nullable\|string',<br>'qty' => 'required\|integer',            |
| {{factoryDefinitions}}                   | Factory definitions                       | 'title' => $this->faker->word(),<br>'description' => $this->faker->text(),<br>'qty' => $this->faker->numberBetween(1, 100), |
| {{migrationColumns}}                     | Full migration column definitions         | $table->string('title');<br>$table->text('description')->nullable();<br>$table->integer('qty');                             |
| {{resourceAttributes}}                   | Resource attributes                       | 'title' => $this->title,<br>'description' => $this->description,<br>'qty' => $this->qty,                                    |
| {{modelCasts}}                           | Model attribute casting                   | 'qty' => 'integer',                                                                                                         |

### Relationship Variables

| Variable                  | Description                | Example Value                                                                      |
| ------------------------- | -------------------------- | ---------------------------------------------------------------------------------- |
| {{modelRelationships}}    | Model relationship methods | public function category()<br>{<br> return $this->belongsTo(Category::class);<br>} |
| {{resourceRelationships}} | Resource relationships     | 'category' => CategoryResource::make($this->whenLoaded('category')),               |

### Attribute Default Values

Laravel Forgemate now supports specifying default values for model attributes directly in the UI. This allows you to:

1. Set default values for database columns in migrations
2. Use those same default values in factories for testing
3. Ensure consistent behavior across your application

When adding an attribute in the UI, you can now specify a default value that will be appropriately formatted based on the attribute's data type:

| Data Type | Default Value Example | Migration Result                         |
| --------- | --------------------- | ---------------------------------------- |
| string    | "Draft"               | ->default('Draft')                       |
| integer   | 0                     | ->default(0)                             |
| boolean   | true                  | ->default(true)                          |
| json      | {"key": "value"}      | ->default(json_encode({"key": "value"})) |

This feature is particularly useful for:

- Boolean flags (is_active, is_featured, etc.)
- Status fields (status = "draft")
- Counters (views = 0)
- Default JSON configuration

The default values are intelligently handled in both migrations and factories, ensuring consistency throughout your application.

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

## Dev Note

### Releasing a new version

1. Update version using the following command
   - For a patch update (0.1.5 -> 0.1.6)
     ```
     npm run version:patch
     ```
   - For a minor update (0.1.5 -> 0.2.0)
     ```
     npm run version:minor
     ```
   - For a major update (0.1.5 -> 1.0.0)
     ```
     npm run version:major
     ```
2. Push the changes and tags to GitHub:
   ```
   npm run publish:extension
   ```

## License

This extension is licensed under the MIT License.
