import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://read-flow.github.io',
  integrations: [
    starlight({
      title: 'Read Flow Guides',
      description: 'Install, setup, and advanced guides for Read Flow.',
      social: {
        github: 'https://github.com/read-flow/read-flow',
      },
      sidebar: [{ label: 'Guides', autogenerate: { directory: 'guides' } }],
    }),
  ],
});
