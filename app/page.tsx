import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center gap-16 py-12">
      {/* Hero */}
      <section className="text-center max-w-2xl flex flex-col items-center gap-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Learning everywhere,<br />one scan at a time.
        </h1>
        <p className="text-muted-foreground text-lg">
          QR codes placed around your school, library or classroom unlock quizzes,
          challenges and tasks. Scan, solve, earn points.
        </p>
        <div className="flex gap-3">
          <Link href="/register">
            <Button size="lg">Create quizzes</Button>
          </Link>
          <Link href="/leaderboard">
            <Button size="lg" variant="outline">View leaderboard</Button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-center mb-8">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              title: "Creator builds a quiz",
              body: "Add multiple-choice, true/false or open questions. Set a time limit if needed.",
            },
            {
              step: "2",
              title: "Print & place QR codes",
              body: "Generate QR codes linked to your quiz. Print them and place them anywhere — classroom, hallway, library.",
            },
            {
              step: "3",
              title: "Students scan & solve",
              body: "Students scan with any phone camera. No app needed. Choose a nickname and start solving. Points are tracked automatically.",
            },
          ].map((item) => (
            <Card key={item.step}>
              <CardContent className="pt-6 flex flex-col gap-3">
                <span className="text-3xl font-bold text-primary">{item.step}</span>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Flexible QR system */}
      <section className="w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-center mb-8">Flexible QR system</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6 flex flex-col gap-2">
              <h3 className="font-semibold">Dynamic QR codes</h3>
              <p className="text-sm text-muted-foreground">
                Permanently placed labels that can have their quiz swapped any time.
                Perfect for weekly challenges, seasonal content, or rotating topics.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex flex-col gap-2">
              <h3 className="font-semibold">Static QR codes</h3>
              <p className="text-sm text-muted-foreground">
                Locked to a single question forever. Great for worksheets, posters,
                or one-off activities. Bulk-export a sheet of QR codes for your class.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
