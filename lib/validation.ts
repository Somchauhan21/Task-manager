import type { RegisterDTO, LoginDTO, CreateTaskDTO, UpdateTaskDTO } from "./types";

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validate email format
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

// Validate password strength
function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

// Validate registration input
export function validateRegister(data: unknown): { valid: boolean; errors: ValidationError[]; data?: RegisterDTO } {
  const errors: ValidationError[] = [];
  
  if (!data || typeof data !== "object") {
    return { valid: false, errors: [{ field: "body", message: "Request body is required" }] };
  }

  const body = data as Record<string, unknown>;

  // Email validation
  if (!body.email || typeof body.email !== "string") {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!isValidEmail(body.email)) {
    errors.push({ field: "email", message: "Invalid email format" });
  }

  // Password validation
  if (!body.password || typeof body.password !== "string") {
    errors.push({ field: "password", message: "Password is required" });
  } else if (!isValidPassword(body.password)) {
    errors.push({ field: "password", message: "Password must be at least 8 characters" });
  }

  // Name validation
  if (!body.name || typeof body.name !== "string") {
    errors.push({ field: "name", message: "Name is required" });
  } else if (body.name.trim().length < 2) {
    errors.push({ field: "name", message: "Name must be at least 2 characters" });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      email: (body.email as string).toLowerCase().trim(),
      password: body.password as string,
      name: (body.name as string).trim(),
    },
  };
}

// Validate login input
export function validateLogin(data: unknown): { valid: boolean; errors: ValidationError[]; data?: LoginDTO } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: [{ field: "body", message: "Request body is required" }] };
  }

  const body = data as Record<string, unknown>;

  // Email validation
  if (!body.email || typeof body.email !== "string") {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!isValidEmail(body.email)) {
    errors.push({ field: "email", message: "Invalid email format" });
  }

  // Password validation
  if (!body.password || typeof body.password !== "string") {
    errors.push({ field: "password", message: "Password is required" });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      email: (body.email as string).toLowerCase().trim(),
      password: body.password as string,
    },
  };
}

// Validate create task input
export function validateCreateTask(data: unknown): { valid: boolean; errors: ValidationError[]; data?: CreateTaskDTO } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: [{ field: "body", message: "Request body is required" }] };
  }

  const body = data as Record<string, unknown>;

  // Title validation
  if (!body.title || typeof body.title !== "string") {
    errors.push({ field: "title", message: "Title is required" });
  } else if (body.title.trim().length < 1) {
    errors.push({ field: "title", message: "Title cannot be empty" });
  } else if (body.title.trim().length > 255) {
    errors.push({ field: "title", message: "Title must be less than 255 characters" });
  }

  // Description validation (optional)
  if (body.description !== undefined && typeof body.description !== "string") {
    errors.push({ field: "description", message: "Description must be a string" });
  }

  // Status validation (optional)
  const validStatuses = ["pending", "in_progress", "completed"];
  if (body.status !== undefined && !validStatuses.includes(body.status as string)) {
    errors.push({ field: "status", message: "Status must be pending, in_progress, or completed" });
  }

  // Priority validation (optional)
  const validPriorities = ["low", "medium", "high"];
  if (body.priority !== undefined && !validPriorities.includes(body.priority as string)) {
    errors.push({ field: "priority", message: "Priority must be low, medium, or high" });
  }

  // Due date validation (optional)
  if (body.due_date !== undefined && body.due_date !== null) {
    if (typeof body.due_date !== "string") {
      errors.push({ field: "due_date", message: "Due date must be a string" });
    } else {
      const date = new Date(body.due_date);
      if (Number.isNaN(date.getTime())) {
        errors.push({ field: "due_date", message: "Invalid date format" });
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      title: (body.title as string).trim(),
      description: body.description ? (body.description as string).trim() : undefined,
      status: body.status as CreateTaskDTO["status"],
      priority: body.priority as CreateTaskDTO["priority"],
      due_date: body.due_date as string | undefined,
    },
  };
}

// Validate update task input
export function validateUpdateTask(data: unknown): { valid: boolean; errors: ValidationError[]; data?: UpdateTaskDTO } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: [{ field: "body", message: "Request body is required" }] };
  }

  const body = data as Record<string, unknown>;

  // At least one field must be provided
  const hasAnyField = body.title !== undefined || 
                      body.description !== undefined || 
                      body.status !== undefined || 
                      body.priority !== undefined || 
                      body.due_date !== undefined;

  if (!hasAnyField) {
    errors.push({ field: "body", message: "At least one field must be provided" });
  }

  // Title validation (optional)
  if (body.title !== undefined) {
    if (typeof body.title !== "string") {
      errors.push({ field: "title", message: "Title must be a string" });
    } else if (body.title.trim().length < 1) {
      errors.push({ field: "title", message: "Title cannot be empty" });
    } else if (body.title.trim().length > 255) {
      errors.push({ field: "title", message: "Title must be less than 255 characters" });
    }
  }

  // Description validation (optional, can be null to clear)
  if (body.description !== undefined && body.description !== null && typeof body.description !== "string") {
    errors.push({ field: "description", message: "Description must be a string or null" });
  }

  // Status validation (optional)
  const validStatuses = ["pending", "in_progress", "completed"];
  if (body.status !== undefined && !validStatuses.includes(body.status as string)) {
    errors.push({ field: "status", message: "Status must be pending, in_progress, or completed" });
  }

  // Priority validation (optional)
  const validPriorities = ["low", "medium", "high"];
  if (body.priority !== undefined && !validPriorities.includes(body.priority as string)) {
    errors.push({ field: "priority", message: "Priority must be low, medium, or high" });
  }

  // Due date validation (optional, can be null to clear)
  if (body.due_date !== undefined && body.due_date !== null) {
    if (typeof body.due_date !== "string") {
      errors.push({ field: "due_date", message: "Due date must be a string or null" });
    } else {
      const date = new Date(body.due_date);
      if (Number.isNaN(date.getTime())) {
        errors.push({ field: "due_date", message: "Invalid date format" });
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const updateData: UpdateTaskDTO = {};
  if (body.title !== undefined) updateData.title = (body.title as string).trim();
  if (body.description !== undefined) updateData.description = body.description === null ? undefined : (body.description as string).trim();
  if (body.status !== undefined) updateData.status = body.status as UpdateTaskDTO["status"];
  if (body.priority !== undefined) updateData.priority = body.priority as UpdateTaskDTO["priority"];
  if (body.due_date !== undefined) updateData.due_date = body.due_date as string | null;

  return {
    valid: true,
    errors: [],
    data: updateData,
  };
}
