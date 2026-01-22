import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { withAuth } from "@/lib/middleware";
import { validateUpdateTask } from "@/lib/validation";
import type { Task, ApiResponse, JWTPayload } from "@/lib/types";

// GET /tasks/:id - Get a single task
async function getTask(
  request: NextRequest,
  user: JWTPayload,
  context?: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ task: Task }>>> {
  try {
    const params = await context?.params;
    const taskId = params?.id;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Get task ensuring it belongs to the user
    const tasks = await sql`
      SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
      FROM tasks 
      WHERE id = ${taskId} AND user_id = ${user.userId}
    ` as Task[];

    if (tasks.length === 0) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { task: tasks[0] },
    });
  } catch (error) {
    console.error("Get task error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /tasks/:id - Update a task
async function updateTask(
  request: NextRequest,
  user: JWTPayload,
  context?: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ task: Task }>>> {
  try {
    const params = await context?.params;
    const taskId = params?.id;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = validateUpdateTask(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { success: false, error: validation.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    // Check if task exists and belongs to user
    const existingTasks = await sql`
      SELECT id, title, description, status, priority, due_date 
      FROM tasks WHERE id = ${taskId} AND user_id = ${user.userId}
    ` as Task[];

    if (existingTasks.length === 0) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Merge updates with existing task data
    const updates = validation.data;
    const existingTask = existingTasks[0];
    
    const newTitle = updates.title !== undefined ? updates.title : existingTask.title;
    const newDescription = updates.description !== undefined ? (updates.description || null) : existingTask.description;
    const newStatus = updates.status !== undefined ? updates.status : existingTask.status;
    const newPriority = updates.priority !== undefined ? updates.priority : existingTask.priority;
    const newDueDate = updates.due_date !== undefined 
      ? (updates.due_date ? new Date(updates.due_date).toISOString() : null)
      : existingTask.due_date;

    // Execute update with all fields
    const updatedTasks = await sql`
      UPDATE tasks 
      SET title = ${newTitle},
          description = ${newDescription},
          status = ${newStatus},
          priority = ${newPriority},
          due_date = ${newDueDate},
          updated_at = NOW()
      WHERE id = ${taskId} AND user_id = ${user.userId}
      RETURNING id, user_id, title, description, status, priority, due_date, created_at, updated_at
    ` as Task[];

    return NextResponse.json({
      success: true,
      data: { task: updatedTasks[0] },
      message: "Task updated successfully",
    });
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /tasks/:id - Delete a task
async function deleteTask(
  request: NextRequest,
  user: JWTPayload,
  context?: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const params = await context?.params;
    const taskId = params?.id;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Delete task ensuring it belongs to the user
    const result = await sql`
      DELETE FROM tasks 
      WHERE id = ${taskId} AND user_id = ${user.userId}
      RETURNING id
    ` as { id: string }[];

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getTask);
export const PATCH = withAuth(updateTask);
export const DELETE = withAuth(deleteTask);
