<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class SafeProjectPath implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $path = realpath($value) ?: $value;

        // Block path traversal
        if (str_contains($path, '..')) {
            $fail('The project path must not contain path traversal (..).');
            return;
        }

        // Must be an absolute path (Unix / or Windows drive letter like C:\)
        if (! self::isAbsolutePath($path)) {
            $fail('The project path must be an absolute path.');
            return;
        }

        $allowedBases = self::getAllowedBases();

        // When no restrictions are configured, any absolute path is allowed
        if (empty($allowedBases)) {
            return;
        }

        $normalizedPath = self::normalizePath($path);

        foreach ($allowedBases as $base) {
            $normalizedBase = self::normalizePath($base);
            if ($normalizedPath === $normalizedBase || str_starts_with($normalizedPath, $normalizedBase . '/')) {
                return;
            }
        }

        $fail('The project path must be within: ' . implode(' or ', $allowedBases));
    }

    /**
     * Check if a path is absolute (Unix or Windows).
     */
    private static function isAbsolutePath(string $path): bool
    {
        // Unix absolute path
        if (str_starts_with($path, '/')) {
            return true;
        }

        // Windows absolute path (e.g., C:\, D:\, C:/)
        if (preg_match('/^[A-Za-z]:[\\\\\/]/', $path)) {
            return true;
        }

        return false;
    }

    /**
     * Normalize path separators to forward slashes and remove trailing slash.
     */
    private static function normalizePath(string $path): string
    {
        return rtrim(str_replace('\\', '/', $path), '/');
    }

    /**
     * Get the allowed base paths for the current environment.
     *
     * @return string[]
     */
    public static function getAllowedBases(): array
    {
        // Allow explicit override via env
        if ($custom = env('PROJECTS_ALLOWED_PATH')) {
            return [$custom];
        }

        // In Docker, use the host path that users type
        if ($hostPath = env('PROJECTS_HOST_PATH')) {
            return [$hostPath];
        }

        // No restrictions configured — allow any absolute path
        return [];
    }
}
