import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WaitlistForm } from "@/components/WaitlistForm";
import { Sparkles } from "lucide-react";
import { AdBanner } from "@/components/AdBanner";

const Waitlist = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24 max-w-lg text-center">
        <AdBanner page="waitlist" position="top" />
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Join the Waitlist</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Be the first to know about new launches, features, and exclusive content.
        </p>
        <div className="flex justify-center">
          <WaitlistForm source="waitlist-page" />
        </div>
        <AdBanner page="waitlist" position="bottom" />
      </div>
      <Footer />
    </div>
  );
};

export default Waitlist;
