<?php

namespace App\Traits\Repositories;

use Illuminate\Database\Eloquent\Builder;

/**
 * Trait for handling sorting in repositories
 * 
 * @package App\Traits\Repositories
 * @generated Laravel Forgemate Initializer
 */
trait HandlesSorting {
    /**
     * Apply sorting to the query based on the given parameters.
     */
    protected function applySorting(Builder $query, array $searchParams = []): Builder {
        if (isset($searchParams['orderBy'])) {
            $query->orderBy($searchParams['orderBy'], $searchParams['sortBy'] ?? 'desc');
        }

        return $query;
    }
}
