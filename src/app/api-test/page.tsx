'use client';

import { useState } from 'react';

export default function ApiTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [emailStatus, setEmailStatus] = useState<any>(null);
  const [loading, setLoading] = useState({ connection: false, email: false });

  const testConnection = async () => {
    try {
      setLoading(prev => ({ ...prev, connection: true }));
      const response = await fetch('/api/auth/test-connection');
      const data = await response.json();
      setConnectionStatus(data);
    } catch (error) {
      setConnectionStatus({ error: 'Failed to test connection' });
    } finally {
      setLoading(prev => ({ ...prev, connection: false }));
    }
  };

  const testEmail = async () => {
    try {
      setLoading(prev => ({ ...prev, email: true }));
      const response = await fetch('/api/auth/test-email');
      const data = await response.json();
      setEmailStatus(data);
    } catch (error) {
      setEmailStatus({ error: 'Failed to send test email' });
    } finally {
      setLoading(prev => ({ ...prev, email: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">API Connection Test</h2>
          
          <div className="space-y-4">
            <button
              onClick={testConnection}
              disabled={loading.connection}
              className={`px-4 py-2 rounded-lg text-white font-medium ${
                loading.connection ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading.connection ? 'Testing...' : 'Test Connection'}
            </button>

            {connectionStatus && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(connectionStatus, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Email Test</h2>
          
          <div className="space-y-4">
            <button
              onClick={testEmail}
              disabled={loading.email}
              className={`px-4 py-2 rounded-lg text-white font-medium ${
                loading.email ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading.email ? 'Sending...' : 'Send Test Email'}
            </button>

            {emailStatus && (
              <div className={`mt-4 p-4 rounded-lg ${
                emailStatus.success ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(emailStatus, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-500">
          <h3 className="font-medium mb-2">Debugging Tips:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>First test the connection to verify network access</li>
            <li>Then test email sending to verify Resend API configuration</li>
            <li>Check the console for additional error details</li>
            <li>Verify environment variables are set correctly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
