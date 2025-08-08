import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Page() {
  return (
    <>
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
        <Button asChild>
          <Link href="/signin">
            Login
          </Link>
        </Button>
      </header>

      <main>
        <section className="flex flex-col items-center justify-center text-center gap-12 px-8 py-24">
          <h1 className="text-3xl font-extrabold text-foreground">Ship Fast ⚡️</h1>

          <p className="text-lg text-muted-foreground">
            The start of your new startup... What are you gonna build?
          </p>

          <Button asChild size="lg">
            <a
              href="https://shipfa.st/docs"
              target="_blank"
              className="inline-flex items-center gap-2"
            >
              Documentation & tutorials
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </Button>

          <Link href="/blog" className="text-primary hover:text-primary/80 underline text-sm transition-colors">
            Fancy a blog?
          </Link>
        </section>
      </main>
    </>
  );
}
