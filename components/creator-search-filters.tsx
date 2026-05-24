import { useMemo, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Creator, CreatorFilters } from '@/services/feed';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { City } from 'country-state-city';
import { useCategories } from '@/hooks/useCategories';

type GenderValue = 'ALL' | 'M' | 'F' | 'O';
type FilterType = 'city' | 'gender' | 'category' | null;

interface CreatorSearchFiltersProps {
  creators: Creator[] | undefined;
  resultCount: number;
  onFiltersChange: (filters: CreatorFilters) => void;
}

function normalize(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase();
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .join(' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatGenderLabel(gender: GenderValue): string {
  if (gender === 'M') return 'Male';
  if (gender === 'F') return 'Female';
  if (gender === 'O') return 'Other';
  return 'All';
}

export function CreatorSearchFilters({
  creators,
  resultCount,
  onFiltersChange,
}: CreatorSearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedGender, setSelectedGender] = useState<GenderValue>('ALL');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFilter, setOpenFilter] = useState<FilterType>(null);

  const { data: categories } = useCategories();

  const cityOptions = useMemo(() => {
    const indiaCities = (City.getCitiesOfCountry('IN') || [])
      .map((city) => city.name.trim())
      .filter((city) => city.length > 0);

    const creatorCities = (creators || [])
      .map((creator) => (creator as Creator & { city?: string | null }).city)
      .filter((city): city is string => Boolean(city && city.trim()))
      .map((city) => city.trim());

    return Array.from(new Set([...indiaCities, ...creatorCities])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [creators]);

  const filteredCityOptions = useMemo(() => {
    const cityQuery = normalize(citySearchQuery);
    if (!cityQuery) return cityOptions;
    return cityOptions.filter((city) => normalize(city).includes(cityQuery));
  }, [cityOptions, citySearchQuery]);

  const categoryOptions = useMemo(() => {
    const apiSlugs = (categories || []).map(c => c.slug);
    const creatorValues = (creators || [])
      .map((creator) => creator.category)
      .filter((category): category is string => Boolean(category && category.trim()))
      .map((category) => category.trim());

    return Array.from(new Set([...apiSlugs, ...creatorValues])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [creators, categories]);

  const filteredCategoryOptions = useMemo(() => {
    const categoryQuery = normalize(categorySearchQuery);
    if (!categoryQuery) return categoryOptions;
    return categoryOptions.filter((category) => normalize(category).includes(categoryQuery));
  }, [categoryOptions, categorySearchQuery]);

  const genderOptions: Exclude<GenderValue, 'ALL'>[] = ['M', 'F', 'O'];

  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        search: searchQuery.trim() || undefined,
        city: selectedCity === 'all' ? undefined : selectedCity,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        gender:
          selectedGender === 'ALL'
            ? undefined
            : selectedGender === 'M'
              ? 'male'
              : selectedGender === 'F'
                ? 'female'
                : 'other',
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCity, selectedGender, selectedCategory, onFiltersChange]);

  useEffect(() => {
    if (openFilter !== 'city') {
      setCitySearchQuery('');
    }
    if (openFilter !== 'category') {
      setCategorySearchQuery('');
    }
  }, [openFilter]);

  const activeFiltersCount =
    Number(selectedCity !== 'all') +
    Number(selectedGender !== 'ALL') +
    Number(selectedCategory !== 'all');

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search creators..."
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" className="justify-between" onClick={() => setOpenFilter('city')}>
          <span className="truncate text-xs sm:text-sm">City ({selectedCity === 'all' ? 'All' : selectedCity})</span>
          <ChevronDown className="size-4 shrink-0" />
        </Button>
        <Button variant="outline" className="justify-between" onClick={() => setOpenFilter('gender')}>
          <span className="truncate text-xs sm:text-sm">Gender ({formatGenderLabel(selectedGender)})</span>
          <ChevronDown className="size-4 shrink-0" />
        </Button>
        <Button variant="outline" className="justify-between" onClick={() => setOpenFilter('category')}>
          <span className="truncate text-xs sm:text-sm">
            Category ({selectedCategory === 'all' ? 'All' : toTitleCase(selectedCategory)})
          </span>
          <ChevronDown className="size-4 shrink-0" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {resultCount} creator{resultCount === 1 ? '' : 's'}
        {activeFiltersCount > 0 ? ` · ${activeFiltersCount} filter${activeFiltersCount === 1 ? '' : 's'} active` : ''}
      </p>

      {openFilter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpenFilter(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border bg-background shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold capitalize">{openFilter}</h3>
              <Button variant="ghost" size="icon" onClick={() => setOpenFilter(null)} aria-label="Close filter">
                <X className="size-4" />
              </Button>
            </div>

            <div className="max-h-72 overflow-y-auto p-2">
              {openFilter === 'city' && (
                <>
                  <div className="sticky top-0 z-10 bg-background p-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={citySearchQuery}
                        onChange={(e) => setCitySearchQuery(e.target.value)}
                        placeholder="Search city..."
                        className="pl-9"
                      />
                    </div>
                  </div>
                  {['all', ...filteredCityOptions].map((city) => (
                    <button
                      key={city}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent',
                        selectedCity === city && 'bg-accent'
                      )}
                      onClick={() => {
                        setSelectedCity(city);
                        setOpenFilter(null);
                      }}
                    >
                      <span>{city === 'all' ? 'All' : city}</span>
                      {selectedCity === city && <Check className="size-4 text-primary" />}
                    </button>
                  ))}
                </>
              )}

              {openFilter === 'gender' && (
                <>
                  {(['ALL', ...genderOptions] as GenderValue[]).map((gender) => (
                    <button
                      key={gender}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent',
                        selectedGender === gender && 'bg-accent'
                      )}
                      onClick={() => {
                        setSelectedGender(gender);
                        setOpenFilter(null);
                      }}
                    >
                      <span>{formatGenderLabel(gender)}</span>
                      {selectedGender === gender && <Check className="size-4 text-primary" />}
                    </button>
                  ))}
                </>
              )}

              {openFilter === 'category' && (
                <>
                  <div className="sticky top-0 z-10 bg-background p-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        placeholder="Search category..."
                        className="pl-9"
                      />
                    </div>
                  </div>
                  {['all', ...filteredCategoryOptions].map((category) => (
                    <button
                      key={category}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent',
                        selectedCategory === category && 'bg-accent'
                      )}
                      onClick={() => {
                        setSelectedCategory(category);
                        setOpenFilter(null);
                      }}
                    >
                      <span>{category === 'all' ? 'All' : toTitleCase(category)}</span>
                      {selectedCategory === category && <Check className="size-4 text-primary" />}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
