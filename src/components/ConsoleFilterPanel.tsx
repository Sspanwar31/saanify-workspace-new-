'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Filter, FilterOff } from 'lucide-react';

interface FilterPattern {
  id: string;
  pattern: string;
  enabled: boolean;
  type: 'contains' | 'regex' | 'exact';
}

export function ConsoleFilterPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [filteringEnabled, setFilteringEnabled] = useState(true);
  const [filters, setFilters] = useState<FilterPattern[]>([
    { id: '1', pattern: 'mcp data', enabled: true, type: 'contains' },
    { id: '2', pattern: 'metadata: {…}', enabled: true, type: 'contains' },
    { id: '3', pattern: 'CbxGpD3N.js', enabled: true, type: 'contains' },
    { id: '4', pattern: 'chrome-extension', enabled: true, type: 'contains' }
  ]);
  const [newPattern, setNewPattern] = useState('');

  // Toggle visibility with keyboard shortcut (Ctrl+Shift+C)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  // Initialize console filtering
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalConsole = {
      log: window.console.log,
      warn: window.console.warn,
      error: window.console.error,
      info: window.console.info,
      debug: window.console.debug
    };

    const createFilteredConsole = () => {
      return {
        log: function(...args: any[]) {
          if (!filteringEnabled) {
            return originalConsole.log.apply(window.console, args);
          }

          const message = args.join(' ');
          const shouldFilter = filters.some(filter => 
            filter.enabled && message.toLowerCase().includes(filter.pattern.toLowerCase())
          );

          if (!shouldFilter) {
            return originalConsole.log.apply(window.console, args);
          }
        },

        warn: function(...args: any[]) {
          if (!filteringEnabled) {
            return originalConsole.warn.apply(window.console, args);
          }

          const message = args.join(' ');
          const shouldFilter = filters.some(filter => 
            filter.enabled && message.toLowerCase().includes(filter.pattern.toLowerCase())
          );

          if (!shouldFilter) {
            return originalConsole.warn.apply(window.console, args);
          }
        },

        error: function(...args: any[]) {
          if (!filteringEnabled) {
            return originalConsole.error.apply(window.console, args);
          }

          const message = args.join(' ');
          const shouldFilter = filters.some(filter => 
            filter.enabled && message.toLowerCase().includes(filter.pattern.toLowerCase())
          );

          if (!shouldFilter) {
            return originalConsole.error.apply(window.console, args);
          }
        },

        info: function(...args: any[]) {
          if (!filteringEnabled) {
            return originalConsole.info.apply(window.console, args);
          }

          const message = args.join(' ');
          const shouldFilter = filters.some(filter => 
            filter.enabled && message.toLowerCase().includes(filter.pattern.toLowerCase())
          );

          if (!shouldFilter) {
            return originalConsole.info.apply(window.console, args);
          }
        },

        debug: function(...args: any[]) {
          if (!filteringEnabled) {
            return originalConsole.debug.apply(window.console, args);
          }

          const message = args.join(' ');
          const shouldFilter = filters.some(filter => 
            filter.enabled && message.toLowerCase().includes(filter.pattern.toLowerCase())
          );

          if (!shouldFilter) {
            return originalConsole.debug.apply(window.console, args);
          }
        }
      };
    };

    // Apply filtered console
    Object.assign(window.console, createFilteredConsole());

    return () => {
      Object.assign(window.console, originalConsole);
    };
  }, [filteringEnabled, filters]);

  const addFilter = () => {
    if (newPattern.trim()) {
      const filter: FilterPattern = {
        id: Date.now().toString(),
        pattern: newPattern.trim(),
        enabled: true,
        type: 'contains'
      };
      setFilters([...filters, filter]);
      setNewPattern('');
    }
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const toggleFilter = (id: string) => {
    setFilters(filters.map(f => 
      f.id === id ? { ...f, enabled: !f.enabled } : f
    ));
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Filter className="h-4 w-4 mr-2" />
          Console Filter
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="bg-background/95 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Console Filter Manager</CardTitle>
            <div className="flex items-center space-x-2">
              <Switch
                checked={filteringEnabled}
                onCheckedChange={setFilteringEnabled}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Status:
            </span>
            <Badge variant={filteringEnabled ? "default" : "secondary"}>
              {filteringEnabled ? "Active" : "Disabled"}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addFilter()}
                placeholder="Add filter pattern..."
                className="flex-1 px-3 py-1 text-sm border rounded-md bg-background"
              />
              <Button size="sm" onClick={addFilter}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filters.map((filter) => (
              <div
                key={filter.id}
                className="flex items-center justify-between p-2 rounded-md bg-muted/50"
              >
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={filter.enabled}
                    onCheckedChange={() => toggleFilter(filter.id)}
                    size="sm"
                  />
                  <span className={`text-sm ${filter.enabled ? '' : 'text-muted-foreground line-through'}`}>
                    {filter.pattern}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilter(filter.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            Press Ctrl+Shift+C to toggle this panel
          </div>
        </CardContent>
      </Card>
    </div>
  );
}