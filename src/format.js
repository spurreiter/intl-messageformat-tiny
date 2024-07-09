/* SPDX-License-Identifier: MIT */
/*!
The MIT License (MIT)
Copyright (c) spurreiter
*/

const PLURAL = 'plural'
const SELECT = 'select'
const SELECT_ORDINAL = SELECT + 'ordinal'
const MATCHER_TYPES = [PLURAL, SELECT, SELECT_ORDINAL]

const FORMATS = {
  number: {
    integer: {
      maximumFractionDigits: 0
    },
    currency: {
      style: 'currency'
    },
    percent: {
      style: 'percent'
    }
  },
  date: {
    short: {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit'
    },
    medium: {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    },
    long: {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    },
    full: {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }
  },
  time: {
    short: {
      hour: 'numeric',
      minute: 'numeric',
      second: undefined
    },
    medium: {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    },
    long: {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short'
    },
    full: {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short'
    }
  }
}

const splitOptionArgs = {
  number: [FORMATS.number],
  date: [FORMATS.date],
  time: [FORMATS.time, FORMATS.time.medium]
}

/**
 * @private
 * @param {number} level
 * @returns {boolean}
 */
const isEven = (level) => level % 2 === 0

/**
 * split key-value pairs e.g. `key/val test/1 foo/bar` into object
 * e.g. `{ key: 'val', test: '1', foo: 'bar' }`
 * @private
 * @param {string[]} opts
 * @param {any[]} formats
 * @returns {{[key: string]: string}}
 */
const splitKeyVals = (opts, [formats, def = {}, sep = '/']) =>
  opts.reduce(
    (curr, keyVal) => {
      const [key] = keyVal.split(sep, 1)
      const val = keyVal.slice(key.length + 1)
      if (!val?.length && formats[key]) {
        Object.assign(curr, formats[key])
      } else {
        curr[key] = val
      }
      return curr
    },
    { ...def }
  )

/**
 * @private
 * @param {{
 *  part: string
 *  level: number
 *  prop?: string
 *  type?: string
 *  options?: object
 * }} param0
 * @returns {null|{
 *  level: number
 *  str: string
 * }|{
 *  level: number
 *  prop: string
 *  parts?: object[]
 *  type?: string
 *  options?: object
 * }}
 */
const block = ({
  part,
  level,
  prop: _prop,
  type: _type,
  options: _options
}) => {
  if (isEven(level)) {
    return { str: part, level }
  }

  let options = {}
  let [prop, type, _option] = part.split(',').map((s) => s.trim())
  if (!prop) {
    return null
  }
  if (!type && _type) {
    // mix with values from cache
    _option = prop
    // @ts-expect-error
    prop = _prop
    type = _type
    options = _options
  }

  let option
  let parts

  const optionParts = _option?.split(/\s+/) || []
  const splitArgs = splitOptionArgs[type]
  if (splitArgs) {
    options = splitKeyVals(optionParts, splitArgs)
  } else {
    option = optionParts.slice(-1)[0]
    options = { ...options, ...splitKeyVals(optionParts, [{}, {}, ':']) }
    parts = options[option] = []
  }
  if (!_option && MATCHER_TYPES.includes(type)) {
    throw new TypeError(`type "${type}" needs a matcher`)
  }

  return { prop, type, options, level, parts }
}

/**
 * parses message into ast
 * @param {string} message
 * @returns {object[]} parsed ast
 */
export function parse (message) {
  let part = ''
  let level = 0
  const parts = []
  const cache = {}
  const refs = { 0: parts }

  for (let i = 0; i < message.length; i++) {
    const char = message[i]
    switch (char) {
      case '{': {
        const o = block({ ...cache[level], part, level })
        // @ts-expect-error
        if (o.str) {
          refs[level].push(o)
        }
        cache[level] = o
        level++
        // @ts-expect-error
        refs[level] = o.parts
        part = ''
        break
      }
      case '}': {
        const o = block({ ...cache[level], part, level })
        if (refs[level]) {
          if (o) refs[level].push(o)
        } else {
          refs[level - 1].push(o || cache[level])
          cache[level] = null
        }
        level--
        part = ''
        delete cache[level + 1]
        break
      }
      default: {
        part += char
      }
    }
  }
  const o = block({ ...cache[level], part, level })
  // @ts-expect-error
  if (o.str) {
    refs[level].push(o)
  }
  return parts
}

/**
 * @private
 * @param {object[]} ast
 * @param {object} values
 * @param {string} lng
 * @returns {string}
 */
const formatPart = (ast, values, lng) => {
  const strings = []
  let matchFound

  for (let i = 0; i < ast.length; i++) {
    const { str, prop, type, options } = ast[i]
    if (str) {
      strings.push(str)
      continue
    }
    if (!prop) {
      continue
    }
    if (!type) {
      const str = String(values[prop] ?? `{${prop}}`)
      strings.push(str)
      continue
    }
    if (matchFound === type) {
      continue
    }
    matchFound = undefined

    switch (type) {
      case 'number': {
        const value = Number(values[prop])
        const str = new Intl.NumberFormat(lng, options).format(value)
        strings.push(str)
        break
      }
      case 'date': {
        const date = values[prop]
        const str = new Intl.DateTimeFormat(lng, options).format(date)
        strings.push(str)
        break
      }
      case 'time': {
        const date = values[prop]
        const str = new Intl.DateTimeFormat(lng, options).format(date)
        strings.push(str)
        break
      }
      case PLURAL: {
        const offset = Number(options.offset || 0)
        const value = Number(values[prop])
        const rule = new Intl.PluralRules(lng).select(value)

        const parts = options[`=${value}`] || options[rule] || options.other
        if (!parts) {
          throw new TypeError(`type "${type}" needs an "other" match`)
        }
        const str = formatPart(parts, values, lng).replace(
          '#',
          '' + (value - offset)
        )
        strings.push(str)
        break
      }
      case SELECT: {
        const value = values[prop]
        const parts = options[value] || options.other
        if (!parts) {
          throw new TypeError(`type "${type}" needs an "other" match`)
        }
        const str = formatPart(parts, values, lng)
        strings.push(str)
        break
      }
      case SELECT_ORDINAL: {
        const offset = Number(options.offset || 0)
        const value = Number(values[prop])
        const rule = new Intl.PluralRules(lng, { type: 'ordinal' }).select(
          value
        )
        const parts = options[`=${value}`] || options[rule] || options.other
        if (!parts) {
          throw new TypeError(`type "${type}" needs an "other" match`)
        }
        const str = formatPart(parts, values, lng).replace(
          '#',
          '' + (value - offset)
        )
        strings.push(str)

        break
      }
    }
  }
  return strings.join('')
}

/**
 * @param {string} message
 * @param {object} [values]
 * @param {string} [lng='en']
 * @returns {string}
 */
export function format (message = '', values = {}, lng = 'en') {
  if (!message.includes('{')) {
    return message
  }
  const ast = parse(message)
  const str = formatPart(ast, values, lng)
  return str
}

/**
 * format with caching
 * @returns {(message: string, values?: object, lng?: string) => string}
 */
export function cached () {
  const cache = new Map()

  function format (message = '', values = {}, lng = 'en') {
    if (!message.includes('{')) {
      return message
    }
    let ast = cache.get(message)
    if (!ast) {
      ast = parse(message)
      cache.set(message, ast)
    }
    const str = formatPart(ast, values, lng)
    return str
  }

  return format
}
