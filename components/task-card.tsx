"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Calendar, Loader2 } from "lucide-react";
import type { Task } from "@/lib/types";

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
}

const priorityColors: Record<string, string> = {
  low: "bg-secondary text-secondary-foreground",
  medium: "bg-chart-4/20 text-chart-4",
  high: "bg-destructive/20 text-destructive",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggle(task.id);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(task.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const isCompleted = task.status === "completed";
  const formattedDueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Card className={`transition-opacity ${isCompleted ? "opacity-60" : ""}`}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="pt-0.5">
            {isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Checkbox
                checked={isCompleted}
                onCheckedChange={handleToggle}
                aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className={`font-medium text-sm leading-tight ${
                isCompleted ? "line-through text-muted-foreground" : ""
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Task options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive focus:text-destructive"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={priorityColors[task.priority]}>
          {task.priority}
        </Badge>
        <Badge variant="outline">{statusLabels[task.status]}</Badge>
        {formattedDueDate && (
          <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
            <Calendar className="h-3 w-3" />
            {formattedDueDate}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
