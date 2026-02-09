import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Download, AlertTriangle } from "lucide-react";
import { useFreeDownloads } from "@/hooks/useFreeDownloads";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { formatCurrency } from "@/lib/currency";

interface DownloadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFreeDownload: () => void;
  itemTitle: string;
}

export const DownloadModal = ({ open, onOpenChange, onFreeDownload, itemTitle }: DownloadModalProps) => {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const { canDownload, getRemainingDownloads } = useFreeDownloads();
  
  const { daily_limit, monthly_limit } = settings.free_tier_limits;
  const canFreeDownload = canDownload(daily_limit, monthly_limit);
  const remaining = getRemainingDownloads(daily_limit, monthly_limit);
  const price = settings.subscription_price;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">Choose Your Download Plan</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 mt-4">
          {/* Premium Option */}
          <div
            className="relative p-6 rounded-2xl border-2 border-primary bg-primary/5 cursor-pointer hover:bg-primary/10 transition-all group"
            onClick={() => { onOpenChange(false); navigate("/payment"); }}
          >
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4">
              RECOMMENDED
            </Badge>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                <Crown className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">Premium Access</h3>
                <p className="text-sm text-muted-foreground">
                  Unlimited downloads, no ads, priority support
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold text-primary">{formatCurrency(price.amount, price.currency)}</div>
                <span className="text-xs text-muted-foreground">/month</span>
              </div>
            </div>
            <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 font-semibold group-hover:shadow-[var(--shadow-glow)] transition-all">
              Subscribe Now
            </Button>
          </div>

          {/* Free Option */}
          <div
            className={`p-6 rounded-2xl border border-border cursor-pointer hover:border-muted-foreground/30 transition-all ${!canFreeDownload ? "opacity-60" : ""}`}
            onClick={() => {
              if (canFreeDownload) {
                onOpenChange(false);
                onFreeDownload();
              }
            }}
          >
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                <Zap className="h-7 w-7 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">Free with Ads</h3>
                <p className="text-sm text-muted-foreground">
                  Limited downloads with ad support
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold text-muted-foreground">$0</div>
                <span className="text-xs text-muted-foreground">with ads</span>
              </div>
            </div>

            {canFreeDownload ? (
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{remaining.dailyRemaining}/{daily_limit} today</span>
                <span>{remaining.monthlyRemaining}/{monthly_limit} this month</span>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>Download limit reached. Upgrade to Premium for unlimited access!</span>
              </div>
            )}

            {canFreeDownload && (
              <Button variant="outline" className="w-full mt-3 rounded-xl h-11 font-semibold">
                <Download className="mr-2 h-4 w-4" />
                Download with Ads
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
