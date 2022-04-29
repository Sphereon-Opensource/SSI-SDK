import { generateBls12381G2KeyPair} from '@mattrglobal/node-bbs-signatures';
import {BlsKeyManager} from "../agent/BlsKeyManager";
import {MemoryKeyStore, MemoryPrivateKeyStore} from "../agent/memory-key-store";
import {BlsKeyManagementSystem} from "../agent/BlsKeyManagementSystem";
import {IKey, TKeyType} from "../types/IIdentifier";

describe('@sphereon/ssi-sdk-bls-kms-local', () => {
    let bls: { publicKey: Uint8Array, secretKey: Uint8Array };
    let kms: BlsKeyManager;

    beforeAll(async () => {
        bls = await generateBls12381G2KeyPair();
        kms = new BlsKeyManager({ store: new MemoryKeyStore(),
            kms: {
                local: new BlsKeyManagementSystem
(new MemoryPrivateKeyStore()),
            }});
    })

    it('should import a BLS key', async () => {
        const myKey = {
            type: <TKeyType> 'BLS',
            privateKeyHex: Buffer.from(bls.secretKey).toString('hex'),
            publicKeyHex: Buffer.from(bls.publicKey).toString('hex')
        }
        const key = await kms.keyManagerImport({
            kid: myKey.publicKeyHex,
            privateKeyHex: myKey.privateKeyHex,
            publicKeyHex: myKey.publicKeyHex,
            kms: 'local',
            type: 'BLS'
        })
        expect(key).toEqual({
            kid: myKey.publicKeyHex,
            kms: 'local',
            meta: {
              algorithms: ['BLS']
            },
            publicKeyHex: myKey.publicKeyHex,
            type: 'BLS'
        });
    })

    it("should get key management systems", async () => {
        await expect(kms.keyManagerGetKeyManagementSystems()).resolves.toEqual(["local"]);
    })

    it("should get BLS key",async () => {
        await expect(kms.keyManagerGet({ kid: Buffer.from(bls.publicKey).toString('hex') }))
    })

    it("should create a BLS key", async () => {
        await expect(kms.keyManagerCreate({
            kms: "local",
            type: "BLS"
        })).resolves.toEqual(expect.objectContaining({
            kms: "local",
            type: "BLS",
            meta: {
                algorithms: ['BLS']
            }
        }));
    })

    it("should sign with a BLS key", async() => {
        const key: IKey = await kms.keyManagerGet({ kid: Buffer.from(bls.publicKey).toString('hex') }) as IKey;
        await expect(kms.keyManagerSign({
            keyRef: key.kid,
            data: [
                Uint8Array.from(Buffer.from("test data"))
            ]
        })).resolves.toEqual("true");
    })

    it("should delete a bls key", async() => {
        await expect(kms.keyManagerDelete({ kid: Buffer.from(bls.publicKey).toString('hex') })).resolves.toBeTruthy();
    })
})