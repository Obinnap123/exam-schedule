"use client";
import React, { useEffect, useState, useRef } from "react";
import { Bell, Search, ChevronDown, Menu, X, Loader2, BookOpen, Warehouse, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
}

interface UserData {
  id: number;
  firstName: string;
  lastName: string;
}

interface SearchResult {
  id: number;
  type: "course" | "hall" | "supervisor";
  title: string;
  subtitle: string;
  url: string;
}

function Topbar({ title, onMenuClick }: TopbarProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    }

    // Click outside to close results
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const userId = user?.id?.toString();
        if (!userId) return;

        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          headers: {
            "X-User-Id": userId
          }
        });

        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setShowResults(true);
        }
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [query, user]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    setShowResults(false);
    setQuery("");
    setMobileSearchOpen(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "course": return <BookOpen className="w-4 h-4 text-indigo-500" />;
      case "hall": return <Warehouse className="w-4 h-4 text-emerald-500" />;
      case "supervisor": return <UserIcon className="w-4 h-4 text-amber-500" />;
      default: return <Search className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 sticky top-0 z-40 px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        <div className={`md:block ${mobileSearchOpen ? 'hidden' : 'block'}`}>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-1 justify-end md:justify-between">

        {/* Search Input Container */}
        <div ref={searchRef} className={`
          ${mobileSearchOpen ? 'flex absolute inset-x-0 top-0 h-16 bg-white z-50 px-4 items-center' : 'hidden md:flex'} 
          relative group md:ml-auto md:mr-4
        `}>
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {isLoading ? (
                <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
              ) : (
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              )}
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.length >= 2) setShowResults(true);
              }}
              onFocus={() => {
                if (results.length > 0) setShowResults(true);
              }}
              placeholder="Search courses, halls, supervisors..."
              className="pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full transition-all"
              autoFocus={mobileSearchOpen}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  // If mobile, keep open, just clear. If desired to close:
                  // setMobileSearchOpen(false); 
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Close Mobile Search Button */}
          {mobileSearchOpen && (
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="ml-2 p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
          )}

          {/* Dropdown Results */}
          {showResults && results.length > 0 && (
            <div className="absolute top-full mt-2 left-0 w-full md:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 z-50">
              <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Search Results
              </div>
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-start gap-3 transition-colors border-l-2 border-transparent hover:border-indigo-500"
                >
                  <div className="mt-0.5 p-1.5 bg-slate-100 rounded-md">
                    {getTypeIcon(result.type)}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 leading-none mb-1">
                      {result.title}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {result.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showResults && query.length >= 2 && results.length === 0 && !isLoading && (
            <div className="absolute top-full mt-2 left-0 w-full md:w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 text-center z-50 text-slate-500 text-sm">
              No results found for "{query}"
            </div>
          )}
        </div>

        {/* Actions - Hidden when mobile search is open */}
        {!mobileSearchOpen && (
          <div className="flex items-center gap-2 border-r border-slate-200 pr-4 mr-2">
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Search className="w-5 h-5" />
            </button>
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        )}

        {/* User Profile - Hidden when mobile search is open */}
        {!mobileSearchOpen && (
          <div className="flex items-center gap-3 pl-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {user ? `${capitalizeFirstLetter(user.firstName)} ${capitalizeFirstLetter(user.lastName)}` : "Admin User"}
              </p>
              <p className="text-xs text-slate-500 font-medium">Administrator</p>
            </div>

            <button className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center text-indigo-700 font-bold group-hover:bg-indigo-200 transition-colors">
                {user ? getInitials(user.firstName, user.lastName) : "AU"}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 md:block hidden" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Topbar;
