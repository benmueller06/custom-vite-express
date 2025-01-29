import { consola } from 'consola';

interface ErrorDetails {
  path: string;
  line: number;
  column: number;
}

class PartialsError extends Error {
  name: string;
  message: string;

  constructor(message: string, details: ErrorDetails) {
    super();
    this.message = message;
    this.name = 'PartialsError';

    consola.error(`${this.message}\n          at ${details.path}:${details.line}:${details.column}`);
    process.exit(1);
  }
}

export { PartialsError };