<?php

namespace App\Support\Interfaces\Repositories;

use Adobrovolsky97\LaravelRepositoryServicePattern\Repositories\Contracts\BaseRepositoryInterface as AdobrovolRepositoryBaseInterface;

interface BaseRepositoryInterface extends AdobrovolRepositoryBaseInterface {
    /**
     * Find the first record matching the attributes or create it.
     */
    public function firstOrCreate(array $attributes, array $values = []): object;
}
