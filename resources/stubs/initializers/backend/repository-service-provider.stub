<?php

namespace App\Providers;

use FilesystemIterator;
use Illuminate\Support\ServiceProvider;

/**
 * Repository service provider - auto binds repositories and services
 * 
 * @package App\Providers
 * @generated Laravel Forgemate Initializer
 */
class RepositoryServiceProvider extends ServiceProvider {
    /**
     * Register services.
     */
    public function register(): void {
        $baseDir = realpath(__DIR__ . '/../../'); // Adjust to get the project root directory
        $modelDir = $baseDir . '/app/Models';
        $modelFiles = new FilesystemIterator($modelDir, FilesystemIterator::SKIP_DOTS);

        foreach ($modelFiles as $modelFile) {
            if ($modelFile->isFile()) {
                $modelName = pathinfo($modelFile->getFilename(), PATHINFO_FILENAME);

                $serviceInterface = "App\\Support\\Interfaces\\Services\\{$modelName}ServiceInterface";
                $service = "App\\Services\\{$modelName}Service";
                $repositoryInterface = "App\\Support\\Interfaces\\Repositories\\{$modelName}RepositoryInterface";
                $repository = "App\\Repositories\\{$modelName}Repository";

                if (class_exists($service) && interface_exists($serviceInterface)) {
                    $this->app->singleton($serviceInterface, $service);
                }

                if (class_exists($repository) && interface_exists($repositoryInterface)) {
                    $this->app->singleton($repositoryInterface, $repository);
                }
            }
        }

        // Example of manual custom binding a service
        // $this->app->bind(BrowserServiceInterface::class, BrowserService::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void {
        //
    }
}
