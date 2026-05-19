// FILE : frontend/utils/api.ts
// ROLE : API BASE ROUTE RULE

export const API_BASE =

(process.env.NEXT_PUBLIC_API_URL ||

'http://localhost:4000')

+'/api'