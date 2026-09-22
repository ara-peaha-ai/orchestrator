// Greenfield API client. Every handler goes through here; never expose the API key to the browser.
export const btcpayRequest = async ({ apiKey, method = 'GET', path, body, query }) => {
  const { btcpayUrl, btcpayApiKey } = useRuntimeConfig()
  const key = apiKey || btcpayApiKey
  if (!btcpayUrl || !key) {
    throw createError({ statusCode: 500, statusMessage: 'BTCPay not configured' })
  }

  let parsedUrl
  try {
    parsedUrl = new URL(String(btcpayUrl))
  } catch {
    throw createError({ statusCode: 500, statusMessage: 'Invalid BTCPay URL' })
  }
  if (parsedUrl.protocol !== 'https:') {
    throw createError({ statusCode: 500, statusMessage: 'BTCPay URL must use HTTPS' })
  }

  const cleanPath = String(path).replace(/^\/+/, '')

  try {
    return await $fetch(`${parsedUrl.toString().replace(/\/+$/, '')}/api/v1/${cleanPath}`, {
      method,
      headers: { Authorization: `token ${key}` },
      query,
      body: method !== 'GET' && method !== 'HEAD' && method !== 'DELETE' ? body : undefined
    })
  } catch (error) {
    throw createError({
      statusCode: error.statusCode ?? 502,
      statusMessage: 'BTCPay API error',
      data: error.data ?? error.message
    })
  }
}
