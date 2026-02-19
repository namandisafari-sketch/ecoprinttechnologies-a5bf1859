const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="bg-card text-foreground rounded-lg rounded-tl-none px-4 py-3 shadow-sm">
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  </div>
);

export default TypingIndicator;
