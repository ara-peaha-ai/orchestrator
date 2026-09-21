import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { createError } from 'h3'

// Server-side descriptors on CPU (tfjs WASM backend), no GPU. Loaded lazily, once.
// Node only (Docker/VPS): the WASM backend does not run on Cloudflare Workers.
const MAX_SIDE = 512
let loading

const load = () => loading ??= (async () => {
  const require = createRequire(import.meta.url)
  require('@tensorflow/tfjs-backend-wasm')
  const faceapi = require('@vladmandic/face-api/dist/face-api.node-wasm.js')
  await faceapi.tf.setBackend('wasm')
  await faceapi.tf.ready()

  const dir = join(dirname(require.resolve('@vladmandic/face-api/package.json')), 'model')
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(dir)
  await faceapi.nets.faceLandmark68Net.loadFromDisk(dir)
  await faceapi.nets.faceRecognitionNet.loadFromDisk(dir)
  return faceapi
})()

// face: { width, height, rgb } with rgb as base64 of width*height*3 bytes. Used and dropped, never stored.
export const descriptorFromFace = async (face) => {
  const { width, height, rgb } = face || {}
  const bytes = typeof rgb === 'string' ? Buffer.from(rgb, 'base64') : null
  const sizeOk = Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0 &&
    width <= MAX_SIDE && height <= MAX_SIDE
  if (!sizeOk || !bytes || bytes.length !== width * height * 3) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid face image' })
  }

  const faceapi = await load()
  const tensor = faceapi.tf.tensor3d(new Uint8Array(bytes), [height, width, 3])
  try {
    const found = await faceapi
      .detectAllFaces(tensor, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
      .withFaceLandmarks()
      .withFaceDescriptors()
    if (!found.length) return null
    const biggest = found.sort((a, b) => b.detection.box.area - a.detection.box.area)[0]
    return Array.from(biggest.descriptor)
  } finally {
    tensor.dispose()
  }
}
