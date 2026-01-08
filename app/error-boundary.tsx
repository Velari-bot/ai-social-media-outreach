"use client";

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isFirebaseError = this.state.error?.message?.includes('Firebase') || 
                             this.state.error?.message?.includes('auth/invalid-api-key');
      
      return (
        <main className="min-h-screen bg-[#F5F3EF] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-black mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {isFirebaseError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm text-yellow-800 font-medium mb-2">Firebase Configuration Required</p>
                <p className="text-xs text-yellow-700">
                  Please create a <code className="bg-yellow-100 px-1 rounded">.env.local</code> file with your Firebase web config.
                  See <code className="bg-yellow-100 px-1 rounded">FIREBASE_SETUP.md</code> for instructions.
                </p>
              </div>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-colors font-medium"
            >
              Reload Page
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

