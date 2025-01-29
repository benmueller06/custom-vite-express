import type { Plugin as VitePlugin } from 'vite';
import { relative, resolve } from 'path';

/**
 * Resolved module ID for vite plugin.
 */
const RESOLVED_MODULE_ID = `\0vite-resolve-path`;

/**
 * Resolves path aliases in HTML files. Anything that starts with `@/` will be resolved to the `src` directory.
 * @param root - The root directory of the project.
 */
export default function resolverPlugin(root: string): VitePlugin {
  return {
    name: 'vite-resolve-path',
    enforce: 'post',
    transformIndexHtml: {
      order: 'pre',
      handler: (html, ctx) => {
        const srcPath = resolve(root, 'src');
        const filePath = resolve(root, `.${ctx.path}`);
        
        const path = relative(filePath, srcPath).replace(/..\\/, '').replace(/\\/g, '/');

        return {
          html: html.replace(
            /@\//g,
            `${path}/`,
          ),
          tags: []
        }
      }
    },
    resolveId(id) {
      if (id === RESOLVED_MODULE_ID) {
        return RESOLVED_MODULE_ID;
      }

      return null;
    }
  }
}
