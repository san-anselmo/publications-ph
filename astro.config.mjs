import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';
import compress from 'astro-compress';
import cloudflare from '@astrojs/cloudflare';
import robotsTxt from 'astro-robots-txt';

export default defineConfig({
  site: 'https://san-anselmo.github.io',
  base: '/publications-ph',
  adapter: cloudflare(),
  integrations: [
    sitemap(),
    partytown({
      config: {
        forward: ['dataLayer.push'],
      },
    }),
    mdx(),
    icon(),
    compress(),
    robotsTxt(),
  ],
  build: {
    format: 'file',
  },
  server: {
    host: true,
    port: 4321,
  },
});
