<?php

namespace App\Traits\Repositories;

use Illuminate\Database\Eloquent\Builder;

/**
 * Trait for handling relationship queries
 * 
 * @package App\Traits\Repositories
 * @generated Laravel Forgemate Initializer
 */
trait RelationQueryable {
    protected function applyFilterConditions(array $conditions = []): Builder {
        $query = $this->getQuery();

        foreach ($conditions as $data) {
            // Check if the $data array contains at least two elements (field and operator)
            if (!is_array($data) || count($data) < 2) {
                continue; // Skip any conditions that are not properly formatted
            }

            $field = $data[0];
            $operator = $data[1] ?? '='; // Default operator to '=' if not provided
            $val = $data[2] ?? null; // Default value to null if not provided

            // Apply the basic condition logic here, including handling relationships
            switch (strtoupper($operator)) {
                case 'HAS':
                    $query->whereHas($field, $val);
                    break;
                case 'DOESNT_HAVE':
                    $query->whereDoesntHave($field, $val);
                    break;
                default:
                    $query->where($field, $operator, $val);
            }
        }

        return $query;
    }
}
