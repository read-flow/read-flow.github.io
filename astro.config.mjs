import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://read-flow.github.io',
  integrations: [
    starlight({
      title: 'Read Flow Guides',
      description: 'Install, setup, and advanced guides for Read Flow.',
      favicon: '/favicon-32.png',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/read-flow/read-flow' },
      ],
      sidebar: [
        {
          label: 'Guides',
          items: [
            { label: 'Guides', link: '/guides/' },
            { label: 'Install', link: '/guides/install/' },
            { label: 'Setup & configuration', link: '/guides/setup/' },
            {
              label: 'Advanced',
              items: [{ autogenerate: { directory: 'guides/advanced' } }],
            },
          ],
        },
      ],
      components: {
        ThemeSelect: './src/components/ThemeSelectHidden.astro',
      },
      customCss: ['./src/styles/starlight-theme.css'],
    }),
  ],
});
