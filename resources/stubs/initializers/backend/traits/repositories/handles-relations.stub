<?php

namespace App\Traits\Repositories;

use Illuminate\Database\Eloquent\Builder;

/**
 * Trait for handling model relationships
 * 
 * @package App\Traits\Repositories
 * @generated Laravel Forgemate Initializer
 */
trait HandlesRelations {
    /**
     * Automatically apply relations to the query based on request parameters.
     */
    protected function applyResolvedRelations(Builder $query, array $params = []): Builder {
        $relations = $params[HANDLES_RELATIONS_RELATIONS_QUERY_KEY] ?? '';
        $relation_count = $params[HANDLES_RELATIONS_RELATION_COUNT_QUERY_KEY] ?? '';

        if ($relations) {
            // Split the relations string into individual relations
            $relationsArray = explode(',', $relations);

            // Apply each relation to the query
            foreach ($relationsArray as $relation) {
                $query->with($this->parseRelation($relation));
            }
        }

        if ($relation_count) {
            $countsArray = explode(',', $relation_count);

            foreach ($countsArray as $count) {
                $this->applyManualNestedWithCount($query, $count);
            }
        }

        return $query;
    }

    /**
     * Parse relation string to support nested relations and counts.
     */
    protected function parseRelation(string $relation, bool $forCount = false): array|string {
        $relationParts = explode('.', $relation);
        $nestedRelation = array_shift($relationParts);

        if (count($relationParts) > 0) {
            // Handle further nested relations recursively
            return [
                $nestedRelation => function ($query) use ($relationParts, $forCount) {
                    if ($forCount) {
                        // Try to apply counts on deeper relations
                        $query->withCount(implode('.', $relationParts));
                    } else {
                        $query->with($this->parseRelation(implode('.', $relationParts)));
                    }
                },
            ];
        }

        return $nestedRelation;
    }

    /**
     * Handle nested withCount manually for deeply nested relations (e.g., posts.tags.posts).
     */
    protected function applyManualNestedWithCount(Builder $query, string $relation): void {
        $relationParts = explode('.', $relation);

        // If it's a nested relation, separate the parts
        if (count($relationParts) > 1) {
            // Get all but the last part for intermediate relations
            $parentRelation = implode('.', array_slice($relationParts, 0, -1)); // 'posts.tags'
            $countedRelation = end($relationParts); // 'posts'

            // First load the intermediate relations using 'with'
            $query->with([$parentRelation => function ($parentQuery) use ($countedRelation) {
                // Then count the final nested relation on the last "parent"
                $parentQuery->withCount($countedRelation);
            }]);
        } else {
            // If it's not nested, count normally
            $query->withCount($relation);
        }
    }
}
