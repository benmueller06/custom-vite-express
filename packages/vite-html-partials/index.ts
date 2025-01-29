import type { IndexHtmlTransformContext, Plugin as VitePlugin } from 'vite';
import { readdirSync, readFileSync } from 'node:fs';
import { insertPartialsIntoHtml } from './insertPartialsIntoHtml';

/**
 * Resolved module ID for vite plugin.
 */
const RESOLVED_MODULE_ID = "\0vite-html-partials";
/**
 * Regular expression for partial syntax.
 */
const PARTIAL_REGEX = /{{\s*(!)?([a-zA-Z0-9_]+)(:string|:number|:boolean|:)?\s*}}/g;

interface Prop {
  type: string;
  required: boolean;
}

export interface Partial {
  props: Record<string, Prop>;
  content: string;
}

/**
 * Creates a regular expression for a prop.
 * @param propName - The name of the prop.
 * @param prop - The prop object.
 */
export function createPropRegex(propName: string, prop: Prop) {
  let propContentRegex: string;

  switch(prop.type) {
    case 'number':
      propContentRegex = `"([+-]?([0-9]*[.])?[0-9]+|{{\\s*\\w+\\s*:\\s*number\\s*}})"`;
      break;
    case 'boolean':
      propContentRegex = `"(true|false|{{\\s*\\w+\\s*:\\s*boolean\\s*}})"`;
      break;
    default:
      propContentRegex = `"([^"]+)"`;
  }

  return new RegExp(`${propName}=${propContentRegex}`);
}

/**
 * Recreates the partial prop syntax as a regular expression.
 * @param required - Whether the prop is required.
 * @param name - The name of the prop.
 * @param type - The type of the prop.
 */
export function recreatePartialPropSyntaxAsRegex(required: boolean, name: string, type: string) {
  return new RegExp(`{{\\s*${required ? '!' : ''}${name}${type && type !== 'any' ? `:${type}` : ''}\\s*}}`);
}

/**
 * Loads partials from a directory.
 * @param partialsDir - The directory to load partials from.
 */
function loadPartials(partialsDir: string): Map<string, Partial> {
  const partials = new Map<string, Partial>();

  const files = readdirSync(partialsDir, { recursive: true, withFileTypes: true });

  for (const file of files) {
    if (
      !file.isFile() 
      || !file.name.endsWith('.html') 
      || file.name.charAt(0) !== file.name.charAt(0).toUpperCase()
    ) continue;

    const sanitized = file.name.replace('.html', '');
    const path = `${file.parentPath}/${file.name}`;
    const content = readFileSync(path, 'utf-8');

    const expectedProps = content.match(PARTIAL_REGEX);
    
    if (!expectedProps) {
      partials.set(sanitized, { props: {}, content });
      continue;
    }

    const props: Record<string, Prop> = {};

    for (const prop of expectedProps) {
      let result: RegExpExecArray | null;

      // biome-ignore lint/suspicious/noAssignInExpressions: Needed for loop
      while ((result = PARTIAL_REGEX.exec(prop)) !== null) {
        if (!result) continue;

        const required = !!result[1];
        const name = result[2];
        let type = result[3];
        
        if (type) type = type.slice(1);

        props[name] = { type: type || 'any', required };
      }

      partials.set(sanitized, { props, content });
    }
  }

  return partials;
}

/**
 * A Vite plugin to handle HTML partials.
 * @param partialsDir - The directory to load partials from.
 */
export default function partialsPlugin(partialsDir: string): VitePlugin {
  let partials = loadPartials(partialsDir);

  return {
    name: 'vite-html-partials',
    enforce: 'pre',
    transformIndexHtml: {
      order: 'pre',
      handler: (html, ctx) => {
        let parsedHtml = insertPartialsIntoHtml(partials, html, ctx.path);

        return {
          html: parsedHtml,
          tags: []
        }
      }
    },
    resolveId(id) {
      if (id === RESOLVED_MODULE_ID) {
        return RESOLVED_MODULE_ID;
      }

      return null;
    },
    handleHotUpdate() {
      partials = loadPartials(partialsDir);
    }
  }
}
