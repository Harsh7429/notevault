import { Card, CardContent } from "@/components/ui/card";

export function FileCardSkeleton() {
  return (
    <Card className="h-full animate-pulse">
      <CardContent className="space-y-5 p-6">
        <div className="aspect-[4/3] rounded-[1.75rem] bg-[#efe7da]" />
        <div className="space-y-3">
          <div className="h-6 w-3/4 rounded-full bg-[#ece3d5]" />
          <div className="h-4 w-full rounded-full bg-[#f1e9dc]" />
          <div className="h-4 w-5/6 rounded-full bg-[#f1e9dc]" />
          <div className="h-4 w-1/3 rounded-full bg-[#ece3d5]" />
        </div>
      </CardContent>
    </Card>
  );
}
