import { Card, CardContent } from "@/components/ui/card";

export function ServiceCard({ service, onDelete }: { service: any; onDelete: () => void }) {
  return (
    <Card className="mb-4">
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold">{service.title}</div>
            <div className="text-xs text-muted-foreground">{service.status}</div>
          </div>
          <button className="text-red-600 font-bold" onClick={onDelete}>Delete</button>
        </div>
      </CardContent>
    </Card>
  );
}
