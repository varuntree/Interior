import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="border-t py-14">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-center md:px-6 lg:px-8">
        <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
          Ready to see your space differently?
        </h3>
        <p className="max-w-xl text-muted-foreground">
          Start free and create your first redesign in under a minute.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/signin">Get started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/community">Explore community</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default CTASection;

