<?php

use App\Services\TemplateResolver;

beforeEach(function () {
    $this->resolver = new TemplateResolver;
});

it('resolves simple variables', function () {
    $result = $this->resolver->resolve('Hello {{name}}, welcome to {{place}}.', [
        'name' => 'Alice',
        'place' => 'Wonderland',
    ]);

    expect($result)->toBe('Hello Alice, welcome to Wonderland.');
});

it('leaves unresolved variables untouched', function () {
    $result = $this->resolver->resolve('Hello {{name}}, your role is {{role}}.', [
        'name' => 'Bob',
    ]);

    expect($result)->toBe('Hello Bob, your role is {{role}}.');
});

it('handles empty variables array', function () {
    $result = $this->resolver->resolve('Hello {{name}}.', []);

    expect($result)->toBe('Hello {{name}}.');
});

it('handles body with no variables', function () {
    $result = $this->resolver->resolve('No variables here.', ['foo' => 'bar']);

    expect($result)->toBe('No variables here.');
});

it('extracts variable names from body', function () {
    $variables = $this->resolver->extractVariables('Hello {{name}}, use {{language}} in {{tone}} tone.');

    expect($variables)->toBe(['name', 'language', 'tone']);
});

it('extracts unique variable names', function () {
    $variables = $this->resolver->extractVariables('{{name}} said hello to {{name}}.');

    expect($variables)->toBe(['name']);
});

it('returns empty array for body with no variables', function () {
    $variables = $this->resolver->extractVariables('No variables here.');

    expect($variables)->toBe([]);
});

it('detects missing variables', function () {
    $missing = $this->resolver->getMissing('Hello {{name}} in {{language}}', [
        'name' => 'Alice',
    ]);

    expect($missing)->toBe(['language']);
});

it('reports null values as missing', function () {
    $missing = $this->resolver->getMissing('Use {{tone}}', [
        'tone' => null,
    ]);

    expect($missing)->toBe(['tone']);
});

it('returns empty when all variables are provided', function () {
    $missing = $this->resolver->getMissing('{{a}} and {{b}}', [
        'a' => 'x',
        'b' => 'y',
    ]);

    expect($missing)->toBe([]);
});
