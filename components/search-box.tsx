"use client"

import { useState, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useSearch } from "@/hooks/use-search"
import { useDebounce } from "@/hooks/use-debounce"

interface SearchBoxProps {
  placeholder?: string
  className?: string
  onResultClick?: (url: string) => void
}

export function SearchBox({ 
  placeholder = "Search projects, files, or anything...",
  className = "",
  onResultClick
}: SearchBoxProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedQuery = useDebounce(searchQuery, 300)
  const { data: results, isLoading } = useSearch(debouncedQuery)

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleResultClick = useCallback((url: string) => {
    if (onResultClick) {
      onResultClick(url)
    } else {
      window.location.href = url
    }
    setSearchQuery("")
  }, [onResultClick])

  const showResults = useMemo(() => {
    return debouncedQuery.trim().length > 0 && results && results.length > 0
  }, [debouncedQuery, results])

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleInputChange}
        className="pl-9 w-full"
      />
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : (
            <div className="py-2">
              {results?.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result.url)}
                  className="w-full px-4 py-2 text-left hover:bg-accent transition-colors"
                >
                  <div className="font-medium text-sm">{result.title}</div>
                  {result.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {result.description}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {result.type}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

