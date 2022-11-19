/**
 * parses message into ast
 * @param {string} message
 * @returns {object[]} parsed ast
 */
export function parse(message: string): object[];
/**
 * @param {string} message
 * @param {object} values
 * @param {string} [lng='en']
 */
export function format(message: string, values: object, lng?: string | undefined): string;
