import { describe, it } from 'vitest'
import { defaultGenerateDigest } from '../defaultCallbacks'
import { createIntegrity, validateIntegrity } from '../index'
// type AgentType = IDIDManager & IKeyManager & IIdentifierResolution & IJwtService & IResolver & ISDJwtPlugin & ImDLMdoc
const fs = require('node:fs')

describe('VCT Integrity', () => {
  const hasher = defaultGenerateDigest
  it('create vct integrity values for boardingpass', async () => {
    const boardingPassVCT: string = fs.readFileSync(__dirname + '/resources/BoardingPassCredential-vct.json', 'utf8')
    const boardingPassVCTIntegrity = await createIntegrity({ input: boardingPassVCT, hasher, alg: 'sha256' })
    // expect(boardingPassVCTIntegrity).toEqual('sha256-hV5MlMkg/KpZJU7haagwjgxnnsijmutXuf5QPeI6btU')
    await validateIntegrity({ input: boardingPassVCT, integrityValue: boardingPassVCTIntegrity, hasher })

    const boardingPassSchema: string = fs.readFileSync(__dirname + '/resources/boarding Pass VC Schema V1.0 sd-jwt.json', 'utf8')
    const boardingPassSchemaIntegrity = await createIntegrity({ input: boardingPassSchema, hasher, alg: 'sha256' })
    // expect(boardingPassSchemaIntegrity).toEqual('sha256-LCPRPfq0BCFVgW469g8F58ng0Nti1RL0+pir1hcQRa8')
    await validateIntegrity({ input: boardingPassSchema, integrityValue: boardingPassSchemaIntegrity, hasher })

    const boardingPassPNGLogo: string = fs.readFileSync(__dirname + '/resources/boardingpass-logo.png', 'utf8')
    const boardingPassPNGLogoIntegrity = await createIntegrity({ input: boardingPassPNGLogo, hasher, alg: 'sha256' })
    // expect(boardingPassPNGLogoIntegrity).toEqual('sha256-yu/K3O9TvEETXU58un2eMlfwWS4UnTryO9dOeIJihtM')
    await validateIntegrity({ input: boardingPassPNGLogo, integrityValue: boardingPassPNGLogoIntegrity, hasher })

    const boardingPassSVGLogo: string = fs.readFileSync(__dirname + '/resources/boardingpass.svg', 'utf8')
    const boardingPassSVGLogoIntegrity = await createIntegrity({ input: boardingPassSVGLogo, hasher, alg: 'sha256' })
    // expect(boardingPassSVGLogoIntegrity).toEqual('sha256-KC5EijLVECWtRRxGY78Z9wX2WQbFFzUKgb3pmVgOWmg')
    await validateIntegrity({ input: boardingPassSVGLogo, integrityValue: boardingPassSVGLogoIntegrity, hasher })

    console.log(
      `boardingPass schema_uri#integrity: ${boardingPassSchemaIntegrity}\r\nboardingPass rendering simple uri#integrity: ${boardingPassPNGLogoIntegrity}\r\nboardingPass rendering svg uri#integrity: ${boardingPassSVGLogoIntegrity}\r\nboardingPass vct#integrity: ${boardingPassVCTIntegrity}`,
    )
  })

  it('create vct integrity values for e-passport', async () => {
    const ePassportVCT: string = fs.readFileSync(__dirname + '/resources/ePassportCredential-vct.json', 'utf8')
    const ePassportVCTIntegrity = await createIntegrity({ input: ePassportVCT, hasher, alg: 'sha256' })
    await validateIntegrity({ input: ePassportVCT, integrityValue: ePassportVCTIntegrity, hasher })

    const ePassportSchema: string = fs.readFileSync(__dirname + '/resources/ePassport VC Schema V1.0.sd-jwt.json', 'utf8')
    const ePassportSchemaIntegrity = await createIntegrity({ input: ePassportSchema, hasher, alg: 'sha256' })
    await validateIntegrity({ input: ePassportSchema, integrityValue: ePassportSchemaIntegrity, hasher })

    const ePassportPNGLogo: string = fs.readFileSync(__dirname + '/resources/epassport-logo.png', 'utf8')
    const ePassportPNGLogoIntegrity = await createIntegrity({ input: ePassportPNGLogo, hasher, alg: 'sha256' })
    await validateIntegrity({ input: ePassportPNGLogo, integrityValue: ePassportPNGLogoIntegrity, hasher })

    const ePassportSVGLogo: string = fs.readFileSync(__dirname + '/resources/e-passport.svg', 'utf8')
    const ePassportSVGLogoIntegrity = await createIntegrity({ input: ePassportSVGLogo, hasher, alg: 'sha256' })
    await validateIntegrity({ input: ePassportSVGLogo, integrityValue: ePassportSVGLogoIntegrity, hasher })

    console.log(
      `ePassport schema_uri#integrity: ${ePassportSchemaIntegrity}\r\nePassport rendering simple uri#integrity: ${ePassportPNGLogoIntegrity}\r\nePassport rendering svg uri#integrity: ${ePassportSVGLogoIntegrity}\r\nePassport vct#integrity: ${ePassportVCTIntegrity}`,
    )
  })

  it('create vct integrity values for loyalty prograam account', async () => {
    const vct: string = fs.readFileSync(__dirname + '/resources/LoyaltyProgramAccountCredential-vct.json', 'utf8')
    const vctIntegrity = await createIntegrity({ input: vct, hasher, alg: 'sha256' })
    await validateIntegrity({ input: vct, integrityValue: vctIntegrity, hasher })

    const schema: string = fs.readFileSync(__dirname + '/resources/LoyaltyProgram Account VC Schema V0.1 sd-jwt-schema.json', 'utf8')
    const schemaIntegrity = await createIntegrity({ input: schema, hasher, alg: 'sha256' })
    await validateIntegrity({ input: schema, integrityValue: schemaIntegrity, hasher })

    const pngLogo: string = fs.readFileSync(__dirname + '/resources/loyaltyprogramaccount-icon.png', 'utf8')
    const pngLogoIntegrity = await createIntegrity({ input: pngLogo, hasher, alg: 'sha256' })
    await validateIntegrity({ input: pngLogo, integrityValue: pngLogoIntegrity, hasher })

    const svgLogo: string = fs.readFileSync(__dirname + '/resources/loyaltyprogramaccount.svg', 'utf8')
    const svgLogoIntegrity = await createIntegrity({ input: svgLogo, hasher, alg: 'sha256' })
    await validateIntegrity({ input: svgLogo, integrityValue: svgLogoIntegrity, hasher })

    console.log(
      `Loyalty Program schema_uri#integrity: ${schemaIntegrity}\r\nLoyalty Program rendering simple uri#integrity: ${pngLogoIntegrity}\r\nLoyalty Program rendering svg uri#integrity: ${svgLogoIntegrity}\r\nLoyalty Program vct#integrity: ${vctIntegrity}`,
    )
  })

  it('create vct integrity values for travel agency account', async () => {
    const vct: string = fs.readFileSync(__dirname + '/resources/travel-agency-EmployeeAgencyCredential-vct.json', 'utf8')
    const vctIntegrity = await createIntegrity({ input: vct, hasher, alg: 'sha256' })
    await validateIntegrity({ input: vct, integrityValue: vctIntegrity, hasher })

    const schema: string = fs.readFileSync(__dirname + '/resources/travel-agency VC Employee v0.1 sd-jwt-schema.json', 'utf8')
    const schemaIntegrity = await createIntegrity({ input: schema, hasher, alg: 'sha256' })
    await validateIntegrity({ input: schema, integrityValue: schemaIntegrity, hasher })

    const pngLogo: string = fs.readFileSync(__dirname + '/resources/travel-agency-vc-employee-logo.png', 'utf8')
    const pngLogoIntegrity = await createIntegrity({ input: pngLogo, hasher, alg: 'sha256' })
    await validateIntegrity({ input: pngLogo, integrityValue: pngLogoIntegrity, hasher })

    const svgLogo: string = fs.readFileSync(__dirname + '/resources/travel-agency-vc-employee.svg', 'utf8')
    const svgLogoIntegrity = await createIntegrity({ input: svgLogo, hasher, alg: 'sha256' })
    await validateIntegrity({ input: svgLogo, integrityValue: svgLogoIntegrity, hasher })

    console.log(
      `Employee Agency schema_uri#integrity: ${schemaIntegrity}\r\nEmployee Agency rendering simple uri#integrity: ${pngLogoIntegrity}\r\nEmployee Agency rendering svg uri#integrity: ${svgLogoIntegrity}\r\nEmployee Agency vct#integrity: ${vctIntegrity}`,
    )
  })
})
