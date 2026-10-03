export const endpointDefs = [
  { method: 'POST', route: 'lead', file: 'api/risk/lead.post.js' },
  { method: 'POST', route: 'profile', file: 'api/risk/profile.post.js' },
  { method: 'GET', route: 'profile/:id', file: 'api/risk/profile/id.get.js' },
  { method: 'DELETE', route: 'profile/:id', file: 'api/risk/profile/id.delete.js' },
  { method: 'POST', route: 'profile/:id/:rail', file: 'api/risk/profile/rail.post.js' },
  { method: 'GET', route: 'consent/:id', file: 'api/risk/consent.get.js' }
]
