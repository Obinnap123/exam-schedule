import { NextResponse } from 'next/server';
import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);
const resolve = promisify(dns.resolve);

export async function GET() {
  try {
    // console.log('Testing DNS resolution...');

    // Test domains to check
    const domains = [
      'api.resend.com',
      'google.com',  // As a control test
    ];

    const results = await Promise.all(domains.map(async (domain) => {
      try {
        // Try DNS lookup
        const lookupResult = await lookup(domain);
        
        // Try DNS resolution
        const resolveResult = await resolve(domain);

        return {
          domain,
          lookup: {
            success: true,
            ip: lookupResult.address
          },
          resolve: {
            success: true,
            ips: resolveResult
          }
        };
      } catch (error) {
        return {
          domain,
          error: error instanceof Error ? error.message : 'Unknown error',
          code: error instanceof Error ? (error as any).code : undefined
        };
      }
    }));

    // Test HTTP connection
    const httpTest = await fetch('https://google.com');
    
    return NextResponse.json({
      success: true,
      results,
      httpTest: {
        success: httpTest.ok,
        status: httpTest.status
      },
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasSmtpFrom: !!process.env.SMTP_FROM
      }
    });
  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
