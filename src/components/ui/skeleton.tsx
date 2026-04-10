import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-bento skeleton-glass", className)}
      {...props}
    />
  );
}

export { Skeleton };
