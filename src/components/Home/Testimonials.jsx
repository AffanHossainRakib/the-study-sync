import React from "react";
import { Star, Quote } from "lucide-react";
import Image from "next/image";

const testimonials = [
  {
    id: 1,
    content:
      "The Study Sync helped me organize my YouTube learning. I finally finished that 20-hour Python course! The progress tracking keeps me motivated every single day.",
    author: "Alex Chen",
    role: "Computer Science Student",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/44.jpg",
  },
  {
    id: 2,
    content:
      "The ability to mix PDFs and videos in one plan is a game changer. I can now track all my design resources in one place. Highly recommended for self-learners!",
    author: "Sarah Johnson",
    role: "Self-taught Designer",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/women/32.jpg",
  },
  {
    id: 3,
    content:
      "I love the progress tracking feature. Seeing the bars fill up keeps me motivated to study every day. The collaborative features are amazing for group projects!",
    author: "Michael Brown",
    role: "Medical Student",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/68.jpg",
  },
];

export default function Testimonials() {
  return (
    <section
      id="reviews"
      className="py-12 sm:py-20 lg:py-24 bg-muted/30 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl animate-float" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-16 animate-fade-in-up">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
            Student Success Stories
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Loved by learners worldwide
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Join thousands of students and professionals who are mastering new
            skills with The Study Sync
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="relative bg-card border border-border rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-sm hover:shadow-2xl hover:border-primary/30 hover:-translate-y-2 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${200 + index * 100}ms` }}
            >
              {/* Quote icon */}
              <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <Quote className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>

              {/* Rating */}
              <div className="flex gap-0.5 sm:gap-1 mb-4 sm:mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      i < testimonial.rating
                        ? "text-primary fill-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-sm sm:text-base text-foreground mb-4 sm:mb-6 leading-relaxed">
                &quot;{testimonial.content}&quot;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-border">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                    width={64}
                    height={64}
                    unoptimized
                  />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-semibold text-foreground">
                    {testimonial.author}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
