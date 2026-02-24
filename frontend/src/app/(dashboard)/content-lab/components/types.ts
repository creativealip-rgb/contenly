import { WordPressSite } from '@/lib/sites-store'
import { RssFeed } from '@/lib/feeds-store'

export interface ContentLabState {
    // WordPress
    wpCategories: Array<{ id: number; name: string }>;
    selectedCategory: number | null;
    isFetchingCategories: boolean;
    sites: WordPressSite[];

    // RSS & Content
    feeds: RssFeed[];
    articles: any[];
    selectedArticle: any | null;
    selectedFeed: string;
    isFetchingRSS: boolean;
    isAddFeedOpen: boolean;
    newFeedUrl: string;
    newFeedName: string;
    isScanning: boolean;
    isScraping: boolean;
    isRewriting: boolean;
    activeTab: string;
    isRefreshingSEO: boolean;
    isPublishing: boolean;
    isGeneratingImage: boolean;
}

export interface ContentLabHandlers {
    setFeeds: (feeds: RssFeed[]) => void;
    setArticles: (articles: any[]) => void;
    setSelectedFeed: (id: string) => void;
    setIsFetchingRSS: (val: boolean) => void;
    setIsAddFeedOpen: (val: boolean) => void;
    setNewFeedUrl: (val: string) => void;
    setNewFeedName: (val: string) => void;
    setIsScanning: (val: boolean) => void;
    setIsScraping: (val: boolean) => void;
    setIsRewriting: (val: boolean) => void;
    setActiveTab: (tab: string) => void;
    setSelectedCategory: (id: number | null) => void;

    // Actions
    handleFetchArticles: (feedId: string) => Promise<void>;
    handleAddFeed: () => Promise<void>;
    handleRemoveFeed: (e: React.MouseEvent, id: string) => Promise<void>;
    handleSelectArticle: (article: any) => Promise<void>;
    handleScrape: () => Promise<void>;
    handleAIRewrite: () => Promise<void>;
    handleGenerateImage: () => Promise<void>;
}
