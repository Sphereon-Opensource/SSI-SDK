/**
 * @public
 */

const schema = require('../plugin.schema.json')
export { schema }
export { QRCodePlugin} from './agent/QRCodePlugin'
export { SSIQRCode } from './agent/SSIQRCode';
export * from './types/IQRCodePlugin'
