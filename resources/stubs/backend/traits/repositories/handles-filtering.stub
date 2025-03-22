<?php

namespace App\Traits\Repositories;

use Illuminate\Database\Eloquent\Builder;

trait HandlesFiltering {
    /**
     * Apply filters to the query based on search parameter.
     */
    public function applySearchFilters(Builder $query, array $searchParams, array $filterableColumns): Builder {
        if (isset($searchParams['search'])) {
            $query->where(function ($query) use ($searchParams, $filterableColumns) {
                foreach ($filterableColumns as $column) {
                    $query->orWhere($column, 'like', '%' . $searchParams['search'] . '%');
                }
            });
        }

        return $query;
    }

    public function applyColumnFilters(Builder $query, array $searchParams, array $filterableColumns): Builder {
        if (isset($searchParams['column_filters'])) {
            foreach ($searchParams['column_filters'] as $key => $value) {
                if (!in_array($key, $filterableColumns)) {
                    continue;
                }
                if (is_array($value)) {
                    if (array_key_exists('from', $value) && array_key_exists('to', $value)) {
                        $query->whereBetween($key, [$value['from'], $value['to']]);
                    } elseif (array_key_exists('from', $value)) {
                        $query->where($key, '>=', $value['from']);
                    } elseif (array_key_exists('to', $value)) {
                        $query->where($key, '<=', $value['to']);
                    } elseif (is_numeric(key($value))) {
                        $query->whereIn($key, $value);
                    }
                } else {
                    $query->where($key, $value);
                }
            }
        }

        return $query;
    }

    /**
     * Apply filters to the query based on search parameters for related models.
     */
    public function applyRelationSearchFilters(Builder $query, array $searchParams, array $relationFilterableColumns): Builder {
        if (isset($searchParams['search'])) {
            foreach ($relationFilterableColumns as $relation => $columns) {
                $query->orWhereHas($relation, function ($query) use ($searchParams, $columns) {
                    foreach ($columns as $column) {
                        $query->where($column, 'like', '%' . $searchParams['search'] . '%');
                    }
                });
            }
        }

        return $query;
    }
}
