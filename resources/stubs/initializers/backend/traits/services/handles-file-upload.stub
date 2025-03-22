<?php

namespace App\Traits\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Trait for handling file uploads
 * 
 * @package App\Traits\Services
 * @generated Laravel Forgemate Initializer
 */
trait HandlesFileUpload {
    /**
     * Store a file in the specified directory
     *
     * @param  UploadedFile  $file  The file to upload
     * @param  string  $directory  Directory where file will be stored
     * @param  bool  $preserveFileName  Whether to preserve the original filename
     * @return string|null Path to the stored file
     */
    protected function storeFile(UploadedFile $file, string $directory, bool $preserveFileName = false): ?string {
        if (!$file) {
            return null;
        }

        // Create directory if it doesn't exist
        Storage::makeDirectory('public/' . $directory, 0755, true);

        // Generate filename
        if ($preserveFileName) {
            // Clean the original filename and make it safe
            $filename = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
            $filename .= '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        } else {
            // Generate a completely unique filename with extension
            $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
        }

        // Store the file
        $file->storeAs('public/' . $directory, $filename);

        // Return the relative path for database storage
        return $directory . '/' . $filename;
    }

    /**
     * Delete a file from storage
     *
     * @param  string|null  $filePath  Path to the file to delete
     * @param  string  $disk  Storage disk to use
     * @return bool Whether the file was deleted
     */
    protected function deleteFile(?string $filePath, string $disk = 'public'): bool {
        if (empty($filePath)) {
            return false;
        }

        return Storage::disk($disk)->delete($filePath);
    }
}
