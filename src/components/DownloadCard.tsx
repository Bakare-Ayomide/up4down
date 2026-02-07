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
    <Link to={`/download/${item.id}`} className="group">
      <Card className="overflow-hidden h-full relative bg-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-[var(--shadow-card-hover)]">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <div className="aspect-video bg-muted relative overflow-hidden">
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
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Download className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground backdrop-blur-sm border-0 font-medium">
            {item.file_type.toUpperCase()}
          </Badge>
          
          {/* Hover arrow indicator */}
          <div className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <ArrowUpRight className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>

        <div className="p-4 space-y-3 relative">
          <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors duration-200">
            {item.title}
          </h3>

          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border/50">
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {item.download_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-medium text-foreground">{item.average_rating.toFixed(1)}</span>
              <span>({item.rating_count})</span>
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};
