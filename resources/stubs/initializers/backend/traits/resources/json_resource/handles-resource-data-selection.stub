<?php

namespace App\Traits\Resources\JsonResource;

use Closure;
use Illuminate\Http\Request;
use Str;

/**
 * Trait for filtering resource data based on requested fields
 * 
 * @package App\Traits\Resources\JsonResource
 * @generated Laravel Forgemate Initializer
 */
trait HandlesResourceDataSelection {
    /**
     * Filter resource data based on the specified query parameter or return default fields.
     * Ensures closures/functions are only invoked for requested fields.
     */
    public function filterData(array $dataSource, ?array $default = null, Request $request = null): array {
        $request = $request ?? request();
        
        // Dynamically compute the resource key name for the query string
        $resourceKey = Str::snake(class_basename(static::class));

        // Extract requested fields for this resource from the query string
        $queryFields = $request->query($resourceKey);

        // If no specific fields are requested, return default fields
        if (!$queryFields) {
            return $this->resolveDataFields($default ?? $dataSource);
        }

        // Convert the comma-separated string (e.g., 'title,url') into an array
        $fieldsArray = explode(',', $queryFields);

        // Filter the factory array and resolve only requested fields
        return $this->resolveDataFields(
            collect($dataSource)->only($fieldsArray)->toArray()
        );
    }

    /**
     * Resolve resource fields, evaluating closures when present.
     */
    private function resolveDataFields(array $data): array {
        return collect($data)->map(function ($value) {
            // Execute the closure or return the value directly
            return $value instanceof Closure ? $value() : $value;
        })->toArray();
    }
}
