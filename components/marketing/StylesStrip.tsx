import runtime from "@/libs/app-config/runtime";
import { Badge } from "@/components/ui/badge";

export function StylesStrip() {
  const styles = runtime.presets.styles;
  return (
    <section className="border-t py-10">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <p className="mb-4 text-sm font-medium text-muted-foreground">Popular styles</p>
        <div className="flex flex-wrap gap-2">
          {styles.map((s) => (
            <Badge key={s.id} variant="secondary" className="rounded-full px-3 py-1">
              {s.label}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StylesStrip;

