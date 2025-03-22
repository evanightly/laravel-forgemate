# Laravel Forgemate - Project Structure

## Core Files
- `package.json`: Extension metadata and dependencies
- `src/extension.ts`: Main entry point
- `src/commands/index.ts`: Command registration and execution
- `src/ui/WebviewProvider.ts`: UI interface for scaffolding
- `src/ui/TreeDataProvider.ts`: File explorer sidebar provider
- `src/engine/TemplateEngine.ts`: Template processing engine
- `src/engine/TemplateProcessor.ts`: Template variables processor
- `src/transformers/ModelTransformer.ts`: String transformation utilities
- `src/parsers/SchemaParser.ts`: Extracts model info from existing files
- `src/initializer/ProjectInitializer.ts`: Sets up project structure
- `src/types/ModelDefinition.ts`: TypeScript interfaces for models

## Stubs (Templates)
### Backend
- `resources/stubs/backend/base-repository-interface.stub`: Base repository interface
- `resources/stubs/backend/base-repository.stub`: Base repository implementation  
- `resources/stubs/backend/controller.stub`: Controller template
- `resources/stubs/backend/controller.api.stub`: API Controller template
- `resources/stubs/backend/factory.stub`: Factory template
- `resources/stubs/backend/migration.stub`: Migration template
- `resources/stubs/backend/model.stub`: Model template  
- `resources/stubs/backend/repository.interface.stub`: Model repository interface
- `resources/stubs/backend/repository.stub`: Model repository implementation
- `resources/stubs/backend/repository-service-provider.stub`: Service provider
- `resources/stubs/backend/resource.stub`: API Resource template
- `resources/stubs/backend/service.interface.stub`: Service interface template
- `resources/stubs/backend/service.stub`: Service implementation template
- `resources/stubs/backend/store.request.stub`: Store request template
- `resources/stubs/backend/update.request.stub`: Update request template
- `resources/stubs/backend/seeder.stub`: Seeder template

### Backend Traits
- `resources/stubs/backend/traits/repositories/handles-filtering.stub`: Repository filtering
- `resources/stubs/backend/traits/repositories/handles-relations.stub`: Repository relations
- `resources/stubs/backend/traits/repositories/handles-sorting.stub`: Repository sorting
- `resources/stubs/backend/traits/repositories/relation-queryable.stub`: Relation queries
- `resources/stubs/backend/traits/services/handles-page-size-all.stub`: Pagination helper
- `resources/stubs/backend/traits/json_resource/handles-resource-data-selection.stub`: Resource data helper

### Backend Enums
- `resources/stubs/backend/enums/intent-enum.stub`: Intent enum
- `resources/stubs/backend/enums/permission-enum.stub`: Permission enum

### Frontend
- `resources/stubs/frontend/model-interface.stub`: Base model interface
- `resources/stubs/frontend/resource-interface.stub`: Base resource interface
- `resources/stubs/frontend/model.stub`: Model interface template
- `resources/stubs/frontend/resource.stub`: Resource interface template
- `resources/stubs/frontend/service.hook.stub`: Service hook template
- `resources/stubs/frontend/service-hooks-factory.stub`: Service hooks factory
- `resources/stubs/frontend/routes.stub`: Routes constant

### Frontend Helpers
- `resources/stubs/frontend/helpers/add-ripple-effect.stub`: UI effect helper
- `resources/stubs/frontend/helpers/generate-dynamic-breadcrumbs.stub`: Breadcrumb helper
- `resources/stubs/frontend/helpers/generate-service-hooks-factory-query-key.stub`: Query key helper
- `resources/stubs/frontend/helpers/tanstack-query-helpers.stub`: TanStack Query helper
- `resources/stubs/frontend/helpers/index.stub`: Helper index export

### Frontend Interfaces
- `resources/stubs/frontend/others/generic-breadcrumb-item.stub`: Breadcrumb interface
- `resources/stubs/frontend/others/paginate-meta.stub`: Pagination meta interface
- `resources/stubs/frontend/others/paginate-meta-link.stub`: Pagination link interface
- `resources/stubs/frontend/others/paginate-response.stub`: Paginated response interface
- `resources/stubs/frontend/others/service-filter-options.stub`: Filter options interface
- `resources/stubs/frontend/others/service-hooks-factory.stub`: Service hooks interface
- `resources/stubs/frontend/others/index.stub`: Interface index export

### Vite Plugins
- `resources/stubs/frontend/vite_plugins/check-routes-override-plugin.stub`: Routes override plugin
- `resources/stubs/frontend/vite_plugins/transform-intent-enum-plugin.stub`: IntentEnum transformer
- `resources/stubs/frontend/vite_plugins/lib/colors.stub`: Console color utilities
- `resources/stubs/frontend/vite_plugins/lib/generate-prefix-text.stub`: Console prefix helper
- `resources/stubs/frontend/vite_plugins/lib/get-current-timestamp.stub`: Timestamp helper

## VS Code Integration
- `.vscode/extensions.json`: Recommended extensions
- `.vscode/launch.json`: Debugging configuration
- `resources/icon.svg`: Extension icon

## Documentation
- `README.md`: User documentation
- `STRUCTURE.md`: Project structure overview (this file)
- `CONTRIBUTING.md`: Contribution guidelines
