/* SPDX-License-Identifier: MIT */
/*!
The MIT License (MIT)
Copyright (c) spurreiter
*/

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

/**
 * @private
 * @param {number} level
 * @returns {boolean}
 */
const isEven = level => level % 2 === 0

/**
 * @private
 * @param {{
 *  part: string
 *  level: number
 *  prop?: string
 *  type?: string
 * }} param0
 * @returns {{}|{
 *  str: string
 *  level: number
 * }|{
 *  prop: string
 *  level: number
 *  parts: []
 *  type?: string
 *  opts?: string
 * }}
 */
const block = ({ part, level, prop: _prop, type: _type }) => {
  if (isEven(level)) {
    return { str: part, level }
  }
  let [prop, type, opts] = part.split(',').map(s => s.trim())
  if (!prop) {
    return {}
  }
  if (!type && _type) {
    opts = prop
    // @ts-expect-error
    prop = _prop
    type = _type
  }
  return { prop, type, opts, level, parts: [] }
}

/**
 * @private
 * @param {number} level
 * @returns {number}
 */
const even = level => Math.floor(level / 2)

/**
 * split key-value pairs e.g. `key/val test/1 foo/bar` into object
 * e.g. `{ key: 'val', test: '1', foo: 'bar' }`
 * @private
 * @param {string} opts
 * @param {object} formats
 * @returns {{[key: string]: string}}
 */
const splitKeyVals = (opts, formats, def = {}) => opts.split(/([a-zA-Z0-9]+(?:\/\S+|))\s/)
  .reduce((curr, keyVal) => {
    const [key, val] = keyVal.split('/')
    if (val === undefined) {
      Object.assign(curr, formats[key])
    } else {
      curr[key] = val
    }
    return curr
  }, { ...def })

/**
 * parses message into ast
 * @param {string} message
 * @returns {object[]} parsed ast
 */
export function parse (message) {
  let part = ''
  let level = 0
  let sub = 0
  const cache = {}
  const parts = []
  const refs = { 0: parts }

  for (let i = 0; i < message.length; i++) {
    const char = message[i]
    switch (char) {
      case '{': {
        const o = block({ ...cache[level], part, level })
        // @ts-expect-error
        if (o.str || o.prop) refs[sub].push(o)
        cache[level] = o
        level += 1
        sub = even(level)
        // @ts-expect-error
        if (o.parts) refs[sub] = o.parts
        part = ''
        break
      }
      case '}': {
        const o = block({ ...cache[level], part, level })
        // @ts-expect-error
        if (o.str || o.prop) refs[sub].push(o)
        level -= 1
        sub = even(level)
        part = ''
        delete cache[level + 1];
        break
      }
      default: {
        part += char
      }
    }
  }
  const o = block({ ...cache[level], part, level })
  // @ts-expect-error
  if (o.str || o.prop) refs[sub].push(o)
  // console.dir(parts, { depth: null })
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
  const strs = []
  let matchFound

  for (let i = 0; i < ast.length; i++) {
    const { str, prop, type, opts = '', parts } = ast[i]
    if (str) {
      strs.push(str)
      continue
    }
    if (!prop) {
      continue
    }
    if (!type) {
      const str = String(values[prop] ?? `{${prop}}`)
      strs.push(str)
      continue
    }
    if (matchFound === type) {
      continue
    }
    matchFound = undefined

    switch (type) {
      case 'number': {
        const value = Number(values[prop])
        if (!opts) {
          strs.push(value)
          break
        }
        const options = splitKeyVals(opts, FORMATS.number)
        const str = new Intl.NumberFormat(lng, options).format(value)
        strs.push(str)
        break
      }
      case 'plural': {
        if (!opts) {
          throw new TypeError(`type "${type}" needs a matcher`)
        }
        const value = Number(values[prop])
        const rule = new Intl.PluralRules(lng).select(value)

        if ((opts[0] === '=' && value === Number(opts.slice(1))) ||
          (rule === opts && opts[0] !== '=') || opts === 'other'
        ) {
          matchFound = type
          const str = formatPart(parts, values, lng).replace('#', '' + value)
          strs.push(str)
        }
        if (!matchFound && ast[i + 1]?.type !== type) {
          throw new TypeError(`type "${type}" needs an "other" match`)
        }
        break
      }
      case 'select': {
        if (!opts) {
          throw new TypeError(`type "${type}" needs a matcher`)
        }
        const value = values[prop]
        if (value === opts || opts === 'other') {
          matchFound = type
          const str = formatPart(parts, values, lng)
          strs.push(str)
        }
        if (!matchFound && ast[i + 1]?.type !== type) {
          throw new TypeError(`type "${type}" needs an "other" match`)
        }
        break
      }
      case 'selectordinal': {
        if (!opts) {
          throw new TypeError(`type "${type}" needs a matcher`)
        }
        const value = Number(values[prop])
        const rule = new Intl.PluralRules(lng, { type: 'ordinal' }).select(value)
        if ((opts[0] === '=' && value === Number(opts.slice(1))) ||
          (rule === opts && opts[0] !== '=') || opts === 'other'
        ) {
          matchFound = type
          const str = formatPart(parts, values, lng).replace('#', '' + value)
          strs.push(str)
        }
        if (!matchFound && ast[i + 1]?.type !== type) {
          throw new TypeError(`type "${type}" needs an "other" match`)
        }
        break
      }
      case 'date': {
        const date = values[prop]
        const options = splitKeyVals(opts, FORMATS.date)
        const str = new Intl.DateTimeFormat(lng, options).format(date)
        strs.push(str)
        break
      }
      case 'time': {
        const date = values[prop]
        const options = splitKeyVals(opts, FORMATS.time, FORMATS.time.medium)
        const str = new Intl.DateTimeFormat(lng, options).format(date)
        strs.push(str)
        break
      }
    }
  }
  return strs.join('')
}

/**
 * @param {string} message
 * @param {object} values
 * @param {string} [lng='en']
 */
export function format (message = '', values = {}, lng = 'en') {
  if (!message.includes('{')) {
    return message
  }
  const ast = parse(message)
  const str = formatPart(ast, values, lng)
  return str
}
