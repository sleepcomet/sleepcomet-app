import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const prisma = new PrismaClient();
const REQUEST_TIMEOUT = 10000;

async function checkEndpoint(url: string): Promise<{ isUp: boolean; responseTime: number }> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    const isUp = response.status >= 200 && response.status < 500;

    return { isUp, responseTime };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    return { isUp: false, responseTime };
  }
}

async function recordCheck(endpointId: string, isUp: boolean, responseTime: number) {
  // @ts-ignore - Prisma types might not be updated yet
  await prisma.endpointCheck.create({
    data: {
      endpointId,
      isUp,
      responseTimeMs: responseTime,
    }
  });
}

async function calculateUptime(endpointId: string): Promise<number> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // @ts-ignore - Prisma types might not be updated yet
  const checks = await prisma.endpointCheck.findMany({
    where: {
      endpointId,
      checkedAt: { gte: ninetyDaysAgo }
    },
    select: { isUp: true }
  });

  if (checks.length === 0) return 100.0;

  const upChecks = checks.filter((check: any) => check.isUp).length;
  const uptimePercentage = (upChecks / checks.length) * 100;

  return Math.round(uptimePercentage * 100) / 100;
}

async function notifySSE(payload: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_CONSOLE_URL || 'http://localhost:3000';
    await fetch(`${baseUrl}/api/sse/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Silent fail
  }
}

export async function GET(req: Request) {
  try {
    // In production, this endpoint is protected by Vercel Cron's built-in security
    // In development, we allow open access for testing

    const allEndpoints = await prisma.endpoint.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        status: true,
        uptime: true,
        lastCheck: true,
        checkInterval: true,
        statusPages: true,
      },
    });

    // Filter endpoints that need checking
    const now = new Date();
    const endpoints = allEndpoints.filter(ep => {
      if (!ep.lastCheck) return true;
      const nextCheck = new Date(ep.lastCheck.getTime() + (ep.checkInterval * 1000));
      return now >= nextCheck;
    });

    const results = [];

    for (const endpoint of endpoints) {
      const previousStatus = endpoint.status;
      const { isUp, responseTime } = await checkEndpoint(endpoint.url);

      await recordCheck(endpoint.id, isUp, responseTime);

      let uptime = await calculateUptime(endpoint.id);
      if (isNaN(uptime)) uptime = 0;

      const newStatus = isUp ? 'up' : 'down';

      await prisma.endpoint.update({
        where: { id: endpoint.id },
        data: {
          status: newStatus,
          uptime,
          lastCheck: new Date(),
        },
      });

      // SSE Notification - send complete endpoint data
      await notifySSE({
        type: 'endpoint_update',
        endpointId: endpoint.id,
        name: endpoint.name,
        url: endpoint.url,
        status: newStatus,
        previousStatus: previousStatus,
        uptime: uptime,
        responseTime: responseTime,
        lastCheck: new Date().toISOString(),
        isStatusChange: previousStatus !== newStatus,
      });

      // Handle DOWN transition
      if (previousStatus === 'up' && !isUp) {
        for (const page of endpoint.statusPages) {
          await prisma.incident.create({
            data: {
              title: `${endpoint.name} is down`,
              status: 'investigating',
              impact: 'critical',
              affectedComponents: [endpoint.id],
              statusPageId: page.id,
            },
          });

          await prisma.statusPage.update({
            where: { id: page.id },
            data: { status: 'outage' },
          });

          await notifySSE({
            type: 'page_update',
            slug: page.slug,
            status: 'outage',
          });
        }
      }

      // Handle UP transition
      if (previousStatus === 'down' && isUp) {
        for (const page of endpoint.statusPages) {
          const openIncidents = await prisma.incident.findMany({
            where: {
              statusPageId: page.id,
              status: { not: 'resolved' },
              affectedComponents: { has: endpoint.id },
            },
          });

          for (const incident of openIncidents) {
            await prisma.incident.update({
              where: { id: incident.id },
              data: {
                status: 'resolved',
                updatedAt: new Date(),
              },
            });
          }

          const remainingIncidents = await prisma.incident.count({
            where: {
              statusPageId: page.id,
              status: { not: 'resolved' },
            },
          });

          if (remainingIncidents === 0) {
            await prisma.statusPage.update({
              where: { id: page.id },
              data: { status: 'operational' },
            });

            await notifySSE({
              type: 'page_update',
              slug: page.slug,
              status: 'operational',
            });
          }
        }
      }

      results.push({
        id: endpoint.id,
        name: endpoint.name,
        status: newStatus,
        uptime,
        responseTime,
      });
    }

    return NextResponse.json({
      success: true,
      checked: results.length,
      results
    });
  } catch (error) {
    console.error('Monitoring error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
