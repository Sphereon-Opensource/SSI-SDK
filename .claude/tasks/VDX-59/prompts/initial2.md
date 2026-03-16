# Description

We need to create a Veramo module called `credential-design-manager` that manages credential designs. this module needs to have basic CRUD actions.

actions:
* cdmGetCredentialDesign
* cdmAddCredentialDesign
* cdmUpdateCredentialDesign
* cdmRemoveCredentialDesign

where `cdm` is an action prefix to make the action names unique.

We can just base the module structure on `./packages/contact-manager`
* __tests__ folder with shared folder and localAgent.test.ts and restAgent.test.ts
* src/agent/CredentialDesignManager.ts file
* src/types/ICredentialDesignManager.ts file
* agent.yml
* api-extractor.json

and the other files

**NOTE** the actions can be dummy actions for now that just throw Error(`NOT IMPLEMENTED YET`). we will do the implementation later

# important
* take C:\Git\Sphereon-Opensource\ssi-sdk\packages\contact-manager as reference
* take "C:\Git\Sphereon-Opensource\ssi-sdk\packages\data-store\src\contact\ContactStore.ts" as reference

# tasks

1. create the credential-design-manager module
2. use contact-manager module as a template
3. create the datastore credentialDesign in the data-store module
   - look at how we created the contact datastore and use that as a template
4. finish the credential design data store "C:\Git\Sphereon-Opensource\ssi-sdk\packages\data-store\src\credentialDesign\CredentialDesignStore.ts"
   - should get the same structure as "C:\Git\Sphereon-Opensource\ssi-sdk\packages\data-store\src\contact\ContactStore.ts"
   - currently the code here was just a copy paste of what we did before in another project and we should keep the functionalities
5. finish creating the credentialDesign entities in C:\Git\Sphereon-Opensource\ssi-sdk\packages\data-store\src\entities\credentialDesign, take C:\Git\Sphereon-Opensource\ssi-sdk\packages\data-store\src\entities\contact as reference
   - look at the migration file to see which entities we need to create "C:\Git\Sphereon-Opensource\ssi-sdk\packages\data-store\src\migrations\postgres\1773657426000-AddCredentialDesigns.ts"
6. look at C:\Git\Sphereon-Opensource\ssi-sdk\packages\contact-manager\__tests__ and use that as reference to write tests for C:\Git\Sphereon-Opensource\ssi-sdk\packages\credential-design-manager
7. look at "C:\Git\Sphereon-Opensource\ssi-sdk\packages\data-store\src\__tests__\contact.entities.test.ts" and create "C:\Git\Sphereon-Opensource\ssi-sdk\packages\data-store\src\__tests__\credential-design.entities.test.ts" and write tests
8. look at "C:\Git\Sphereon-Opensource\ssi-sdk\packages\data-store\src\__tests__\contact.store.test.ts" and create "C:\Git\Sphereon-Opensource\ssi-sdk\packages\data-store\src\__tests__\credential-design-store.entities.test.ts" and write tests
9. make getOrCreateFormStepId private in credential design datastore
10. verify all tests are passing
11. verify build works for C:\Git\Sphereon-Opensource\ssi-sdk\packages\credential-design-manager
