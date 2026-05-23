import React from 'react';

export function MovieCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl bg-dark-card border border-dark-border overflow-hidden animate-pulse">
      <div className="aspect-[2/3] w-full bg-dark-hover" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-1/4 rounded bg-dark-hover" />
        <div className="h-4 w-3/4 rounded bg-dark-hover" />
      </div>
    </div>
  );
}

export function MovieGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <MovieCardSkeleton key={idx} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative w-full h-[70vh] md:h-[80vh] min-h-[500px] bg-dark-card flex items-end animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/60 to-transparent z-0" />
      <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-12 md:pb-20 space-y-4">
        <div className="h-6 w-32 rounded bg-dark-hover" />
        <div className="h-12 w-2/3 rounded bg-dark-hover" />
        <div className="h-4 w-1/3 rounded bg-dark-hover" />
        <div className="h-20 w-1/2 rounded bg-dark-hover" />
        <div className="flex gap-4">
          <div className="h-12 w-36 rounded bg-dark-hover" />
          <div className="h-12 w-36 rounded bg-dark-hover" />
        </div>
      </div>
    </div>
  );
}

export function MovieDetailSkeleton() {
  return (
    <div className="w-full min-h-screen bg-dark-bg animate-pulse">
      <div className="h-[40vh] bg-dark-card" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-64 aspect-[2/3] rounded-xl bg-dark-hover shadow-xl shrink-0" />
          <div className="flex-1 space-y-4 pt-12 md:pt-24">
            <div className="h-10 w-2/3 rounded bg-dark-hover" />
            <div className="h-4 w-1/3 rounded bg-dark-hover" />
            <div className="h-6 w-1/4 rounded bg-dark-hover" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-dark-hover" />
              <div className="h-4 w-full rounded bg-dark-hover" />
              <div className="h-4 w-3/4 rounded bg-dark-hover" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
