import { ref } from 'vue'
import { parseAgeFromText, codeInText, euclideanDistance } from '../utils/checks.js'

export const useDontTrustVerify = () => {
  const { prefix, minAge, matchThreshold } = useRuntimeConfig().public.dontTrustVerify
  const assets = `${prefix}/assets`

  // ready = every model and OCR asset is in the browser: show "you can go offline now"
  const ready = ref(false)
  const code = ref('')
  // Raw intermediate state, meant to be displayed so the user can inspect it
  const ocrText = ref('')
  const age = ref(null)
  const distance = ref(null)

  let faceapi
  let worker

  const init = async () => {
    faceapi = await import('@vladmandic/face-api')
    await faceapi.nets.ssdMobilenetv1.loadFromUri(`${assets}/face`)
    await faceapi.nets.faceLandmark68Net.loadFromUri(`${assets}/face`)
    await faceapi.nets.faceRecognitionNet.loadFromUri(`${assets}/face`)

    const { createWorker } = await import('tesseract.js')
    worker = await createWorker('eng', 1, {
      workerPath: `${assets}/tesseract/worker.min.js`,
      corePath: `${assets}/tesseract-core`,
      langPath: `${assets}/tesseract-lang`
    })
    ready.value = true
  }

  const dispose = async () => {
    await worker?.terminate()
    ready.value = false
  }

  const requestCode = async () => {
    const res = await $fetch(`${prefix}/challenge`, { method: 'POST' })
    code.value = res.code
    return res.code
  }

  const ocr = async (image) => {
    const { data } = await worker.recognize(image)
    ocrText.value = data.text
    return data.text
  }

  // Faces in the image, biggest first
  const faces = async (image) => {
    const all = await faceapi
      .detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
      .withFaceLandmarks()
      .withFaceDescriptors()
    return all
      .sort((a, b) => b.detection.box.area - a.detection.box.area)
      .map(f => ({ vector: Array.from(f.descriptor), box: f.detection.box }))
  }

  // Square crop around a face (30% margin), 224px, RGB base64: this is all the server ever sees of a photo
  const crop = (image, { x, y, width, height }) => {
    const side = Math.max(width, height) * 1.6
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 224
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, x + width / 2 - side / 2, y + height / 2 - side / 2, side, side, 0, 0, 224, 224)
    const rgba = ctx.getImageData(0, 0, 224, 224).data
    const rgb = new Uint8Array(224 * 224 * 3)
    for (let i = 0, j = 0; i < rgba.length; i += 4) {
      rgb[j++] = rgba[i]
      rgb[j++] = rgba[i + 1]
      rgb[j++] = rgba[i + 2]
    }
    let binary = ''
    for (let i = 0; i < rgb.length; i += 0x8000) binary += String.fromCharCode(...rgb.subarray(i, i + 0x8000))
    return { width: 224, height: 224, rgb: btoa(binary) }
  }

  // photo: selfie holding the ID and the sheet with the code.
  // idScan: optional close-up of the same ID, used only when the date of birth is unreadable in `photo`.
  // The ID, the sheet and the date of birth never leave the browser: the server gets the code,
  // the age verdict and a crop of the person's face only.
  const verify = async (photo, idScan) => {
    const text = await ocr(photo)
    if (!codeInText(text, code.value)) return { ok: false, reason: 'code' }

    const [person, idPortrait] = await faces(photo)
    if (!person || !idPortrait) return { ok: false, reason: 'faces' }

    let parsed = parseAgeFromText(text)
    if (!parsed && idScan) {
      const [scanPortrait] = await faces(idScan)
      if (!scanPortrait || euclideanDistance(idPortrait.vector, scanPortrait.vector) >= matchThreshold) {
        return { ok: false, reason: 'id-mismatch' }
      }
      parsed = parseAgeFromText(await ocr(idScan))
    }
    if (!parsed) return { ok: false, reason: 'dob-not-found' }
    age.value = parsed.age
    if (age.value < minAge) return { ok: false, reason: 'age' }

    distance.value = euclideanDistance(person.vector, idPortrait.vector)
    if (distance.value >= matchThreshold) return { ok: false, reason: 'face-mismatch' }

    await $fetch(`${prefix}/register`, {
      method: 'POST',
      body: { code: code.value, ageVerified: true, face: crop(photo, person.box) }
    })
    return { ok: true }
  }

  // Every face in a training image must match the reference held by the server
  const checkTrainingImage = async (image) => {
    const found = await faces(image)
    if (!found.length) return { match: false, reason: 'no-face' }
    return await $fetch(`${prefix}/match`, {
      method: 'POST',
      body: { faces: found.map(f => crop(image, f.box)) }
    })
  }

  return { init, dispose, requestCode, verify, checkTrainingImage, ready, code, ocrText, age, distance }
}
