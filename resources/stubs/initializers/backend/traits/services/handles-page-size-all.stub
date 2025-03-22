<?php

namespace App\Traits\Services;

use Adobrovolsky97\LaravelRepositoryServicePattern\Exceptions\Repository\RepositoryException;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;

/**
 * Trait for handling 'all' page size requests
 * 
 * @package App\Traits\Services
 * @generated Laravel Forgemate Initializer
 */
trait HandlesPageSizeAll {
    /**
     * @throws RepositoryException
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public function handlePageSizeAll(): void {
        if (request()->get('page_size') === 'all') {
            request()->merge(['page_size' => $this->repository->withTrashed()->count()]);
        }
    }
}
