import React from 'react';
import { Film, RefreshCw, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-[#060608] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-600 via-brand-gold to-indigo-600" />
            
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="h-20 w-20 bg-rose-500/10 border-2 border-rose-500/20 rounded-full flex items-center justify-center text-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.15)]">
                  <Film size={32} className="opacity-50" />
                  <AlertTriangle size={24} className="absolute -bottom-2 -right-2 bg-[#060608] rounded-full text-brand-gold" />
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-3">
              Something went wrong.
            </h1>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              We've encountered an unexpected issue and the script has strayed from the storyboard. Please try reloading the scene.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <RefreshCw size={18} />
              Reload Application
            </button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
               <div className="mt-6 text-left bg-black/50 p-4 rounded-lg overflow-auto max-h-40 border border-red-900/30">
                 <p className="text-rose-400 font-mono text-xs whitespace-pre-wrap">
                   {this.state.error.toString()}
                 </p>
               </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}
