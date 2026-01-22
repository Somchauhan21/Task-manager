"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { tasksApi, type TasksQueryParams } from "@/lib/api-client";
import type { Task, CreateTaskDTO, UpdateTaskDTO } from "@/lib/types";
import { DashboardHeader } from "@/components/dashboard-header";
import { TaskList } from "@/components/task-list";
import { TaskForm } from "@/components/task-form";
import { TaskFilters } from "@/components/task-filters";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Task state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Filter state
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch tasks
  const fetchTasks = useCallback(async (params: TasksQueryParams = {}) => {
    setIsLoading(true);
    try {
      const response = await tasksApi.getAll({
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit,
        status: params.status || (status && status !== "all" ? status : undefined),
        search: params.search !== undefined ? params.search : debouncedSearch || undefined,
      });
      setTasks(response.data);
      setPagination(response.pagination);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch tasks");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, status, debouncedSearch]);

  // Initial fetch and refetch on filter changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks({ page: 1 });
    }
  }, [isAuthenticated, debouncedSearch, status, fetchTasks]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    fetchTasks({ page });
  };

  // Handle create/update task
  const handleSubmitTask = async (data: CreateTaskDTO | UpdateTaskDTO) => {
    try {
      if (editingTask) {
        await tasksApi.update(editingTask.id, data);
        toast.success("Task updated successfully");
      } else {
        await tasksApi.create(data as CreateTaskDTO);
        toast.success("Task created successfully");
      }
      setEditingTask(null);
      fetchTasks({ page: editingTask ? pagination.page : 1 });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save task");
      throw error;
    }
  };

  // Handle toggle task
  const handleToggleTask = async (id: string) => {
    try {
      await tasksApi.toggle(id);
      // Update local state optimistically
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id
            ? {
                ...task,
                status: task.status === "completed" ? "pending" : "completed",
              }
            : task
        )
      );
      toast.success("Task status updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to toggle task");
      // Refetch to restore correct state
      fetchTasks();
    }
  };

  // Handle delete task
  const handleDeleteTask = async (id: string) => {
    try {
      await tasksApi.delete(id);
      toast.success("Task deleted successfully");
      // Refetch with adjusted page if needed
      const newTotal = pagination.total - 1;
      const newTotalPages = Math.ceil(newTotal / pagination.limit);
      const newPage = Math.min(pagination.page, Math.max(1, newTotalPages));
      fetchTasks({ page: newPage });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete task");
    }
  };

  // Handle edit task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearch("");
    setStatus("");
  };

  // Show loading while checking auth
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">My Tasks</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage and track your tasks
              </p>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>

          {/* Filters */}
          <TaskFilters
            search={search}
            status={status}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            onClearFilters={handleClearFilters}
          />

          {/* Task List */}
          <TaskList
            tasks={tasks}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onToggle={handleToggleTask}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
        </div>
      </main>

      {/* Task Form Dialog */}
      <TaskForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        onSubmit={handleSubmitTask}
      />
    </div>
  );
}
