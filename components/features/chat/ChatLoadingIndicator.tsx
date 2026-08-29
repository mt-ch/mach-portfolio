"use client";

interface ChatLoadingIndicatorProps {
  reducedMotion?: boolean;
}

// Adapted from the "spokes" spinner (https://loading-ui.com/docs/components/spokes):
// eight radial lines rotating continuously, sized and colored to match this
// chat's tokens rather than the library's defaults.
export function ChatLoadingIndicator({ reducedMotion = false }: ChatLoadingIndicatorProps) {
  return (
    <div className="flex justify-start" role="status" aria-label="Assistant is typing">
      {!reducedMotion && (
        <style>{`
          @keyframes chat-loading-spokes-spin {
            to {
              transform: rotate(360deg);
            }
          }
          .chat-loading-spokes {
            animation: chat-loading-spokes-spin 1s linear infinite;
          }
        `}</style>
      )}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`size-md text-brand ${reducedMotion ? "" : "chat-loading-spokes"}`}
      >
        <path
          d="M12 2V6M16.2 7.8L19.1 4.9M18 12H22M16.2 16.2L19.1 19.1M12 18V22M4.9 19.1L7.8 16.2M2 12H6M4.9 4.9L7.8 7.8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
