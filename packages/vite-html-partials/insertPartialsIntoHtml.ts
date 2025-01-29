import { createPropRegex, recreatePartialPropSyntaxAsRegex, type Partial } from './index.js';
import { PartialsError } from './PartialsError';
import { LOGIC_STATEMENT_REGEX } from '../../src/middleware/statement-parsers.js';

interface ParsedPropInfo {
  propValue: string | number | boolean;
  parentPartial: string;
}

/**
 * Recursively inserts partials into HTML.
 * @param partials - A map of all loaded partials.
 * @param html - The HTML to insert the partials into.
 * @param path - The path of the HTML file.
 */
export function insertPartialsIntoHtml(
  partials: Map<string, Partial>, 
  html: string,
  path: string,
) {
  let parsedHtml = html;

  const validPartialsRegex = new RegExp(`<(${[...partials.keys()].join('|')})\\s.*?\/>`, 'g');

  let result: RegExpExecArray | null;
  let parsedProps = new Map<string, ParsedPropInfo>();

  // biome-ignore lint/suspicious/noAssignInExpressions: Needed for loop
  while ((result = validPartialsRegex.exec(parsedHtml)) !== null) {
    if (!result) continue;

    const partialName = result[1];
    const partial = partials.get(partialName);

    if (!partial) {
      throw new PartialsError(`Partial \x1b[1;39;49m${partialName}\x1b[0m not found.\n`, {
        path,
        column: result.index,
        line: parsedHtml.slice(0, result.index).split('\n').length,
      });
    };

    const props = partial.props;
    const content = partial.content;
    
    for (const propName in props) {
      const prop = props[propName];
      const regex = createPropRegex(propName, prop);
      
      const propResult = result[0].match(regex);

      if (!propResult && prop.required) {
        const lines = html.slice(0, result.index).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;

        throw new PartialsError(`Missing required prop \x1b[1;39;49m${propName}\x1b[0m in partial \x1b[1;39;49m${partialName}\x1b[0m.`, {
          path,
          line,
          column,
        });
      }

      if (!propResult) continue;

      let propValue: string | number | boolean = propResult[1];

      if (prop.type === 'number') {
        if (Number.isNaN(Number(propValue)) && !propValue.match(/{{\s*\w+\s*:\s*number\s*}}/)) {
          const lines = html.slice(0, result.index).split('\n');
          const line = lines.length;
          const column = lines[lines.length - 1].length + 1;

          throw new PartialsError(`Prop \x1b[1;39;49m${propName}\x1b[0m in partial \x1b[1;39;49m${partialName}\x1b[0m must be a number.`, {
            path,
            line,
            column,
          });
        }

        if (!propValue.match(/{{\s*\w+\s*:\s*number\s*}}/)) {
          propValue = Number(propValue);
        }
      }

      if (prop.type === 'boolean') {
        if (typeof propValue !== 'string') continue;

        if (propValue !== 'true' && propValue !== 'false' && !propValue.match(/{{\s*\w+\s*:\s*boolean\s*}}/)) {
          const lines = html.slice(0, result.index).split('\n');
          const line = lines.length;
          const column = lines[lines.length - 1].length + 1;

          throw new PartialsError(`Prop \x1b[1;39;49m${propName}\x1b[0m in partial \x1b[1;39;49m${partialName}\x1b[0m must be a boolean.`, {
            path,
            line,
            column,
          });
        }

        if (!propValue.match(/{{\s*\w+\s*:\s*boolean\s*}}/)) {
          propValue = propValue === 'true';
        }
      }

      parsedProps.set(propName, {
        propValue,
        parentPartial: partialName,
      });
    }

    let partialContent = content;

    for (const [propName, { propValue }] of parsedProps) {
      const prop = props[propName];
      const regex = recreatePartialPropSyntaxAsRegex(prop.required, propName, prop.type);
      
      partialContent = partialContent.replace(regex, propValue.toString());
    }

    parsedHtml = parsedHtml.replace(result[0], partialContent);
    parsedHtml = insertPartialsIntoHtml(partials, parsedHtml, path);
  }

  let logicResult: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: Needed for loop
  while ((logicResult = LOGIC_STATEMENT_REGEX.exec(parsedHtml)) !== null) {
    if (!logicResult) continue;

    const [_, variable, __] = logicResult;
    
    if (!variable) continue;

    const prop = parsedProps.get(variable);

    if (!prop) continue;

    const parentPartial = partials.get(prop.parentPartial)!;
    const propType = parentPartial.props[variable].type;

    if (propType !== 'boolean') {
      throw new PartialsError(`Prop \x1b[1;39;49m${variable}\x1b[0m in partial \x1b[1;39;49m${prop.parentPartial}\x1b[0m must be a boolean as it is used in a logic statement.`, {
        path,
        line: parsedHtml.slice(0, logicResult.index).split('\n').length,
        column: logicResult.index,
      });
    }

    parsedHtml = parsedHtml.replaceAll(variable, prop.propValue.toString());
  }

  return parsedHtml;
}