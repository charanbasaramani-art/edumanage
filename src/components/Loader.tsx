import React from "react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullscreen?: boolean;
}

export default function Loader({ size = "md", text = "Loading records...", fullscreen = false }: LoaderProps) {
  const spinnerSizes = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  const containerClasses = fullscreen
    ? "fixed inset-0 bg-slate-900/10 backdrop-blur-xs flex flex-col items-center justify-center z-50"
    : "flex flex-col items-center justify-center p-8 w-full";

  return (
    <div className={containerClasses}>
      <div className="relative flex items-center justify-center">
        {/* Outer Ring */}
        <div
          className={`${spinnerSizes[size]} rounded-full border-slate-200 animate-pulse`}
        ></div>
        {/* Spinning indicator */}
        <div
          className={`${spinnerSizes[size]} rounded-full border-indigo-600 border-t-transparent animate-spin absolute`}
        ></div>
      </div>
      {text && (
        <p className="mt-4 text-sm font-medium text-slate-500 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
