import { expect } from 'chai'
import { cached, format, parse } from '../src/format.js'

// import { IntlMessageFormat } from 'intl-messageformat'
// const format = (elem, values, locale = 'en-UK') => new IntlMessageFormat(elem, locale).format(values)
// const expect = val => ({ equal: () => {} })

describe('format', function () {
  describe('none', function () {
    it('no argument', function () {
      expect(format('Hello')).equal('Hello')
    })
  })

  describe('simple', function () {
    it('simple argument', function () {
      expect(format('Hello {who}', { who: 'everyone' })).equal('Hello everyone')
    })

    it('simple argument array like', function () {
      expect(
        format('Hello {0}, who {1} this.', { 0: 'everyone', 1: 'likes' })
      ).equal('Hello everyone, who likes this.')
    })

    it('simple argument no value', function () {
      expect(format('Hello {who}', {})).equal('Hello {who}')
    })

    it('simple argument no content', function () {
      expect(format('Hello {who}', { who: '' })).equal('Hello ')
    })
  })

  describe('number', function () {
    it('number type', function () {
      expect(format('I have {numCats, number} cats.', { numCats: 5 })).equal(
        'I have 5 cats.'
      )
    })

    it('number type percent', function () {
      expect(
        format('Almost {pctBlack, number, percent} of them are black.', {
          pctBlack: 0.415
        })
      ).equal('Almost 42% of them are black.')
    })

    it('number type integer', function () {
      expect(
        format('Almost {black, number, integer} of them are black.', {
          black: 2.415
        })
      ).equal('Almost 2 of them are black.')
    })

    it('number type currency', function () {
      expect(
        format(
          'The price of this bagel is {num, number, signDisplay/always style/currency currency/GBP}',
          { num: 5.12 }
        )
      ).equal('The price of this bagel is +£5.12')
    })
  })

  describe('date', function () {
    const start = new Date('2022-01-02T12:34:56Z')

    it('date type', function () {
      expect(format('Sale begins {start, date}', { start }, 'en-UK')).equal(
        'Sale begins 02/01/2022'
      )
    })

    it('date type short', function () {
      expect(
        format('Sale begins {start, date, short}', { start }, 'en-UK')
      ).equal('Sale begins 02/01/22')
    })

    it('date type medium', function () {
      expect(
        format('Sale begins {start, date, medium}', { start }, 'en-UK')
      ).equal('Sale begins 2 Jan 2022')
    })

    it('date type long', function () {
      expect(
        format('Sale begins {start, date, long}', { start }, 'en-UK')
      ).equal('Sale begins 2 January 2022')
    })

    it('date type full', function () {
      expect(
        format('Sale begins {start, date, full}', { start }, 'en-UK')
      ).equal('Sale begins Sunday, 2 January 2022')
    })

    it('date type full en', function () {
      expect(format('Sale begins {start, date, full}', { start })).equal(
        'Sale begins Sunday, January 2, 2022'
      )
    })

    it('date type custom', function () {
      expect(
        format('Sale begins {start, date, dateStyle/short timeStyle/short}', {
          start
        })
      ).equal('Sale begins 1/2/22, 1:34 PM')
    })
  })

  describe('time', function () {
    const expires = new Date('2022-01-02T12:34:56Z')

    it('time type', function () {
      expect(
        format('Coupon expires at {expires, time}', { expires }, 'en-UK')
      ).equal('Coupon expires at 13:34:56')
    })

    it('time type short', function () {
      expect(
        format('Coupon expires at {expires, time, short}', { expires }, 'en-UK')
      ).equal('Coupon expires at 13:34')
    })

    it('time type medium', function () {
      expect(
        format(
          'Coupon expires at {expires, time, medium}',
          { expires },
          'en-UK'
        )
      ).equal('Coupon expires at 13:34:56')
    })

    it('time type long', function () {
      expect(
        format('Coupon expires at {expires, time, long}', { expires }, 'en-UK')
      ).equal('Coupon expires at 13:34:56 CET')
    })

    it('time type full', function () {
      expect(
        format('Coupon expires at {expires, time, full}', { expires }, 'en-UK')
      ).equal('Coupon expires at 13:34:56 CET')
    })
  })

  describe('select', function () {
    const elem =
      '{gender, select, male {He} female {She} other {They}} will respond shortly.'

    it('shall parse ast', function () {
      const ast = parse(elem)
      expect(ast).deep.equal([
        {
          prop: 'gender',
          type: 'select',
          options: {
            male: [{ str: 'He', level: 2 }],
            female: [{ str: 'She', level: 2 }],
            other: [{ str: 'They', level: 2 }]
          },
          level: 1,
          parts: [{ str: 'They', level: 2 }]
        },
        { str: ' will respond shortly.', level: 0 }
      ])
    })

    it('throws if select opts are missing', function () {
      expect(function () {
        format('You have {gender, select}', { gender: 'male' })
      })
        .throws(TypeError)
        .with.property('message', 'type "select" needs a matcher')
    })

    it('throws if select other match is missing', function () {
      expect(() =>
        format(
          '{gender, select, male {He} female {She}} will respond shortly.',
          { gender: 'other' }
        )
      )
        .throws(TypeError)
        .with.property('message', 'type "select" needs an "other" match')
    })

    it('select type', function () {
      expect(format(elem, { gender: 'female' })).equal(
        'She will respond shortly.'
      )
    })

    it('select type gender=foo', function () {
      expect(format(elem, { gender: 'foo' })).equal(
        'They will respond shortly.'
      )
    })

    it('select type without other', function () {
      try {
        format(
          '{gender, select, male {He} female {She}} will respond shortly.',
          { gender: 'foo' }
        )
        throw new Error('fail')
      } catch (e) {
        expect(e.message).equal('type "select" needs an "other" match')
      }
    })

    it('select type nested', function () {
      const elem =
        '{taxableArea, select, yes {An additional {taxRate, number, style/percent} tax will be collected.} other {No taxes apply.} }'

      const ast = parse(elem)
      expect(ast).deep.equal([
        {
          prop: 'taxableArea',
          type: 'select',
          options: {
            yes: [
              { str: 'An additional ', level: 2 },
              {
                prop: 'taxRate',
                parts: undefined,
                type: 'number',
                options: { style: 'percent' },
                level: 3
              },
              { str: ' tax will be collected.', level: 2 }
            ],
            other: [{ str: 'No taxes apply.', level: 2 }]
          },
          level: 1,
          parts: [{ str: 'No taxes apply.', level: 2 }]
        }
      ])

      expect(format(elem, { taxableArea: 'yes', taxRate: 0.2 })).equal(
        'An additional 20% tax will be collected.'
      )

      expect(format(elem, { taxableArea: 'no', taxRate: 0.2 })).equal(
        'No taxes apply.'
      )
    })
  })

  describe('select nested', function () {
    const elem =
      '{outer, select, a {{inner, select, x {AX} other {A_OTHER}}} other {OUTER_OTHER}}'

    it('shall parse ast', function () {
      const ast = parse(elem)
      console.log('%j', ast)
      expect(ast).deep.equal([
        {
          prop: 'outer',
          type: 'select',
          options: {
            a: [
              {
                prop: 'inner',
                type: 'select',
                options: {
                  x: [{ str: 'AX', level: 4 }],
                  other: [{ str: 'A_OTHER', level: 4 }]
                },
                level: 3,
                parts: [{ str: 'A_OTHER', level: 4 }]
              },
              { str: '', level: 2 }
            ],
            other: [{ str: 'OUTER_OTHER', level: 2 }]
          },
          level: 1,
          parts: [{ str: 'OUTER_OTHER', level: 2 }]
        }
      ])
    })

    it('shall format outer=a, inner=x', function () {
      expect(format(elem, { outer: 'a', inner: 'x' })).equal('AX')
    })

    it('shall format outer=a, inner=y', function () {
      expect(format(elem, { outer: 'a', inner: 'y' })).equal('A_OTHER')
    })

    it('shall format outer=b', function () {
      expect(format(elem, { outer: 'b' })).equal('OUTER_OTHER')
    })
  })

  describe('plural', function () {
    const elem =
      'You have {itemCount, plural, =0 {no items} one {one item} other {{itemCount} items}}.'

    it('parses ast', function () {
      const ast = parse(elem)
      expect(ast).deep.equal([
        { str: 'You have ', level: 0 },
        {
          prop: 'itemCount',
          type: 'plural',
          options: {
            '=0': [{ str: 'no items', level: 2 }],
            one: [{ str: 'one item', level: 2 }],
            other: [
              {
                prop: 'itemCount',
                options: { undefined: [] },
                level: 3,
                parts: [],
                type: undefined
              },
              { str: ' items', level: 2 }
            ]
          },
          level: 1,
          parts: [
            {
              prop: 'itemCount',
              options: { undefined: [] },
              level: 3,
              parts: [],
              type: undefined
            },
            { str: ' items', level: 2 }
          ]
        },
        { str: '.', level: 0 }
      ])
    })

    it('throws if plural opts are missing', function () {
      expect(function () {
        format('You have {itemCount, plural}', { itemCount: 10 })
      })
        .throws(TypeError)
        .with.property('message', 'type "plural" needs a matcher')
    })

    it('throws if plural other match is missing', function () {
      expect(function () {
        format('You have {itemCount, plural, =0 {no items}}', {
          itemCount: 10
        })
      })
        .throws(TypeError)
        .with.property('message', 'type "plural" needs an "other" match')
    })

    it('plural type', function () {
      expect(format(elem, { itemCount: 0 })).equal('You have no items.')
    })

    it('plural type 1 item', function () {
      expect(format(elem, { itemCount: 1 })).equal('You have one item.')
    })

    it('plural type 12 items', function () {
      expect(format(elem, { itemCount: 12 })).equal('You have 12 items.')
    })

    it('issue 1', function () {
      const message =
        '{value, plural, =0 {no Person} =1 {one Person} other {# Persons}}'
      expect(format(message, { value: 1 })).equal('one Person')
    })

    it('complex 1', function () {
      const message =
        'You have {count, plural, one {# unread message} other {# unread messages}}, {firstName}'
      expect(format(message, { count: 10, firstName: 'Jane' })).equal(
        'You have 10 unread messages, Jane'
      )
    })
  })

  describe('select with plural and offset', function () {
    const elem = `{genderOfHost, select, female {
      {numGuests, plural, offset:1
        =0 {{host} does not give a party.}
        =1 {{host} invites {guest} to her party.}
        =2 {{host} invites {guest} and one other person to her party.}
        other {{host} invites {guest} and # other people to her party.}
      }
    } male {
      {numGuests, plural, offset:1
        =0 {{host} does not give a party.}
        =1 {{host} invites {guest} to his party.}
        =2 {{host} invites {guest} and one other person to his party.}
        other {{host} invites {guest} and # other people to his party.}
      }
    } other {
      {numGuests, plural, offset:1
        =0 {{host} does not give a party.}
        =1 {{host} invites {guest} to their party.}
        =2 {{host} invites {guest} and one other person to their party.}
        other {{host} invites {guest} and # other people to their party.}
      }
    }}`
      .replace(/\s+/g, ' ')
      .replace(/{\s+{/g, '{{')
      .replace(/{\s+{/g, '{{')
      .replace(/}\s+}/g, '}}')
      .replace(/}\s+}/g, '}}')

    it('female, no guests', function () {
      expect(
        format(elem, { genderOfHost: 'female', host: 'Alice', numGuests: 0 })
      ).equal('Alice does not give a party.')
    })

    it('female, one guest', function () {
      expect(
        format(elem, {
          genderOfHost: 'female',
          host: 'Alice',
          guest: 'Bob',
          numGuests: 1
        })
      ).equal('Alice invites Bob to her party.')
    })

    it('female, more than one guest', function () {
      expect(
        format(elem, {
          genderOfHost: 'female',
          host: 'Alice',
          guest: 'Bob',
          numGuests: 3
        })
      ).equal('Alice invites Bob and 2 other people to her party.')
    })

    it('male', function () {
      expect(
        format(elem, {
          genderOfHost: 'male',
          numGuests: 2,
          host: 'Bob',
          guest: 'Alice'
        })
      ).equal('Bob invites Alice and one other person to his party.')
    })

    it('with # and offset', function () {
      const msg =
        'You have {itemCount, plural, offset:2 ' +
        '=0 {no items} ' +
        'one {one item} ' +
        'other {# items with offset=2}' +
        '}.'
      expect(format(msg, { itemCount: 15 })).equal(
        'You have 13 items with offset=2.'
      )
    })
  })

  describe('selectordinal', function () {
    const elem =
      "It's my cat's {year, selectordinal,  one {#st}  two {#nd}  few {#rd}  other {#th}} birthday!"

    it('throws if selectordinal opts are missing', function () {
      expect(function () {
        format("It's my cat's {year, selectordinal", { year: 1 })
      })
        .throws(TypeError)
        .with.property('message', 'type "selectordinal" needs a matcher')
    })

    it('throws if selectordinal other match is missing', function () {
      expect(function () {
        format(
          "It's my cat's {year, selectordinal, one {#st} two {#nd} few {#rd}} birthday!",
          { year: 20 }
        )
      })
        .throws(TypeError)
        .with.property('message', 'type "selectordinal" needs an "other" match')
    })

    it('selectordinal type 1st', function () {
      expect(format(elem, { year: 1 })).equal("It's my cat's 1st birthday!")
    })

    it('selectordinal type 2nd', function () {
      expect(format(elem, { year: 2 })).equal("It's my cat's 2nd birthday!")
    })

    it('selectordinal type 3rd', function () {
      expect(format(elem, { year: 3 })).equal("It's my cat's 3rd birthday!")
    })

    it('selectordinal type 7th', function () {
      expect(format(elem, { year: 7 })).equal("It's my cat's 7th birthday!")
    })
  })

  describe('cached', function () {
    it('use cache', function () {
      const format = cached()
      expect(format('Hello world!')).equal('Hello world!')
      expect(
        format('Hello {0}, who {1} this.', { 0: 'everyone', 1: 'likes' })
      ).equal('Hello everyone, who likes this.')
      expect(
        format('Hello {0}, who {1} this.', { 0: 'there', 1: 'loves' })
      ).equal('Hello there, who loves this.')
    })
  })
})
