import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { withAuth } from "@/lib/middleware";
import { validateCreateTask } from "@/lib/validation";
import type { Task, ApiResponse, PaginatedResponse, JWTPayload } from "@/lib/types";

// GET /tasks - List tasks with pagination, filtering, and search
async function getTasks(
  request: NextRequest,
  user: JWTPayload
): Promise<NextResponse<PaginatedResponse<Task>>> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "10", 10)));
    const offset = (page - 1) * limit;

    // Filter parameters
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const searchPattern = search ? `%${search.trim()}%` : null;

    // Get total count based on filters
    let countResult: { count: string }[];
    if (status && search) {
      countResult = await sql`
        SELECT COUNT(*) as count FROM tasks 
        WHERE user_id = ${user.userId} AND status = ${status} AND title ILIKE ${searchPattern}
      ` as { count: string }[];
    } else if (status) {
      countResult = await sql`
        SELECT COUNT(*) as count FROM tasks 
        WHERE user_id = ${user.userId} AND status = ${status}
      ` as { count: string }[];
    } else if (search) {
      countResult = await sql`
        SELECT COUNT(*) as count FROM tasks 
        WHERE user_id = ${user.userId} AND title ILIKE ${searchPattern}
      ` as { count: string }[];
    } else {
      countResult = await sql`
        SELECT COUNT(*) as count FROM tasks WHERE user_id = ${user.userId}
      ` as { count: string }[];
    }
    const total = Number.parseInt(countResult[0]?.count || "0", 10);

    // Get paginated tasks based on filters
    let tasks: Task[];
    if (status && search) {
      tasks = await sql`
        SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
        FROM tasks 
        WHERE user_id = ${user.userId} AND status = ${status} AND title ILIKE ${searchPattern}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as Task[];
    } else if (status) {
      tasks = await sql`
        SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
        FROM tasks 
        WHERE user_id = ${user.userId} AND status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as Task[];
    } else if (search) {
      tasks = await sql`
        SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
        FROM tasks 
        WHERE user_id = ${user.userId} AND title ILIKE ${searchPattern}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as Task[];
    } else {
      tasks = await sql`
        SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
        FROM tasks 
        WHERE user_id = ${user.userId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as Task[];
    }

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      },
      { status: 500 }
    );
  }
}

// POST /tasks - Create a new task
async function createTask(
  request: NextRequest,
  user: JWTPayload
): Promise<NextResponse<ApiResponse<{ task: Task }>>> {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateCreateTask(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        { success: false, error: validation.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { title, description, status, priority, due_date } = validation.data;

    // Create task
    const tasks = await sql`
      INSERT INTO tasks (user_id, title, description, status, priority, due_date)
      VALUES (
        ${user.userId}, 
        ${title}, 
        ${description || null}, 
        ${status || "pending"}, 
        ${priority || "medium"}, 
        ${due_date ? new Date(due_date).toISOString() : null}
      )
      RETURNING id, user_id, title, description, status, priority, due_date, created_at, updated_at
    ` as Task[];

    return NextResponse.json(
      {
        success: true,
        data: { task: tasks[0] },
        message: "Task created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getTasks);
export const POST = withAuth(createTask);
