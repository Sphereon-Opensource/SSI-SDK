import { mapLanguageValues } from '../src'

const claims = {
  langkey1: { language: 'english', value: 'yes1' },
  langkey2: [
    { language: 'english', value: 'yes2' },
    { language: 'dutch', value: 'ja2' },
  ],
  subLangClaim: {
    langkey3: [
      { language: 'English', value: 'yes3' },
      { language: 'Dutch', value: 'ja3' },
    ],
    random: 'string',
    object: {
      language: 'english',
      notvalue: 'no',
    },
    anotherObject: {
      myNumber: 1,
      myNumberArray: [1, 2],
      myString: 'abc',
      myStringArray: ['abc', 'def'],
    },
  },
}
describe('Language object values', () => {
  it('should convert claims into expected result ', () => {
    const result = mapLanguageValues(claims)
    expect(result).toEqual({
      langkey1: 'yes1',
      langkey2: 'yes2',
      subLangClaim: {
        langkey3: 'yes3',
        random: 'string',
        object: { language: 'english', notvalue: 'no' },
        anotherObject: {
          myNumber: 1,
          myNumberArray: [1, 2],
          myString: 'abc',
          myStringArray: ['abc', 'def'],
        },
      },
    })
  })

  it('should convert claims into expected result for eng lang ', () => {
    const result = mapLanguageValues(claims, { language: 'english' })
    expect(result).toEqual({
      langkey1: 'yes1',
      langkey2: 'yes2',
      subLangClaim: {
        langkey3: 'yes3',
        random: 'string',
        object: { language: 'english', notvalue: 'no' },
        anotherObject: {
          myNumber: 1,
          myNumberArray: [1, 2],
          myString: 'abc',
          myStringArray: ['abc', 'def'],
        },
      },
    })
  })

  it('should convert claims into expected result for dutch lang ', () => {
    const result = mapLanguageValues(claims, { language: 'Dutch' })
    expect(result).toEqual({
      langkey1: 'yes1',
      langkey2: 'ja2',
      subLangClaim: {
        langkey3: 'ja3',
        random: 'string',
        object: { language: 'english', notvalue: 'no' },
        anotherObject: {
          myNumber: 1,
          myNumberArray: [1, 2],
          myString: 'abc',
          myStringArray: ['abc', 'def'],
        },
      },
    })
  })

  it('should not convert array primitives ', () => {
    const result = mapLanguageValues(claims.subLangClaim.anotherObject.myNumberArray)
    expect(result).toEqual([1, 2])
  })

  it('should not convert object that does not contain language values', () => {
    const result = mapLanguageValues(claims.subLangClaim.anotherObject)
    expect(result).toEqual(claims.subLangClaim.anotherObject)
  })
})
