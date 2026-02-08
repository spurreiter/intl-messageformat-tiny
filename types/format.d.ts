/**
 * parses message into ast
 * @param {string} message
 * @returns {object[]} parsed ast
 */
export function parse(message: string): object[];
/**
 * @param {string} message
 * @param {object} [values]
 * @param {string} [lng='en']
 * @returns {string}
 */
export function format(message?: string, values?: object, lng?: string): string;
/**
 * format with caching
 * @returns {(message: string, values?: object, lng?: string) => string}
 */
export function cached(): (message: string, values?: object, lng?: string) => string;
