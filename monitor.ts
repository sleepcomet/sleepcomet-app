#!/usr/bin/env tsx
/**
 * SleepComet Endpoint Monitor
 * Monitors all endpoints and calculates accurate uptime percentages
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CHECK_INTERVAL = 60000 // 60 seconds
const REQUEST_TIMEOUT = 10000 // 10 seconds

interface EndpointCheck {
  id: number
  endpointId: string
  checkedAt: Date
  isUp: boolean
  responseTimeMs: number
}

class EndpointMonitor {
  private isRunning = false

  async checkEndpoint(url: string): Promise<{ isUp: boolean; responseTime: number }> {
    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      // 2xx, 3xx, 4xx are considered "up" (server is responding)
      const isUp = response.status >= 200 && response.status < 500

      return { isUp, responseTime }
    } catch (error: any) {
      const responseTime = Date.now() - startTime

      // Timeout or connection error = down
      return { isUp: false, responseTime }
    }
  }

  async createChecksTableIfNotExists() {
    // Create the endpoint_checks table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS endpoint_checks (
        id SERIAL PRIMARY KEY,
        endpoint_id VARCHAR(255) NOT NULL,
        checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_up BOOLEAN NOT NULL,
        response_time_ms FLOAT NOT NULL
      )
    `

    // Create index for faster queries
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_endpoint_checks_endpoint_id 
      ON endpoint_checks(endpoint_id, checked_at DESC)
    `
  }

  async recordCheck(endpointId: string, isUp: boolean, responseTime: number) {
    await prisma.$executeRaw`
      INSERT INTO endpoint_checks (endpoint_id, is_up, response_time_ms, checked_at)
      VALUES (${endpointId}, ${isUp}, ${responseTime}, NOW())
    `
  }

  async calculateUptime(endpointId: string): Promise<number> {
    // Get checks from last 90 days
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const checks = await prisma.$queryRaw<{ is_up: boolean }[]>`
      SELECT is_up
      FROM endpoint_checks
      WHERE endpoint_id = ${endpointId}
      AND checked_at >= ${ninetyDaysAgo}
      ORDER BY checked_at DESC
    `

    if (checks.length === 0) {
      return 100.0 // No history yet, assume 100%
    }

    const upChecks = checks.filter(check => check.is_up).length
    const uptimePercentage = (upChecks / checks.length) * 100

    return Math.round(uptimePercentage * 100) / 100 // Round to 2 decimal places
  }

  async updateEndpointStatus(endpointId: string, isUp: boolean, uptime: number) {
    const status = isUp ? 'up' : 'down'

    await prisma.endpoint.update({
      where: { id: endpointId },
      data: {
        status,
        uptime,
        lastCheck: new Date(),
      },
    })
  }

  async monitorAllEndpoints() {
    const endpoints = await prisma.endpoint.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        status: true,
        uptime: true,
        lastCheck: true,
      },
      orderBy: { name: 'asc' },
    })

    if (endpoints.length === 0) {
      console.log(`[${new Date().toISOString()}] ℹ️  No endpoints to monitor`)
      return
    }

    console.log(`[${new Date().toISOString()}] 🔍 Checking ${endpoints.length} endpoint(s)...`)

    for (const endpoint of endpoints) {
      try {
        // Check endpoint
        const { isUp, responseTime } = await this.checkEndpoint(endpoint.url)

        // Record the check
        await this.recordCheck(endpoint.id, isUp, responseTime)

        // Calculate uptime
        const uptime = await this.calculateUptime(endpoint.id)

        // Update database
        await this.updateEndpointStatus(endpoint.id, isUp, uptime)

        // Log result
        const statusEmoji = isUp ? '✅' : '❌'
        const statusText = isUp ? 'UP' : 'DOWN'
        console.log(
          `[${new Date().toISOString()}] ${statusEmoji} ${endpoint.name}: ${endpoint.url} - ` +
          `${statusText} (${Math.round(responseTime)}ms) - Uptime: ${uptime}%`
        )
      } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ Error monitoring ${endpoint.name}:`, error)
      }
    }
  }

  async run() {
    console.log(`[${new Date().toISOString()}] 🚀 SleepComet Monitor started`)
    console.log(`[${new Date().toISOString()}] ⏱️  Check interval: ${CHECK_INTERVAL / 1000} seconds`)
    console.log(`[${new Date().toISOString()}] ⏳ Request timeout: ${REQUEST_TIMEOUT / 1000} seconds`)
    console.log('-'.repeat(80))

    // Create checks table if it doesn't exist
    await this.createChecksTableIfNotExists()

    this.isRunning = true

    while (this.isRunning) {
      try {
        await this.monitorAllEndpoints()
        console.log(`[${new Date().toISOString()}] 💤 Sleeping for ${CHECK_INTERVAL / 1000} seconds...`)
        console.log('-'.repeat(80))

        // Sleep
        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL))
      } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ Error in monitoring loop:`, error)
        // Continue monitoring even if there's an error
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5s before retry
      }
    }
  }

  stop() {
    console.log(`\n[${new Date().toISOString()}] 🛑 Monitor stopped`)
    this.isRunning = false
  }
}

// Main execution
const monitor = new EndpointMonitor()

// Handle graceful shutdown
process.on('SIGINT', async () => {
  monitor.stop()
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  monitor.stop()
  await prisma.$disconnect()
  process.exit(0)
})

// Start monitoring
monitor.run().catch(async (error) => {
  console.error('Fatal error:', error)
  await prisma.$disconnect()
  process.exit(1)
})
