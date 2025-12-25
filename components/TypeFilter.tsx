"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TypeBadgeProps {
  type: string;
  label: string;
  count?: number;
  isActive?: boolean;
  onClick?: () => void;
}

interface TypeFilterProps {
  types: Array<{
    type: string;
    label: string;
    count: number;
  }>;
  activeType?: string;
  onTypeChange?: (type: string) => void;
  showAll?: boolean;
}

function TypeBadge({ type, label, count, isActive, onClick }: TypeBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap
        ${isActive
          ? 'bg-pink-600 text-white shadow-lg transform scale-105'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
        }
      `}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full text-xs ${
          isActive ? 'bg-pink-500' : 'bg-gray-200'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

export function TypeFilter({ types, activeType, onTypeChange, showAll = true }: TypeFilterProps) {
  const router = useRouter();
  
  const handleTypeClick = (type: string) => {
    if (onTypeChange) {
      onTypeChange(type);
    } else {
      // Redirection par défaut vers la page de recherche
      router.push(`/results?q=${encodeURIComponent(type)}`);
    }
  };

  const handleShowAll = () => {
    if (onTypeChange) {
      onTypeChange('');
    } else {
      router.push('/results');
    }
  };

  return (
    <div className="mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap scrollbar-hide">
        {showAll && (
          <TypeBadge
            type=""
            label="Tous"
            isActive={!activeType}
            onClick={handleShowAll}
          />
        )}
        {types.map(({ type, label, count }) => (
          <TypeBadge
            key={type}
            type={type}
            label={label}
            count={count}
            isActive={activeType === type}
            onClick={() => handleTypeClick(type)}
          />
        ))}
      </div>
    </div>
  );
}

export default TypeFilter;
