import React, { useMemo } from 'react';
import { Film, LogIn, UserRound, ChevronRight } from 'lucide-react';

const PARTICLE_COUNT = 28;

export default function IntroScreen({ onLogin, onGuest, onSkip }) {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        left: `${(i * 17 + 7) % 100}%`,
        top: `${(i * 23 + 11) % 100}%`,
        size: 2 + (i % 4),
        delay: `${(i % 8) * 0.35}s`,
        duration: `${4 + (i % 5)}s`,
      })),
    [],
  );

  return (
    <div className="intro-screen fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#040406] px-4 py-8">
      {/* Background layers */}
      <div className="intro-bg-gradient absolute inset-0" aria-hidden />
      <div className="intro-vignette absolute inset-0" aria-hidden />
      <div className="intro-grain absolute inset-0 opacity-[0.35]" aria-hidden />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {particles.map((p) => (
          <span
            key={p.id}
            className="intro-particle absolute rounded-full bg-brand-gold/40"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* Skip */}
      <button
        type="button"
        onClick={onSkip}
        className="intro-skip absolute top-5 right-5 z-20 text-xs font-medium text-gray-500 hover:text-brand-gold transition-colors px-3 py-1.5 rounded-lg border border-transparent hover:border-dark-border"
      >
        Skip intro
      </button>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl text-center">
        {/* Logo */}
        <div className="intro-logo mx-auto mb-8 flex flex-col items-center">
          <div className="intro-logo-icon flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-gold to-brand-red shadow-2xl shadow-brand-red/30">
            <Film className="h-8 w-8 sm:h-10 sm:w-10 text-black" strokeWidth={2.5} />
          </div>
          <p className="mt-4 text-sm font-bold tracking-[0.2em] text-brand-gold/90 uppercase">
            Dave&apos;s FilmHub
          </p>
        </div>

        {/* Headline */}
        <h1 className="intro-title text-2xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
          Hello, welcome to{' '}
          <span className="text-brand-gold text-glow">Dave&apos;s FilmHub</span>
        </h1>

        <p className="intro-subtitle mt-5 text-sm sm:text-base text-gray-400 max-w-lg mx-auto leading-relaxed px-2">
          Discover movies, save your watchlist, write reviews, and get AI-powered recommendations.
        </p>

        {/* Actions */}
        <div className="intro-actions mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onLogin}
            className="intro-btn-primary filmhub-btn-glow group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gold text-black font-bold text-sm sm:text-base px-6 py-3.5 min-h-[48px] shadow-lg shadow-brand-gold/20 hover:brightness-110 transition-all"
          >
            <LogIn className="h-5 w-5" />
            Continue to Login
            <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            type="button"
            onClick={onGuest}
            className="intro-btn-secondary filmhub-btn-glow filmhub-btn-glow-secondary inline-flex items-center justify-center gap-2 rounded-xl border border-dark-border bg-dark-card/80 text-white font-semibold text-sm sm:text-base px-6 py-3.5 min-h-[48px] hover:border-brand-gold/50 hover:text-brand-gold transition-all backdrop-blur-sm"
          >
            <UserRound className="h-5 w-5" />
            Continue as Guest
          </button>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="intro-footer-hint absolute bottom-6 left-0 right-0 text-center text-[10px] text-gray-600 tracking-wide">
        Your cinematic journey starts here
      </div>
    </div>
  );
}
