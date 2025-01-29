/**
 * The regular expression to match logic statements in HTML files.
 */
export const LOGIC_STATEMENT_REGEX = /{{\s*([a-zA-Z_]+)\s*&&\s*\(\s*([\s\S]*?)\s*\)\s*}}/g;

/**
 * Resolves the logic syntax in HTML files.
 * ```html
 * {{ boolean && (
 *   <div>Condition met!</div>
 * )}}
 * ```
 * @param html - The HTML content.
 */
function resolveLogicStatements(html: string, variables: Record<string, any>): string {
  let result: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: Needed for loop
  while ((result = LOGIC_STATEMENT_REGEX.exec(html)) !== null) {
    if (!result) continue;

    const [statement, variable, content] = result;

    if (variables[variable] === true) {
      html = html.replace(statement, content);
    } else {
      html = html.replace(statement, '');
    }
  }

  return html;
}

/**
 * The regular expression to match mapping statements in HTML files.
 */
const MAPPING_STATEMENT_REGEX = /{{\s*([a-zA-Z_]+)\s*=\s*\(([a-zA-Z_]+)\)\s*=>\s*\(\s*([\s\S]*?)\s*\)\s*}}/g;

/**
 * The regular expression to match nested object keys in mapping statements.
 */
const NESTED_KEY_REGEX = /{{\s*[a-zA-z_]+?\.[a-zA-z_]+?\./g;

/**
 * The regular expression to match object keys in mapping statements.
 * @param itemName - The name of the item in the mapping statement.
 */
const makeObjectKeyRegEx = (itemName: string) => new RegExp(`{{\\s*(${itemName}.[a-zA-z_]+)\\s*}}`);

/**
 * Resolves the mapping syntax in HTML files.
 * @example
 * ```ts
 * // server/main.ts
 * app.use(injectVariables('/', {
 *  myArray: ['item1', 'item2', 'item3'],
 * });
 * ```
 * @example
 * ```html
 * <!-- index.html, before mapping -->
 * {{ myArray = (item) => (
 *   <div>{{ item }}</div>
 * )}}
 * ```
 * @example
 * ```html
 * <!-- index.html, after mapping -->
 * <div>item1</div>
 * <div>item2</div>
 * <div>item3</div>
 * ```
 * @param html - The HTML content.
 */
function resolveMappingStatements(html: string, variables: Record<string, any>): string {
  let result: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: Needed for loop
  while ((result = MAPPING_STATEMENT_REGEX.exec(html)) !== null) {
    if (!result) continue;

    const [statement, varName, itemName, content] = result;

    const array = variables[varName];

    if (!array) {
      html = html.replace(statement, '');
      continue;
    }

    if (!Array.isArray(array)) {
      throw new Error(`Variable ${varName} is used in a mapping statement, but is not an array.`);
    }

    let mappedContent = '';

    for (const item of array) {
      if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
        mappedContent += content.replace(`{{ ${itemName} }}`, item.toString());
        continue;
      }

      if (typeof item === 'object') {
        if (content.match(NESTED_KEY_REGEX)) {
          throw new Error(`Nested object keys are not supported in mapping statements`);
        }

        const OBJECT_KEY_REGEX = makeObjectKeyRegEx(itemName);

        let objectContent = content;
        
        let objectResult: RegExpExecArray | null;

        // biome-ignore lint/suspicious/noAssignInExpressions: Needed for loop
        while ((objectResult = OBJECT_KEY_REGEX.exec(objectContent)) !== null) {
          if (!objectResult) continue;

          const [_, namePlusKey] = objectResult;

          const key = namePlusKey.split(".").pop()!;

          if (!item[key]) {
            throw new Error(`Object key ${key} does not exist in item.`);
          }

          objectContent = objectContent.replace(`{{ ${namePlusKey} }}`, item[key]);
        }

        mappedContent += objectContent;
      }
    }
    
    html = html.replace(statement, mappedContent);
  }

  return html;
}

export function parseStatements(html: string, variables: Record<string, any>): string {
  html = resolveLogicStatements(html, variables);
  html = resolveMappingStatements(html, variables);

  return html;
}