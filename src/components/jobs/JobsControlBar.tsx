import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useJobs } from "@/contexts/JobsContext";

interface Props {
  onCreate: () => void;
  industries: string[];
  locations: string[];
}

const ALL = "__all__";

export function JobsControlBar({ onCreate, industries, locations }: Props) {
  const { searchQuery, setSearchQuery, filters, setFilters } = useJobs();

  const hasActiveFilters =
    filters.industry !== "" || filters.location !== "" || filters.status !== "" || searchQuery !== "";

  function clearAll() {
    setSearchQuery("");
    setFilters({ industry: "", location: "", status: "" });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jobs by name or criteria…"
            className="pl-9"
          />
        </div>
        <Button onClick={onCreate} className="bg-gradient-primary hover:opacity-90 transition-smooth shrink-0">
          <Plus className="h-4 w-4" />
          Create Manual Job
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Select
          value={filters.industry || ALL}
          onValueChange={(v) => setFilters({ industry: v === ALL ? "" : v })}
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Industry sector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All industries</SelectItem>
            {industries.map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.location || ALL}
          onValueChange={(v) => setFilters({ location: v === ALL ? "" : v })}
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All locations</SelectItem>
            {locations.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status || ALL}
          onValueChange={(v) => setFilters({ status: v === ALL ? "" : v })}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-9">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
