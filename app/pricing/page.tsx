"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CancellationPolicy } from "../../components/cancellation-policy";
import Image from "next/image";
import { Check } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

interface ClassPackage {
  id: string;
  name: string;
  number_of_classes: number;
  price: number;
  validity_days: number;
}

export default function PricingPage() {
  const [packages, setPackages] = useState<ClassPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const loadPackages = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/packages", { cache: "no-store" });
      if (!response.ok) throw new Error("Packages unavailable");
      const data = await response.json();
      setPackages(data.packages);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };
  const singleClasses = packages.filter(pkg => pkg.number_of_classes === 1);
  const classPackages = packages.filter(pkg => pkg.number_of_classes > 1);

  useEffect(() => {
    document.title = "Pricing | Talasofilia Pilates";
    void loadPackages();
  }, []);
  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="97f88b89-db8c-4bc6-bf22-d3668cd94100"
            alt="Pilates studio"
            fill
            className="object-cover opacity-90"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="container relative z-10 px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-6">
              Our <span className="font-medium italic">Pricing</span>
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-xl mx-auto">
              Transparent pricing options designed to fit your lifestyle and
              wellness journey.
            </p>
          </div>
        </div>
      </section>

      <div className="container px-4 md:px-6 pt-8" aria-live="polite">
        {loading && <p>Loading current packages…</p>}
        {error && <p role="alert">Current packages are unavailable. <button className="underline" onClick={loadPackages}>Try again</button></p>}
        {!loading && !error && packages.length === 0 && <p>No packages are currently available. Please contact the studio.</p>}
      </div>

      {/* Single Classes */}
      <section className="py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-4">
              Single <span className="font-medium italic">Classes</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join us for individual classes with no long-term commitment.
            </p>
          </div>

          <div className="grid md:grid-cols-1 gap-8 max-w-xl mx-auto">
            {singleClasses.map((item) => (
              <Card key={item.id} className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl font-light">
                    {item.name}
                  </CardTitle>
                  <CardDescription>Single class attendance · Valid for {item.validity_days} days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl font-bold">{item.price.toLocaleString("en-US")}</span>
                    <span className="text-muted-foreground ml-1">MXN</span>
                  </div>
                  <ul className="space-y-2">
                    {singleClassFeatures.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 mr-2 text-green-500 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full rounded-none">
                    <Link href="/login">Book Now</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Class Packages */}
      <section className="py-20 md:py-32 bg-stone-100">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-4">
              Class <span className="font-medium italic">Packages</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Save with our multi-class packages.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {classPackages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`border-0 shadow-md ${
                  pkg.number_of_classes === 4 ? "ring-2 ring-stone-900" : ""
                }`}
              >
                <CardHeader>
                  <CardTitle className="font-serif text-2xl font-light">
                    {pkg.name}
                  </CardTitle>
                  <CardDescription>Valid for {pkg.validity_days} days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl font-bold">{pkg.price.toLocaleString("en-US")}</span>
                    <span className="text-muted-foreground ml-1">MXN</span>
                  </div>

                  <ul className="space-y-2">
                    {packageFeatures.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 mr-2 text-green-500 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    className={`w-full rounded-none ${
                      pkg.number_of_classes === 4 ? "bg-stone-900 hover:bg-stone-800" : ""
                    }`}
                  >
                    <Link href="/login">Purchase Package</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Private Sessions */}

      {/* FAQ */}
      <section className="py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-4">
              Pricing <span className="font-medium italic">FAQ</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Common questions about our pricing, packages, and policies.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {pricingFaqs.map((faq, index) => (
              <div key={index} className="border-b border-stone-200 pb-6">
                <h3 className="font-medium text-lg mb-2">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-32 bg-stone-900 text-white">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-6">
              Ready to <span className="font-medium italic">Begin?</span>
            </h2>
            <p className="text-lg opacity-80 mb-8">
              Take the first step toward a stronger, more balanced you. Join us
              for a class or contact us to learn more about our pricing options.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="rounded-none px-8">
                <Link href="/booking">Book a Class</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-none px-8 bg-transparent text-white border-white hover:bg-white/10"
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const singleClassFeatures = [
  "Access to any scheduled class",
  "No commitment required",
  "Suitable for first-time visitors",
  "Equipment provided",
];

const packageFeatures = [
  "Access to any scheduled class",
  "Flexible scheduling",
  "Equipment provided",
];

const pricingFaqs = [
  {
    question: "Do class packages expire?",
    answer:
      "Yes. Each package’s validity is shown above in days from the date of purchase, matching the app. You can find your purchased package’s exact expiration date in your purchase history.",
  },
  {
    question: "Can I share my class package with a friend?",
    answer:
      "Class packages are non-transferable and can only be used by the purchaser.",
  },
  {
    question: "What is your cancellation policy?",
    answer:
      <CancellationPolicy />,
  },
  {
    question: "Is there a registration fee?",
    answer:
      "No, there is no registration fee to join our studio. You only pay for the classes or packages you purchase.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Class packages are non-refundable. In exceptional circumstances, please contact us to discuss your situation.",
  },
  // {
  //   question: "How do I pay for classes?",
  //   answer:
  //     "We accept cash, credit/debit cards, and bank transfers. Payment is required at the time of booking or before the class begins.",
  // },
];
