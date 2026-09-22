import { robosatsRequest } from '../lib/robosatsRequest.js'
import { defineEventHandler } from 'h3'

export default defineEventHandler(() => robosatsRequest({ path: '/api/info/' }))
