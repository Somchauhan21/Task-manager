import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { withAuth } from "@/lib/middleware";
import type { Task, ApiResponse, JWTPayload } from "@/lib/types";

// PATCH /tasks/:id/toggle - Toggle task status between pending and completed
async function toggleTask(
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

    // Get current task status
    const existingTasks = await sql`
      SELECT id, status FROM tasks WHERE id = ${taskId} AND user_id = ${user.userId}
    ` as Task[];

    if (existingTasks.length === 0) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const currentStatus = existingTasks[0].status;
    // Toggle: if completed -> pending, otherwise -> completed
    const newStatus = currentStatus === "completed" ? "pending" : "completed";

    // Update task status
    const updatedTasks = await sql`
      UPDATE tasks 
      SET status = ${newStatus}, updated_at = NOW()
      WHERE id = ${taskId} AND user_id = ${user.userId}
      RETURNING id, user_id, title, description, status, priority, due_date, created_at, updated_at
    ` as Task[];

    return NextResponse.json({
      success: true,
      data: { task: updatedTasks[0] },
      message: `Task marked as ${newStatus}`,
    });
  } catch (error) {
    console.error("Toggle task error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const PATCH = withAuth(toggleTask);
