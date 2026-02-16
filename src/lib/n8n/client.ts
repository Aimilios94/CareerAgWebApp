import type { N8nWebhookPayload, N8nWorkflow } from './types'

const N8N_WEBHOOK_BASE_URL = process.env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678/webhook'

interface WebhookResponse {
  success: boolean
  workflowId?: string
  error?: string
}

/**
 * Triggers an n8n webhook workflow
 * @param workflow - The workflow identifier
 * @param payload - The payload to send to the webhook
 * @returns The webhook response
 */
export async function triggerN8nWebhook<T extends N8nWorkflow>(
  workflow: T,
  payload: N8nWebhookPayload[T]
): Promise<WebhookResponse> {
  const webhookUrl = `${N8N_WEBHOOK_BASE_URL}/${workflow}`

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication if configured
        ...(process.env.N8N_WEBHOOK_AUTH_HEADER && {
          Authorization: process.env.N8N_WEBHOOK_AUTH_HEADER,
        }),
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`n8n webhook error (${response.status}):`, errorText)
      throw new Error(`Webhook request failed: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      workflowId: data.workflowId,
    }
  } catch (error) {
    console.error(`Failed to trigger n8n webhook "${workflow}":`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Checks if n8n is reachable
 * @returns True if n8n is available
 */
export async function checkN8nHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${N8N_WEBHOOK_BASE_URL}/health`, {
      method: 'GET',
    })
    return response.ok
  } catch {
    return false
  }
}
