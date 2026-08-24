import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Munabbih Tablet App Uncaught Error:', error, errorInfo);
  }

  public handleReset = () => {
    try {
      localStorage.clear();
    } catch {
      // Ignore
    }
    window.location.reload();
  };

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] flex items-center justify-center p-6"
          dir="rtl"
        >
          <div className="w-full max-w-md p-8 border border-white/20 bg-[#0F0F0F] text-center space-y-6 shadow-2xl">
            <div className="w-14 h-14 bg-[#FACC15]/10 border border-[#FACC15]/30 text-[#FACC15] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h1 className="font-cairo font-black text-2xl text-white">
                حدث خطأ غير متوقع أثناء التحميل
              </h1>
              <p className="text-xs font-mono text-slate-400 mt-2">
                SYSTEM RECOVERY // يرجى إعادة تحديث الصفحة للمتابعة
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-black/60 border border-white/10 text-xs font-mono text-red-400 text-left overflow-x-auto max-h-24">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-[#FACC15] hover:bg-[#e6bb10] text-black font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تشغيل المنبه</span>
              </button>

              <button
                onClick={this.handleReset}
                className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 font-mono text-xs uppercase tracking-wider"
              >
                مسح الذاكرة المؤقتة
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
