import { expect } from 'chai'
import { format } from '../src/format.js'

// import { IntlMessageFormat } from 'intl-messageformat'
// const format = (elem, values, locale = 'en-UK') => new IntlMessageFormat(elem, locale).format(values)
// const expect = val => ({ equal: () => {} })

describe('format', function () {
  describe('simple', function () {
    it('simple argument', function () {
      expect(format('Hello {who}', { who: 'everyone' }))
        .equal('Hello everyone')
    })
    it('simple argument array like', function () {
      expect(format('Hello {0}, who {1} this.', { 0: 'everyone', 1: 'likes' }))
        .equal('Hello everyone, who likes this.')
    })
    it('simple argument no value', function () {
      expect(format('Hello {who}', {}))
        .equal('Hello {who}')
    })
    it('simple argument no content', function () {
      expect(format('Hello {who}', { who: '' }))
        .equal('Hello ')
    })
  })

  describe('number', function () {
    it('number type', function () {
      expect(format('I have {numCats, number} cats.', { numCats: 5 }))
        .equal('I have 5 cats.')
    })
    it('number type percent', function () {
      expect(format('Almost {pctBlack, number, percent} of them are black.', { pctBlack: 0.415 }))
        .equal('Almost 42% of them are black.')
    })
    it('number type integer', function () {
      expect(format('Almost {black, number, integer} of them are black.', { black: 2.415 }))
        .equal('Almost 2 of them are black.')
    })
    it('number type currency', function () {
      expect(format('The price of this bagel is {num, number, signDisplay/always style/currency currency/GBP}', { num: 5.12 }))
        .equal('The price of this bagel is +£5.12')
    })
  })

  describe('date', function () {
    const start = new Date('2022-01-02T12:34:56Z')
    it('date type', function () {
      expect(format('Sale begins {start, date}', { start }, 'en-UK'))
        .equal('Sale begins 02/01/2022')
    })
    it('date type short', function () {
      expect(format('Sale begins {start, date, short}', { start }, 'en-UK'))
        .equal('Sale begins 02/01/22')
    })
    it('date type medium', function () {
      expect(format('Sale begins {start, date, medium}', { start }, 'en-UK'))
        .equal('Sale begins 2 Jan 2022')
    })
    it('date type long', function () {
      expect(format('Sale begins {start, date, long}', { start }, 'en-UK'))
        .equal('Sale begins 2 January 2022')
    })
    it('date type full', function () {
      expect(format('Sale begins {start, date, full}', { start }, 'en-UK'))
        .equal('Sale begins Sunday, 2 January 2022')
    })
    it('date type full en', function () {
      expect(format('Sale begins {start, date, full}', { start }))
        .equal('Sale begins Sunday, January 2, 2022')
    })
    it('date type custom', function () {
      expect(format('Sale begins {start, date, dateStyle/short timeStyle/short}', { start }))
        .equal('Sale begins 1/2/22, 1:34 PM')
    })
  })

  describe('time', function () {
    const expires = new Date('2022-01-02T12:34:56Z')
    it('time type', function () {
      expect(format('Coupon expires at {expires, time}', { expires }, 'en-UK'))
        .equal('Coupon expires at 13:34:56')
    })
    it('time type short', function () {
      expect(format('Coupon expires at {expires, time, short}', { expires }, 'en-UK'))
        .equal('Coupon expires at 13:34')
    })
    it('time type medium', function () {
      expect(format('Coupon expires at {expires, time, medium}', { expires }, 'en-UK'))
        .equal('Coupon expires at 13:34:56')
    })
    it('time type long', function () {
      expect(format('Coupon expires at {expires, time, long}', { expires }, 'en-UK'))
        .equal('Coupon expires at 13:34:56 CET')
    })
    it('time type full', function () {
      expect(format('Coupon expires at {expires, time, full}', { expires }, 'en-UK'))
        .equal('Coupon expires at 13:34:56 CET')
    })
  })

  describe('select', function () {
    const elem = '{gender, select, male {He} female {She} other {They}} will respond shortly.'
    it('select type', function () {
      expect(format(elem, { gender: 'female' }))
        .equal('She will respond shortly.')
    })
    it('select type gender=foo', function () {
      expect(format(elem, { gender: 'foo' }))
        .equal('They will respond shortly.')
    })
    it('select type without other', function () {
      try {
        format('{gender, select, male {He} female {She}} will respond shortly.', { gender: 'foo' })
        throw new Error('fail')
      } catch (e) {
        expect(e.message).equal('type "select" needs an "other" match')
      }
    })
    it('select type nested', function () {
      const elem = '{taxableArea, select, yes {An additional {taxRate, number, style/percent} tax will be collected.} other {No taxes apply.} }'

      expect(format(elem, { taxableArea: 'yes', taxRate: 0.2 }))
        .equal('An additional 20% tax will be collected.')

      expect(format(elem, { taxableArea: 'no', taxRate: 0.2 }))
        .equal('No taxes apply.')
    })
  })

  describe('plural', function () {
    const elem = 'You have {itemCount, plural, =0 {no items} one {one item} other {{itemCount} items}}.'
    it('plural type', function () {
      expect(format(elem, { itemCount: 0 }))
        .equal('You have no items.')
    })
    it('plural type 1 item', function () {
      expect(format(elem, { itemCount: 1 }))
        .equal('You have one item.')
    })
    it('plural type 12 items', function () {
      expect(format(elem, { itemCount: 12 }))
        .equal('You have 12 items.')
    })
    it('issue 1', function () {
      const message = '{value, plural, =0 {no Person} =1 {one Person} other {# Persons}}'
      expect(format(message, { value: 1 }))
        .equal('one Person')
    })
  })

  describe('selectordinal', function () {
    const elem = "It's my cat's {year, selectordinal,  one {#st}  two {#nd}  few {#rd}  other {#th}} birthday!"
    it('selectordinal type 1st', function () {
      expect(format(elem, { year: 1 }))
        .equal("It's my cat's 1st birthday!")
    })
    it('selectordinal type 2nd', function () {
      expect(format(elem, { year: 2 }))
        .equal("It's my cat's 2nd birthday!")
    })
    it('selectordinal type 3rd', function () {
      expect(format(elem, { year: 3 }))
        .equal("It's my cat's 3rd birthday!")
    })
    it('selectordinal type 7th', function () {
      expect(format(elem, { year: 7 }))
        .equal("It's my cat's 7th birthday!")
    })
  })
})
