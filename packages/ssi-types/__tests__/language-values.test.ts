import {mapLanguageValues,} from '../src'

const claims = {
    langkey1: {language: "english", value: "yes1"},
    langkey2: [{language: "english", value: "yes2"}, {language: "dutch", value: "ja2"}],
    subLangClaim: {
        langkey3: [{language: "English", value: "yes3"}, {language: "Dutch", value: "ja3"}],
        random: "string",
        object: {
            language: "english", notvalue: "no"
        },
        anotherObject: {
            myNumber: 1,
            myNumberArray: [1, 2],
            myString: "abc",
            myStringArray: ["abc", "def"]
        }
    }
}
describe('Language object values', () => {
    it('should convert claims into expected result ', () => {
        const result = mapLanguageValues(claims)
        expect(JSON.stringify(result)).toEqual({
            "langkey1": "yes1",
            "langkey2": "yes2",
            "subLangClaim": {
                "langkey3": "yes3",
                "random": "string",
                "object": {"language": "english", "notvalue": "no"},
                "anotherObject": {
                    "myNumber": 1,
                    "myNumberArray": [1, 2],
                    "myString": "abc",
                    "myStringArray": ["abc", "def"]
                }
            }
        })
    })


})
