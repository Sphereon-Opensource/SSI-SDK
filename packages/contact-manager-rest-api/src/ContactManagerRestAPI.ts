// noinspection JSUnusedGlobalSymbols

import * as dotenv from 'dotenv-flow'
import express, { Express, Response } from 'express'
import cookieParser from 'cookie-parser'

import bodyParser from 'body-parser'
import { TAgent } from '@veramo/core'
import {
  IAddContactArgs,
  IAddContactTypeArgs,
  IAddIdentityArgs,
  IContactManager,
  IGetContactsArgs,
  IGetContactTypesArgs,
  IGetIdentitiesArgs,
} from '@sphereon/ssi-sdk.contact-manager'
import { FindOptionsWhere } from 'typeorm'
import { AddContact, AddContactType, AddIdentity } from '@sphereon/vdx.ecmo'
import { ContactEntity } from '@sphereon/ssi-sdk.data-store/src/entities/contact/ContactEntity'

export interface IContactManagerRestAPIOpts {
  port?: number // The port to listen on
  cookieSigningKey?: string
  hostname?: string // defaults to "0.0.0.0", meaning it will listen on all IP addresses. Can be an IP address or hostname
}

export class ContactManagerRestAPI {
  private express: Express
  private agent: TAgent<IContactManager>
  private _opts?: IContactManagerRestAPIOpts
  private hostname: string
  private port: number

  constructor(args: { agent: TAgent<IContactManager>; express?: Express; opts?: IContactManagerRestAPIOpts }) {
    const { agent, opts } = args
    this.agent = agent
    this._opts = opts
    const existingExpress = !!args.express
    this.express = existingExpress ? args.express! : express()
    this.setupExpress(existingExpress)
    this.hostname = opts?.hostname ? opts.hostname : '0:0:0:0'
    this.port = opts?.port ? opts.port : 3000
    // endpoints
    this.createContactEndpoints()
    this.createContactTypeEndpoints()
    this.createIdentityEndpoints()
    this.createRelationshipEndpoints()
  }

  private setupExpress(existingExpress: boolean) {
    dotenv.config()
    if (!existingExpress) {
      const port = this._opts?.port || process.env.PORT || 5000
      const secret = this._opts?.cookieSigningKey || process.env.COOKIE_SIGNING_KEY
      const hostname = this._opts?.hostname || '0.0.0.0'
      this.express.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*')
        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')

        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')

        // Set to true if you need the website to include cookies in the requests sent
        // to the API (e.g. in case you use sessions)
        res.setHeader('Access-Control-Allow-Credentials', 'true')
        next()
      })
      // this.express.use(cors({ credentials: true }));
      // this.express.use('/proxy', proxy('www.gssoogle.com'));
      this.express.use(bodyParser.urlencoded({ extended: true }))
      this.express.use(bodyParser.json())
      this.express.use(cookieParser(secret))
      this.express.listen(port as number, hostname, () => console.log(`Listening on ${hostname}, port ${port}`))
    }
  }

  private static sendErrorResponse(response: Response, statusCode: number, message: string) {
    response.statusCode = statusCode
    try {
      response.status(statusCode).send(JSON.stringify(message))
    } catch (error) {
      console.error(JSON.stringify(error))
      response.status(500).send()
    }
  }

  private createContactEndpoints() {
    this.express.get(`${this.hostname}:${this.port}/contacts`, async (request, response) => {
      try {
        const filter: FindOptionsWhere<ContactEntity>[] | undefined = request.query.filter as FindOptionsWhere<ContactEntity>[]
        return await this.agent.cmGetContacts({ filter } as IGetContactsArgs)
      } catch (error) {
        console.error(error)
        return ContactManagerRestAPI.sendErrorResponse(response, 500, 'Could not get contacts')
      }
    })
    this.express.post(`${this.hostname}:${this.port}/contacts`, async (request, response) => {
      try {
        const addContact: AddContact = request.body as AddContact
        return await this.agent.cmAddContact({ ...addContact } as IAddContactArgs)
      } catch (error) {
        console.error(error)
        return ContactManagerRestAPI.sendErrorResponse(response, 500, 'Could not add contact')
      }
    })
    this.express.delete(`${this.hostname}:${this.port}/contacts/:contactId`, async (request, response) => {
      try {
        const contactId = request.params.contactId
        return await this.agent.cmRemoveContact({ contactId })
      } catch (error) {
        console.error(error)
        return ContactManagerRestAPI.sendErrorResponse(response, 500, 'Could not remove the contact.')
      }
    })
    this.express.get(`${this.hostname}:${this.port}/contacts/:contactId`, async (request, response) => {
      try {
        const contactId = request.params.contactId
        return await this.agent.cmGetContact({ contactId })
      } catch (error) {
        console.error(error)
        return ContactManagerRestAPI.sendErrorResponse(response, 500, 'Could not get the contact.')
      }
    })
    this.express.put(`${this.hostname}:${this.port}/contacts/:contactId`, async (request, response) => {
      try {
        const contactId = request.params.contactId
        const updateContact = request.body
        return await this.agent.cmUpdateContact({ ...updateContact, id: contactId })
      } catch (error) {
        console.error(error)
        return ContactManagerRestAPI.sendErrorResponse(response, 500, 'Could not update the contact.')
      }
    })
    this.express.get(`${this.hostname}:${this.port}/contacts/:contactId/relations`, async (request, response) => {
      try {
        const contactId = request.params.contactId
        // fixme: this should change. we don't have a good method for this
        return await this.agent.cmGetRelationships({ contactId })
      } catch (error) {
        console.error(error)
        return ContactManagerRestAPI.sendErrorResponse(response, 500, 'Could not get the relationships for the contact.')
      }
    })
  }

  private createContactTypeEndpoints() {
    this.express.get(`${this.hostname}:${this.port}/contact-types`, async (request, response) => {
      try {
        const filter: FindOptionsWhere<IPartialContactType>[] | undefined = request.query.filter as FindOptionsWhere<ContactEntity>[]
        // for some weird reason I can't see the cmGetContactTypes
        return await this.agent.cmGetContactTypes({ filter } as IGetContactTypesArgs)
      } catch (error) {
        console.error(error)
        return ContactManagerRestAPI.sendErrorResponse(response, 500, 'Could not get contact-types')
      }
    })
    this.express.post(`${this.hostname}:${this.port}/contact-types`, async (request, response) => {
      try {
        const addContactType: IAddContactTypeArgs = request.body as AddContactType
        // for some weird reason I can't see the cmAddContactType
        return await this.agent.cmAddContactType({ ...addContactType } as IAddContactTypeArgs)
      } catch (error) {
        console.error(error)
        return ContactManagerRestAPI.sendErrorResponse(response, 500, 'Could not add contact-type')
      }
    })
    this.express.delete(`${this.hostname}:${this.port}/contact-types/:contactTypeId`, async (request, response) => {
      try {
        const contactTypeId = request.params.contactTypeId
        // for some weird reason I can't see the cmRemoveContactType
        return await this.agent.cmRemoveContactType({ contactTypeId })
      } catch (error) {
        console.error(error)
        return ContactManagerRestAPI.sendErrorResponse(response, 500, 'Could not remove the contact-type.')
      }
    })
    this.express.get(`${this.hostname}:${this.port}/contact-types/:contactTypeId`, async (request, response) => {
      try {
        const contactTypeId = request.params.contactTypeId
        // for some weird reason I can't see the cmGetContactType
        return await this.agent.cmGetContactType({ id: contactTypeId })
      } catch (error) {
        console.error(error)
        return ContactManagerRestAPI.sendErrorResponse(response, 500, 'Could not get the contact-type.')
      }
    })
    this.express.put(`${this.hostname}:${this.port}/contact-types/:contactTypeId`, async (request, response) => {
      try {
        const contactTypeId = request.params.contactTypeId
        const updateContactType = request.body
        return await this.agent.cmUpdateContactType({ ...updateContactType, id: contactTypeId })
      } catch (error) {
        console.error(error)
        return ContactManagerRestAPI.sendErrorResponse(response, 500, 'Could not update the contact-type.')
      }
    })
  }

  private createIdentityEndpoints() {
    this.express.get(`${this.hostname}:${this.port}/identites`, async (request, response) => {
      try {
        const filter: FindOptionsWhere<IdentityEntity>[] | undefined = request.query.filter as FindOptionsWhere<IdentityEntity>[]
        return await this.agent.cmGetIdentities({ filter } as IGetIdentitiesArgs)
      } catch (error) {
        console.error(error)
        return ContactManagerRestAPI.sendErrorResponse(response, 500, 'Could not get identites')
      }
    })
    this.express.post(`${this.hostname}:${this.port}/identities`, async (request, response) => {
      try {
        const addIdentity: AddIdentity = request.body as AddIdentity
        return await this.agent.cmAddIdentity({ ...addIdentity } as IAddIdentityArgs)
      } catch (error) {
        console.error(error)
        return ContactManagerRestAPI.sendErrorResponse(response, 500, 'Could not add identity')
      }
    })
    this.express.delete(`${this.hostname}:${this.port}/identities/:identityId`, async (request, response) => {
      try {
        const identityId = request.params.identityId
        return await this.agent.cmRemoveIdentity({ identityId })
      } catch (error) {
        console.error(error)
        return ContactManagerRestAPI.sendErrorResponse(response, 500, 'Could not remove the identity.')
      }
    })
    this.express.get(`${this.hostname}:${this.port}/identities/:identityId`, async (request, response) => {
      try {
        const identityId = request.params.identityId
        return await this.agent.cmGetIdentity({ identityId })
      } catch (error) {
        console.error(error)
        return ContactManagerRestAPI.sendErrorResponse(response, 500, 'Could not get the identity.')
      }
    })
    this.express.put(`${this.hostname}:${this.port}/identities/:identityId`, async (request, response) => {
      try {
        const identityId = request.params.identityId
        const updateIdentity = request.body
        return await this.agent.cmUpdateIdentity({ ...updateIdentity, id: identityId })
      } catch (error) {
        console.error(error)
        return ContactManagerRestAPI.sendErrorResponse(response, 500, 'Could not update the identity.')
      }
    })
  }
}
