<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class WorkspaceProfile extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'default_model',
        'approval_mode',
        'allowed_tools',
        'denied_tools',
        'default_max_tokens',
        'default_temperature',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'allowed_tools' => 'array',
            'denied_tools' => 'array',
            'default_max_tokens' => 'integer',
            'default_temperature' => 'float',
            'is_default' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (WorkspaceProfile $profile) {
            if (empty($profile->slug)) {
                $profile->slug = Str::slug($profile->name);
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
