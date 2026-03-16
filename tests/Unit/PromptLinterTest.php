<?php

use App\Services\PromptLinter;

beforeEach(function () {
    $this->linter = new PromptLinter;
});

it('flags empty body', function () {
    $issues = $this->linter->lint('');

    expect($issues)->toHaveCount(1);
    expect($issues[0]['rule'])->toBe('empty_body');
});

it('flags whitespace-only body', function () {
    $issues = $this->linter->lint('   ');

    expect($issues)->toHaveCount(1);
    expect($issues[0]['rule'])->toBe('empty_body');
});

it('detects vague instructions', function () {
    $issues = $this->linter->lint('Please do your best to summarize the document.');

    $vagueIssues = array_filter($issues, fn ($i) => $i['rule'] === 'vague_instruction');
    expect($vagueIssues)->not->toBeEmpty();
});

it('detects weak constraints', function () {
    $issues = $this->linter->lint('You should always validate the input before processing.');

    $weakIssues = array_filter($issues, fn ($i) => $i['rule'] === 'weak_constraint');
    expect($weakIssues)->not->toBeEmpty();
});

it('detects missing output format for generation skills', function () {
    $issues = $this->linter->lint('Generate a comprehensive summary of the given document.');

    $formatIssues = array_filter($issues, fn ($i) => $i['rule'] === 'missing_output_format');
    expect($formatIssues)->not->toBeEmpty();
});

it('does not flag output format when specified', function () {
    $issues = $this->linter->lint('Generate a summary. Format your response as a bulleted list.');

    $formatIssues = array_filter($issues, fn ($i) => $i['rule'] === 'missing_output_format');
    expect($formatIssues)->toBeEmpty();
});

it('flags excessive length', function () {
    $body = str_repeat('This is a test sentence that is reasonably long. ', 500);
    $issues = $this->linter->lint($body);

    $lengthIssues = array_filter($issues, fn ($i) => $i['rule'] === 'excessive_length');
    expect($lengthIssues)->not->toBeEmpty();
});

it('detects role confusion with multiple roles', function () {
    $body = "You are a code reviewer.\nYou are a documentation writer.\nYou are a security auditor.";
    $issues = $this->linter->lint($body);

    $roleIssues = array_filter($issues, fn ($i) => $i['rule'] === 'role_confusion');
    expect($roleIssues)->not->toBeEmpty();
});

it('detects redundant lines', function () {
    $body = "Always validate user input before processing it.\nAlways validate user input before processing it carefully.";
    $issues = $this->linter->lint($body);

    $redundancyIssues = array_filter($issues, fn ($i) => $i['rule'] === 'redundancy');
    expect($redundancyIssues)->not->toBeEmpty();
});

it('returns no issues for a well-written skill', function () {
    $body = "You are a code reviewer.\n\nReview the provided code for:\n- Security vulnerabilities\n- Performance issues\n- Code style violations\n\nFormat your response as a numbered list of findings.";
    $issues = $this->linter->lint($body);

    expect($issues)->toBeEmpty();
});
