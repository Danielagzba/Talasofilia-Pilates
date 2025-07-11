"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Update page title
    document.title =
      "Talasofilia Pilates | Modern Pilates Studio in Puerto Escondido";
  }, []);
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="3c8deaf0-ea90-4753-00c9-a84f2a18a600"
            alt="Talasofilia studio"
            fill
            sizes="100vw"
            loading="eager"
            quality={75}
            className="object-cover opacity-90"
            priority
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="container relative z-10 px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6">
              Discover Your <span className="font-medium italic">Strength</span>{" "}
              Within
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8 max-w-xl mx-auto">
              A modern Pilates experience in the heart of Puerto Escondido,
              focused on mindful movement and personal transformation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="rounded-none px-8">
                <Link href="/classes">Explore Classes</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-none px-8 bg-transparent text-white border-white hover:bg-white/10"
              >
                <Link href="/booking">Book a Session</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <div className="animate-bounce">
            <ArrowRight className="h-6 w-6 text-white rotate-90" />
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section className="py-20 md:py-32 bg-stone-100">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-light mb-6">
                Our <span className="font-medium italic">Philosophy</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                At Talasofilia Pilates, we believe in the transformative power
                of mindful movement. Our approach combines traditional Pilates
                principles with modern techniques to create a unique experience
                that strengthens both body and mind.
              </p>
              <p className="text-muted-foreground mb-8">
                Founded in 2024, our studio has become a sanctuary for those
                seeking balance, strength, and wellness in their busy lives.
              </p>
              <Button asChild variant="outline" className="rounded-none">
                <Link href="/about" className="group">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
            <div className="relative h-[400px] md:h-[500px]">
              <Image
                src="37e6d8c8-702d-4058-a8f7-813cbae2d900"
                alt="Pilates practice"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Classes Preview */}
      <section className="py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-4">
              Our <span className="font-medium italic">Classes</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover our specialized Pilates classes designed to transform
              your body and mind.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {classes.map((cls) => (
              <div key={cls.id} className="group relative overflow-hidden">
                <div className="relative h-[350px] overflow-hidden">
                  <Image
                    src={cls.image || "/placeholder.svg"}
                    alt={cls.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="font-serif text-xl font-medium mb-2">
                    {cls.title}
                  </h3>
                  <p className="text-sm opacity-90 mb-4">{cls.description}</p>
                  <Link
                    href="/classes"
                    className="inline-flex items-center text-sm font-medium"
                  >
                    Learn More
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" className="rounded-none px-8">
              <Link href="/classes">View Class Schedule</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Instructor Preview */}
      <section className="py-20 md:py-32 bg-stone-100">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-4">
              Meet Your <span className="font-medium italic">Instructor</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Dedicated to guiding you on your wellness journey through the art
              of Pilates.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
            <div className="relative h-[400px] overflow-hidden">
              <Image
                src="48b1631c-ff9a-4699-55b7-8b5644dd8100"
                alt="Maria Laura Osuna"
                fill
                className="object-cover object-top"
              />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-medium mb-2">
                Maria Laura Osuna
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Founder & Lead Instructor
              </p>
              <p className="text-muted-foreground mb-6">
                Maria believes that Pilates is for everybody and every body. Her
                teaching style emphasizes proper alignment, breath, and the
                mind-body connection, helping clients develop a deeper awareness
                of their movement patterns and potential.
              </p>
              <Button asChild variant="outline" className="rounded-none">
                <Link href="/about" className="group">
                  Learn More About Maria
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-4">
              Client <span className="font-medium italic">Testimonials</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from our community about their experiences and
              transformations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-stone-100 p-8 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden mr-4"></div>
                  <div>
                    <h4 className="font-medium">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground"></p>
                  </div>
                </div>
                <p className="italic text-muted-foreground">
                  {testimonial.quote}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-stone-900 text-white">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-6">
              Begin Your <span className="font-medium italic">Journey</span>{" "}
              Today
            </h2>
            <p className="text-lg opacity-80 mb-8">
              Take the first step toward a stronger, more balanced you. Join us
              for a class or contact us to learn more.
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

// Sample data
const classes = [
  {
    id: "morning-flow",
    title: "Morning Flow",
    description:
      "Start your day with energizing Pilates exercises that awaken your body and mind.",
    image: "36d3ffb3-747a-440b-1d00-54eb91536800",
    time: "7:30 AM",
  },
  {
    id: "evening-restore",
    title: "Evening Restore",
    description:
      "Unwind and release tension with restorative movements that promote relaxation and recovery.",
    image: "cf684e4d-fe1c-4160-edb5-015022485d00",
    time: "6:00 PM",
  },
];

const testimonials = [
  {
    name: "Tiffany Poppa",
    quote:
      "Such a great class! Maria is challenging, but supportive. There's an ocean view and a perfect sea breeze- it's a truly lovely way to experience Pilates.",
  },
  {
    name: "Eva Freel",
    quote:
      "This rooftop Pilates was perfect. The instructor Maria is fluent in Spanish and English, and the classes are well thought out. The view of the ocean makes this the prettiest Pilates studio I’ve ever practiced in.",
  },
  {
    name: "Lucy Marriner",
    quote:
      "I absolutely recommend getting a 4 class pass! Maria is amazing, the space is beautiful and private, and you will get a consistently good workout. You won’t regret it!",
  },
];
