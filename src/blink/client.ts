import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: 'ai-legal-case-manager-v6lpuuev',
  authRequired: false // Allow manual auth handling
})

// Disable analytics to prevent network errors
if (blink.analytics && typeof blink.analytics.disable === 'function') {
  blink.analytics.disable()
}