export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 font-mono text-xs leading-relaxed text-foreground/90">
      <code>{children}</code>
    </pre>
  );
}
