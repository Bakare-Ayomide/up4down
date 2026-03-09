import { Button } from "@/components/ui/button";
import { Folder } from "lucide-react";
import { normalizeIcon } from "@/lib/normalizeIcon";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategories: string[];
  onSelectCategories: (slugs: string[]) => void;
}

export const CategoryFilter = ({
  categories,
  selectedCategories,
  onSelectCategories,
}: CategoryFilterProps) => {
  const toggleCategory = (slug: string) => {
    if (selectedCategories.includes(slug)) {
      onSelectCategories(selectedCategories.filter(s => s !== slug));
    } else {
      onSelectCategories([...selectedCategories, slug]);
    }
  };

  const clearAll = () => {
    onSelectCategories([]);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Categories</h2>
        {selectedCategories.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear All
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.slug);
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              onClick={() => toggleCategory(category.slug)}
              className={isSelected ? "bg-accent hover:bg-accent/90" : ""}
            >
              {normalizeIcon(category.icon) ? (
                <span className="mr-2 text-base">{normalizeIcon(category.icon)}</span>
              ) : (
                <Folder className="mr-2 h-4 w-4" />
              )}
              {category.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
