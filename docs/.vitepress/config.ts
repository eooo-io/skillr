import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Skillr',
  description: 'Universal AI skill/agent configuration manager for multi-provider development workflows.',
  base: '/skillr/',

  ignoreDeadLinks: [
    /localhost/,
  ],

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/skillr/logo.svg' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Reference', link: '/reference/skill-format' },
      {
        text: 'v1.0.0',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'GitHub', link: 'https://github.com/eooo-io/skillr' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/core-concepts' },
          ],
        },
        {
          text: 'Skills',
          items: [
            { text: 'Creating Skills', link: '/guide/skills' },
            { text: 'Skill Taxonomy', link: '/guide/skill-taxonomy' },
            { text: 'Includes & Composition', link: '/guide/includes' },
            { text: 'Template Variables', link: '/guide/templates' },
            { text: 'Prompt Linting', link: '/guide/linting' },
            { text: 'Version History', link: '/guide/versions' },
          ],
        },
        {
          text: 'Agents',
          items: [
            { text: 'Agent Configuration', link: '/guide/agents' },
            { text: 'Agent Compose', link: '/guide/agent-compose' },
          ],
        },
        {
          text: 'Provider Sync',
          items: [
            { text: 'Sync Overview', link: '/guide/provider-sync' },
            { text: 'Diff Preview', link: '/guide/diff-preview' },
            { text: 'Reverse Import', link: '/guide/reverse-import' },
            { text: 'Git Auto-Commit', link: '/guide/git-integration' },
          ],
        },
        {
          text: 'Testing',
          items: [
            { text: 'Test Runner', link: '/guide/test-runner' },
            { text: 'Playground', link: '/guide/playground' },
            { text: 'Multi-Model Setup', link: '/guide/multi-model' },
          ],
        },
        {
          text: 'Sharing',
          items: [
            { text: 'Library', link: '/guide/library' },
            { text: 'Marketplace', link: '/guide/marketplace' },
            { text: 'Skills.sh Import', link: '/guide/skills-sh' },
            { text: 'Bundle Export/Import', link: '/guide/bundles' },
          ],
        },
        {
          text: 'Integrations',
          items: [
            { text: 'MCP Servers', link: '/guide/mcp-servers' },
            { text: 'A2A Agents', link: '/guide/a2a-agents' },
            { text: 'OpenClaw Config', link: '/guide/openclaw' },
            { text: 'Repository Connections', link: '/guide/repositories' },
            { text: 'Desktop Config Sync', link: '/guide/desktop-sync' },
          ],
        },
        {
          text: 'Discovery',
          items: [
            { text: 'Cross-Project Search', link: '/guide/search' },
            { text: 'Project Visualization', link: '/guide/visualization' },
          ],
        },
        {
          text: 'Automation',
          items: [
            { text: 'Webhooks', link: '/guide/webhooks' },
          ],
        },
        {
          text: 'Account',
          items: [
            { text: 'Authentication', link: '/guide/authentication' },
            { text: 'Billing & Subscriptions', link: '/guide/billing' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Skill File Format', link: '/reference/skill-format' },
            { text: 'API Endpoints', link: '/reference/api' },
            { text: 'CLI & Makefile', link: '/reference/cli' },
            { text: 'Settings', link: '/reference/settings' },
            { text: 'Keyboard Shortcuts', link: '/reference/shortcuts' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/eooo-io/skillr' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2026 eooo.io',
    },
  },
})
