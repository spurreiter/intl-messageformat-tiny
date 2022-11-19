# intl-messageformat-tiny

> tiny alternative to intl-messageformat

This project aims to provide a formatter with small bundle-size with similar 
functionality as [intl-messageformat][] provides.

Bundle-size minified is ~3kB compared to ~47kB

👏🏽 Credits go to all contributors of [intl-messageformat][].

**Table of Contents**

<!-- !toc (omit="intl-messageformat-tiny") -->

* [format](#format)
* [Simple Argument](#simple-argument)
* [Formatted Argument](#formatted-argument)
  * [type number](#type-number)
  * [type plural](#type-plural)
  * [type select](#type-select)
  * [type selectordinal](#type-selectordinal)
  * [type date](#type-date)
  * [type time](#type-time)
  * [nested types](#nested-types)
* [License](#license)

<!-- toc! -->

# format

Format is a function with 2-3 arguments in the form of 
`format(message, values, locale)`.

- `message` is the message with brackets `{}` which is being formatted
- `values` is the object of values used for the later formatting
- `locale` is the optional locale being used to correctly internationalize the
  message. This defaults to `en`. 

The message syntax follows [icu-syntax][] with exceptions.

# Simple Argument

You can use a `{key}` argument for placing a value into the message. The key is
looked up in the input data, and the string is interpolated with its value.

```js
format('Hello!', {})
// Hello!

format('Hello {who}!', {})
// Hello {who}!

format('Hello {who}!', {who: 'everyone'})
// Hello everyone!

format('Hello {who}, who {emotion} this!', {who: 'everyone', emotion: 'likes'})
// Hello everyone, who likes this!
```

# Formatted Argument

You use a `{key, type, format}` argument to format messages according to their
type.

The elements of the argument are:

- `key` is where in the input data to find the data
- `type` is how to interpret the value (see below)
- `format` is optional, and is a further refinement on how to display that type of data

## type number

format:
- `percent` shows value as percentage
- `integer` shows value as integer
- `currency` shows value as currency
- `[option]/value` all options from [Intl.NumberFormat()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options)

```js
format('I have {numCats, number} cats.', {numCats: 5})
// I have 5 cats.

format('Almost {pctBlack, number, percent} of them are black.', {pctBlack: 0.415})
// Almost 42% of them are black.

format('{black, number, integer} of them are black.', {black: 2.0749})
// 2 of them are black.

format('The price of this bagel is {num, number, signDisplay/always currency currency/GBP}', 
  { num: 5.12 }, 'en-UK)
// The price of this bagel is +£5.12
```

## type plural

The `{key, plural, matches}` is used to choose output based on the pluralization
rules of the current locale.

The match is a literal value and is matched to one of these plural categories.
Not all languages use all plural categories.

- `zero` : This category is used for languages that have grammar specialized
  specifically for zero number of items. (Examples are Arabic and Latvian.)
- `one` : This category is used for languages that have grammar specialized
  specifically for one item. Many languages, but not all, use this plural
  category. (Many popular Asian languages, such as Chinese and Japanese, do not
  use this category.)
- `two` : This category is used for languages that have grammar specialized
  specifically for two items. (Examples are Arabic and Welsh.)
- `few` : This category is used for languages that have grammar specialized
  specifically for a small number of items. For some languages this is used for
  2-4 items, for some 3-10 items, and other languages have even more complex
  rules.
- `many` : This category is used for languages that have grammar specialized
  specifically for a larger number of items. (Examples are Arabic, Polish, and
  Russian.)
- `other` : This category is used if the value doesn't match one of the other
  plural categories. Note that this is used for "plural" for languages (such as
  English) that have a simple "singular" versus "plural" dichotomy.
- `=value` : This is used to match a specific value regardless of the plural
  categories of the current locale.

> 🔥 **DANGER**: `other` is required and shall be at the last matching position.

> ℹ️ **INFO**: You may also want to set the correct locale!

```js
const message = 
  'You have {itemCount, plural, =0 {no items} one {one item} other {{itemCount} items}}.

format(message, {itemCount: 0}, 'en')
// You have no items.

format(message, {itemCount: 1}, 'en')
// You have one item.

format(message, {itemCount: 12}, 'en')
// You have 12 items.
```

## type select

The `{key, select, matches}` is used to choose output by matching a value to one
of many choices. (It is similar to the switch statement) The `key` is looked up
in the input data. 

> 🔥 **DANGER**: `other` is required and shall be at the last matching position.

> ℹ️ **INFO**: You may also want to set the correct locale!

```js
const message = 
  '{gender, select, male {He} female {She} other {They}} will respond shortly.'

format(message, { gender: 'female' }, 'en')
// She will respond shortly.

format(message, { gender: 'foobar' }, 'en')
// They will respond shortly.
```

## type selectordinal

The `{key, selectordinal, matches}` is used to choose output based on the
ordinal pluralization rules (1st, 2nd, 3rd, etc.) of the required locale. It is
very similar to the `{plural}` format above except that the value is mapped to an
ordinal plural category.

> 🔥 **DANGER**: `other` is required and shall be at the last matching position.

> ℹ️ **INFO**: You may also want to set the correct locale!

```js
const message = 
  "It's my cat's {year, selectordinal, one {#st} two {#nd} few {#rd} other {#th}} birthday!"

format(message, {year: 1}, 'en')
// It's my cat's 1st birthday!

format(message, {year: 2}, 'en')
// It's my cat's 2nd birthday!

format(message, {year: 2}, 'en')
// It's my cat's 2nd birthday!

format(message, {year: 3}, 'en')
// It's my cat's 3rd birthday!

format(message, {year: 7}, 'en')
// It's my cat's 7th birthday!
```

## type date

This type is used to format dates in a way that is sensitive to the locale. It
understands the following values for the optional format element of the
argument:

- `short` is used to format dates in the shortest possible way
- `medium` is used to format dates with short textual representation of the month
- `long` is used to format dates with long textual representation of the month
- `full` is used to format dates with the most detail
- `[option]/value` all options from [Intl.DateTimeFormat()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat)

> ℹ️ **INFO**: Don't forget to set the locale!

```js
const start = new Date('2022-01-02T12:34:56Z') 

format('Sale begins {start, date}', { start }, 'en-UK'))
// Sale begins 02/01/2022

format('Sale begins {start, date, short}', { start }, 'en-UK')
// Sale begins 02/01/22

format('Sale begins {start, date, medium}', { start }, 'en-UK')
// Sale begins 2 Jan 2022

format('Sale begins {start, date, long}', { start }, 'en-UK')
// Sale begins 2 January 2022

format('Sale begins {start, date, full}', { start }, 'en-UK')
// Sale begins Sunday, 2 January 2022

format('Sale begins {start, date, full}', { start }, 'en-US')
// Sale begins Sunday, January 2, 2022

format('Sale begins {start, date, dateStyle/short timeStyle/short}', { start }, 'en-US)
// Sale begins 1/2/22, 1:34 PM
```

## type time

This type is used to format times in a way that is sensitive to the locale. It understands the following values for the optional format element of the argument:

- `short` is used to format times with hours and minutes
- `medium` is used to format times with hours, minutes, and seconds
- `long` is used to format times with hours, minutes, seconds, and timezone
- `full` is the same as long
- `[option]/value` all options from [Intl.DateTimeFormat()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat)

> ℹ️ **INFO**: Don't forget to set the locale!

```js
const start = new Date('2022-01-02T12:34:56Z') 

format('Coupon expires at {expires, time}', { expires }, 'en-UK')
// Coupon expires at 13:34:56

format('Coupon expires at {expires, time, short}', { expires }, 'en-UK')
// Coupon expires at 13:34

format('Coupon expires at {expires, time, medium}', { expires }, 'en-UK')
// Coupon expires at 13:34:56

format('Coupon expires at {expires, time, long}', { expires }, 'en-UK')
// Coupon expires at 13:34:56 CET

format('Coupon expires at {expires, time, full}', { expires }, 'en-UK')
// Coupon expires at 13:34:56 CET
```

## nested types

The formatted types `plural` and `select` can be nested with other types.

```js
const message = '{taxableArea, select, yes {An additional {taxRate, number, percent} tax will be collected.} other {No taxes apply.} }'

format(message, { taxableArea: 'yes', taxRate: 0.2 })
// An additional 20% tax will be collected.

format(message, { taxableArea: 'no' }))
// No taxes apply.
```

# License

[MIT licensed](./LICENSE)

[intl-messageformat]: https://github.com/formatjs/formatjs/tree/main/packages/intl-messageformat
[icu-syntax]: https://formatjs.io/docs/core-concepts/icu-syntax
