import { adminEndpointDefs } from './admin.js'
import { invoiceEndpointDefs } from './invoices.js'

export const endpointDefs = [...adminEndpointDefs, ...invoiceEndpointDefs]
