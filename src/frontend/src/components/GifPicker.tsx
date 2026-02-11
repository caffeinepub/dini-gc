import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, Loader2, AlertCircle } from 'lucide-react';
import { config } from '@/lib/config';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

interface GiphyGif {
  id: string;
  images: {
    fixed_height: {
      url: string;
      width: string;
      height: string;
    };
    original: {
      url: string;
    };
  };
  title: string;
}

interface GiphyResponse {
  data: GiphyGif[];
  meta: {
    status: number;
    msg: string;
  };
}

export default function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load trending GIFs on mount
  useEffect(() => {
    loadTrendingGifs();
  }, []);

  const loadTrendingGifs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = new URL(config.giphy.endpoints.trending);
      url.searchParams.append('api_key', config.giphy.apiKey);
      url.searchParams.append('limit', config.giphy.defaultParams.limit.toString());
      url.searchParams.append('rating', config.giphy.defaultParams.rating);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`GIPHY API error: ${response.status} ${response.statusText}`);
      }

      const data: GiphyResponse = await response.json();
      
      if (data.meta.status !== 200) {
        throw new Error(data.meta.msg || 'Failed to load GIFs');
      }

      setGifs(data.data || []);
    } catch (err) {
      console.error('Error loading trending GIFs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load trending GIFs';
      setError(errorMessage);
      setGifs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      loadTrendingGifs();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(config.giphy.endpoints.search);
      url.searchParams.append('api_key', config.giphy.apiKey);
      url.searchParams.append('q', query.trim());
      url.searchParams.append('limit', config.giphy.defaultParams.limit.toString());
      url.searchParams.append('rating', config.giphy.defaultParams.rating);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`GIPHY API error: ${response.status} ${response.statusText}`);
      }

      const data: GiphyResponse = await response.json();
      
      if (data.meta.status !== 200) {
        throw new Error(data.meta.msg || 'Failed to search GIFs');
      }

      setGifs(data.data || []);
    } catch (err) {
      console.error('Error searching GIFs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to search GIFs';
      setError(errorMessage);
      setGifs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    searchGifs(searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleGifClick = (gif: GiphyGif) => {
    // Use the original URL for best quality
    onSelect(gif.images.original.url);
  };

  return (
    <div className="bg-card border-t border-primary">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-primary">
            {searchTerm ? 'Search Results' : 'Trending GIFs'}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4 text-primary" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search for GIFs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 border-primary focus-visible:ring-primary"
            disabled={isLoading}
            autoFocus
          />
          <Button onClick={handleSearch} size="icon" variant="outline" disabled={isLoading} className="border-primary hover:bg-primary/10">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Search className="w-4 h-4 text-primary" />}
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm">{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => searchTerm ? searchGifs(searchTerm) : loadTrendingGifs()}
                className="ml-2 border-primary text-primary"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* GIF Grid */}
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-primary">Loading GIFs...</p>
              </div>
            </div>
          ) : gifs.length === 0 && !error ? (
            <div className="flex items-center justify-center h-full text-primary">
              <div className="text-center">
                <p className="text-sm mb-1">No GIFs found</p>
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      loadTrendingGifs();
                    }}
                    className="text-primary hover:bg-primary/10"
                  >
                    View Trending
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pb-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleGifClick(gif)}
                  className="relative aspect-square overflow-hidden rounded-lg hover:ring-2 hover:ring-primary transition-all group bg-accent/50"
                  title={gif.title || 'Select GIF'}
                >
                  <img
                    src={gif.images.fixed_height.url}
                    alt={gif.title || 'GIF'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* GIPHY Attribution */}
        <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-primary">
          <p className="text-xs text-primary">
            Powered by{' '}
            <a
              href="https://giphy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              GIPHY
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
