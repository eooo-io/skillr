import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Skillr',
  description: 'Portable AI instruction format. Write AI instructions once, sync them to every provider you use.',
  base: '/skillr/',

  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/skillr/logo.svg' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/cli-quickstart' },
      { text: 'Reference', link: '/reference/spec-v1' },
      {
        text: 'Latest',
        items: [
          { text: 'GitHub', link: 'https://github.com/eooo-io/skillr' },
          { text: 'npm', link: 'https://www.npmjs.com/package/@eooo/skillr' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'CLI',
          items: [
            { text: 'Quickstart', link: '/guide/cli-quickstart' },
            { text: 'How It Works', link: '/guide/how-it-works' },
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
          ],
        },
        {
          text: 'Provider Sync',
          items: [
            { text: 'Sync Overview', link: '/guide/provider-sync' },
            { text: 'Diff Preview', link: '/guide/diff-preview' },
            { text: 'Reverse Import', link: '/guide/reverse-import' },
          ],
        },
        {
          text: 'Extending',
          items: [
            { text: 'Custom Providers', link: '/guide/custom-providers' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'Specification',
          items: [
            { text: 'Spec v1', link: '/reference/spec-v1' },
            { text: 'Provider Output Contract', link: '/reference/provider-contract' },
            { text: 'Composition Spec', link: '/reference/composition-spec' },
            { text: 'Template Variable Spec', link: '/reference/template-spec' },
            { text: 'Skill File Format', link: '/reference/skill-format' },
          ],
        },
        {
          text: 'CLI',
          items: [
            { text: 'Command Reference', link: '/reference/cli' },
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
