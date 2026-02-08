import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Star, Eye, ArrowUpRight } from "lucide-react";

interface DownloadItem {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  file_type: string;
  download_count: number;
  average_rating: number;
  rating_count: number;
}

interface DownloadCardProps {
  item: DownloadItem;
}

export const DownloadCard = ({ item }: DownloadCardProps) => {
  return (
    <Link to={`/download/${item.id}`} className="group block">
      <Card className="overflow-hidden h-full relative bg-card border-border hover:border-primary/50 transition-all duration-500 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1">
        {/* Neon glow effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          <div className="absolute -inset-px rounded-lg bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 blur-sm transition-opacity" />
        </div>
        
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {item.thumbnail_url ? (
            <img
              src={(() => {
                try {
                  const urls = JSON.parse(item.thumbnail_url);
                  return Array.isArray(urls) && urls.length > 0 ? urls[0] : item.thumbnail_url;
                } catch {
                  return item.thumbnail_url;
                }
              })()}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
              <Download className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          
          {/* File type badge */}
          <Badge className="absolute top-3 left-3 bg-background/90 text-foreground backdrop-blur-md border-0 font-semibold uppercase text-xs tracking-wider">
            {item.file_type}
          </Badge>
          
          {/* Hover arrow */}
          <div className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-[var(--shadow-glow)]">
            <ArrowUpRight className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>

        <div className="p-5 space-y-3 relative">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors duration-300">
            {item.title}
          </h3>

          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t border-border">
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {item.download_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-semibold text-foreground">{item.average_rating.toFixed(1)}</span>
              <span className="text-xs">({item.rating_count})</span>
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};
