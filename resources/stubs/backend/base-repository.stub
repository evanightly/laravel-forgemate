<?php

namespace App\Repositories;

use Adobrovolsky97\LaravelRepositoryServicePattern\Repositories\BaseRepository as AdobrovolskyBaseRepository;
use App\Support\Interfaces\Repositories\BaseRepositoryInterface;
use App\Traits\Repositories\HandlesFiltering;
use App\Traits\Repositories\HandlesRelations;
use App\Traits\Repositories\HandlesSorting;

abstract class BaseRepository extends AdobrovolskyBaseRepository implements BaseRepositoryInterface {
    use HandlesFiltering, HandlesRelations, HandlesSorting;

    public function firstOrCreate(array $attributes, array $values = []): object {
        $model = resolve($this->getModelClass());

        return $model->firstOrCreate($attributes, $values);
    }
}
