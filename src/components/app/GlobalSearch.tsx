import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, MessageCircle, FileText, Coins, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'chat' | 'knowledge' | 'transaction' | 'project';
  title: string;
  preview: string;
  date: string;
}

interface GlobalSearchProps {
  onClose?: () => void;
}

const GlobalSearch = ({ onClose }: GlobalSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    // Simulate search - in production, this would call the API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock results
    const mockResults: SearchResult[] = [
      {
        id: '1',
        type: 'chat' as const,
        title: 'Cuộc trò chuyện về Tình Yêu Vô Điều Kiện',
        preview: 'Angel AI: Tình yêu vô điều kiện là ánh sáng thuần khiết...',
        date: 'Hôm nay'
      },
      {
        id: '2',
        type: 'knowledge' as const,
        title: 'Hướng Dẫn Thiền Định 5D',
        preview: 'Tài liệu về cách kết nối với năng lượng cao...',
        date: 'Hôm qua'
      },
      {
        id: '3',
        type: 'transaction' as const,
        title: '+50 Camlycoin - Năng lượng tích cực',
        preview: 'Phần thưởng từ tin nhắn yêu thương...',
        date: '2 ngày trước'
      }
    ];
    
    setResults(mockResults.filter(r => 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.preview.toLowerCase().includes(searchQuery.toLowerCase())
    ));
    
    setIsSearching(false);
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'chat': return <MessageCircle className="w-5 h-5" />;
      case 'knowledge': return <FileText className="w-5 h-5" />;
      case 'transaction': return <Coins className="w-5 h-5" />;
      case 'project': return <Sparkles className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'chat': return 'Trò chuyện';
      case 'knowledge': return 'Thư viện';
      case 'transaction': return 'Giao dịch';
      case 'project': return 'Dự án';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search Header */}
      <div className="p-6 border-b border-border/30">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-cinzel font-bold text-gradient-gold glow-text mb-6"
        >
          🔍 Tìm Kiếm Toàn Cầu
        </motion.h1>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Tìm kiếm trong chat, thư viện, giao dịch..."
            className={cn(
              "pl-14 pr-12 py-6 text-lg rounded-2xl",
              "bg-gradient-to-r from-card to-card/80",
              "border-2 border-primary/30 focus:border-primary",
              "placeholder:text-muted-foreground/60",
              "shadow-lg shadow-primary/10"
            )}
            style={{ fontSize: '1.125rem' }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted/50"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-6">
        {isSearching ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary"
            />
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Tìm thấy {results.length} kết quả cho "{query}"
            </p>
            {results.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-xl cursor-pointer",
                  "bg-gradient-to-r from-card to-card/80",
                  "border border-border/50 hover:border-primary/50",
                  "transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        {getTypeLabel(result.type)}
                      </span>
                      <span className="text-xs text-muted-foreground">{result.date}</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 truncate" style={{ fontSize: '1.125rem' }}>
                      {result.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {result.preview}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : query.length >= 2 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔮</div>
            <p className="text-lg text-muted-foreground">
              Không tìm thấy kết quả cho "{query}"
            </p>
            <p className="text-sm text-muted-foreground/60 mt-2">
              Thử tìm kiếm với từ khóa khác
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✨</div>
            <p className="text-lg text-muted-foreground">
              Nhập từ khóa để tìm kiếm
            </p>
            <p className="text-sm text-muted-foreground/60 mt-2">
              Tìm kiếm trong chat, thư viện tri thức, giao dịch Camlycoin
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch;
