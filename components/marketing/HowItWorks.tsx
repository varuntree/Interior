import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Wand2, Heart } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload or describe",
    desc: "Add a room photo or start from a simple text prompt.",
  },
  {
    icon: Wand2,
    title: "Generate in seconds",
    desc: "Our engine applies Australian‑inspired styles with photoreal results.",
  },
  {
    icon: Heart,
    title: "Save your favorites",
    desc: "Organize designs into collections and revisit anytime.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-14">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <h2 className="mb-6 text-center text-2xl font-bold tracking-tight md:text-3xl">
          How it works
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.title} className="h-full">
              <CardHeader>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{s.title}</CardTitle>
                <CardDescription>{s.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;

