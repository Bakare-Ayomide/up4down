import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { WaitlistForm } from "@/components/WaitlistForm";

const socialIcons: Record<string, string> = {
  twitter_url: "𝕏",
  instagram_url: "📷",
  facebook_url: "f",
  youtube_url: "▶",
  telegram_url: "✈",
  discord_url: "💬",
};

export const Footer = () => {
  const { settings } = useSiteSettings();
  const social = settings.social_links;
  const app = settings.app_settings;

  const socialEntries = Object.entries(social).filter(([, v]) => v);

  return (
    <footer className="border-t border-border py-12 bg-card">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <span className="font-extrabold text-2xl tracking-tight text-destructive">ZEROLORD</span>
            <p className="text-muted-foreground text-sm mt-2">
              {app.app_description || "Your ultimate download platform"}
            </p>
          </div>

          {/* Links */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Links</h4>
            <div className="flex flex-col gap-1.5 text-sm">
              <Link to="/browse" className="hover:text-primary transition-colors">Browse</Link>
              <Link to="/news" className="hover:text-primary transition-colors">News</Link>
              <Link to="/support" className="hover:text-primary transition-colors">Support</Link>
              {app.privacy_policy_url && <a href={app.privacy_policy_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Privacy Policy</a>}
              {app.terms_of_service_url && <a href={app.terms_of_service_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Terms of Service</a>}
            </div>
          </div>

          {/* Waitlist + Social */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2">Stay Updated</h4>
              <WaitlistForm source="footer" />
            </div>
            {socialEntries.length > 0 && (
              <div className="flex gap-3 mt-4">
                {socialEntries.map(([key, url]) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {socialIcons[key] || "🔗"}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} {app.app_name || "Zerolord"}. All rights reserved.
          </p>
          {app.support_email && (
            <a href={`mailto:${app.support_email}`} className="text-sm text-muted-foreground hover:text-primary">
              {app.support_email}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
};
