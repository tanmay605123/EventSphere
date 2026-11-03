import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden flex flex-col animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-48 w-full bg-slate-200"></div>

      {/* Body Skeleton */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title lines */}
          <div className="h-5 bg-slate-200 rounded-md w-3/4 mb-2"></div>
          <div className="h-5 bg-slate-200 rounded-md w-1/2 mb-4"></div>

          {/* Info lines */}
          <div className="space-y-2.5 mb-4">
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            <div className="h-4 bg-slate-200 rounded w-4/5"></div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
};
