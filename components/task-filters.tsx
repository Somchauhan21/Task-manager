"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface TaskFiltersProps {
  search: string;
  status: string;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
  onClearFilters: () => void;
}

export function TaskFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onClearFilters,
}: TaskFiltersProps) {
  const hasFilters = search || status;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={onClearFilters}>
          <X className="h-4 w-4" />
          <span className="sr-only">Clear filters</span>
        </Button>
      )}
    </div>
  );
}
