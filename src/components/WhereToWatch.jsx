import React, { useState } from 'react';
import { Globe, Tv, ShoppingCart, DollarSign, AlertCircle } from 'lucide-react';

const REGIONS = [
  { code: 'US', label: 'United States 🇺🇸' },
  { code: 'GB', label: 'United Kingdom 🇬🇧' },
  { code: 'CA', label: 'Canada 🇨🇦' },
  { code: 'IN', label: 'India 🇮🇳' },
];

export default function WhereToWatch({ providers }) {
  const [region, setRegion] = useState('US');

  // Extract results dictionary
  const results = providers?.results || {};
  const regionData = results[region];

  const streamOptions = regionData?.flatrate || [];
  const rentOptions = regionData?.rent || [];
  const buyOptions = regionData?.buy || [];
  const linkUrl = regionData?.link || 'https://www.themoviedb.org/';

  const hasOptions =
    streamOptions.length > 0 || rentOptions.length > 0 || buyOptions.length > 0;

  const renderProviderList = (list) => {
    return (
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-3">
        {list.map((provider) => (
          <div
            key={provider.provider_id}
            className="flex items-center gap-2.5 p-2 rounded-lg bg-dark-bg/60 border border-dark-border hover:border-brand-gold/30 hover:bg-dark-hover transition-all group"
          >
            <img
              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
              alt={provider.provider_name}
              className="h-8 w-8 rounded-md object-cover shadow border border-white/5"
            />
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-bold text-gray-200 truncate group-hover:text-brand-gold transition-colors">
                {provider.provider_name}
              </p>
              {/* Affiliate placeholder */}
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-brand-gold hover:underline font-semibold block"
              >
                Watch Now
              </a>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-5 mt-8 text-left relative overflow-hidden">
      {/* Title & Region selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-4 mb-4">
        <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Tv className="h-5 w-5 text-brand-gold" />
          Where to Watch
        </h3>
        
        {/* Region Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <Globe className="h-4 w-4 text-gray-400" />
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-dark-bg border border-dark-border text-xs rounded-lg text-gray-300 px-3 py-1.5 focus:outline-none focus:border-brand-gold cursor-pointer"
          >
            {REGIONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Options lists */}
      {hasOptions ? (
        <div className="space-y-5">
          {/* Streaming */}
          {streamOptions.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-gold mb-2.5 flex items-center gap-1.5">
                <Tv className="h-3.5 w-3.5" />
                Stream Free / Subscription
              </h4>
              {renderProviderList(streamOptions)}
            </div>
          )}

          {/* Rent */}
          {rentOptions.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-2.5 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                Rent options
              </h4>
              {renderProviderList(rentOptions)}
            </div>
          )}

          {/* Buy */}
          {buyOptions.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2.5 flex items-center gap-1.5">
                <ShoppingCart className="h-3.5 w-3.5" />
                Buy options
              </h4>
              {renderProviderList(buyOptions)}
            </div>
          )}
          
          <div className="text-[10px] text-gray-500 italic mt-4">
            * Provided by JustWatch. Link goes to TMDB for deep link references.
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 py-6 px-4 rounded-lg bg-dark-bg/40 border border-dashed border-dark-border text-gray-500">
          <AlertCircle className="h-5 w-5 text-gray-600 shrink-0" />
          <p className="text-sm font-medium text-gray-400">
            Streaming availability was not found for this region.
          </p>
        </div>
      )}
    </div>
  );
}
