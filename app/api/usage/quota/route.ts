import { NextRequest, NextResponse } from 'next/server';
import {
  getUsageCounter,
  getRemainingDiscoveryQuota,
  getRemainingReportQuota,
} from '@/lib/services/usage-counter';

/**
 * GET /api/usage/quota
 * Get current usage counters and remaining quotas
 */
export async function GET(request: NextRequest) {
  try {
    const counter = await getUsageCounter();
    const remainingDiscoveries = await getRemainingDiscoveryQuota();
    const remainingReports = await getRemainingReportQuota();

    return NextResponse.json({
      success: true,
      usage: {
        month: counter.month,
        modash_discoveries_used: counter.modash_discoveries_used,
        modash_reports_used: counter.modash_reports_used,
        remaining_discoveries: remainingDiscoveries,
        remaining_reports: remainingReports,
        discovery_limit: 140000,
        report_limit: 1400,
      },
    });
  } catch (error: any) {
    console.error('Error fetching usage quota:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

