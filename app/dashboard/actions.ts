"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { insertLink, updateLink, deleteLink } from "@/data/links";
import type { Link } from "@/db/schema";
import { revalidatePath } from "next/cache";

// Validation schema for creating a link
const createLinkSchema = z.object({
  originalUrl: z.string().refine(
    (val) => {
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Please enter a valid URL" }
  ),
});

// Validation schema for updating a link
const updateLinkSchema = z.object({
  linkId: z.number(),
  originalUrl: z.string().refine(
    (val) => {
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Please enter a valid URL" }
  ),
  shortCode: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/, {
    message: "Short code can only contain letters, numbers, hyphens, and underscores"
  }).optional(),
});

// Type for the input data
type CreateLinkInput = z.infer<typeof createLinkSchema>;

// Type for successful response
type CreateLinkSuccess = {
  success: true;
  data: Link;
};

// Type for error response
type CreateLinkError = {
  success: false;
  error: string;
};

// Combined return type
type CreateLinkResult = CreateLinkSuccess | CreateLinkError;

/**
 * Server action to create a new shortened link
 * @param data - Object containing the original URL
 * @returns Result object with success status and data or error message
 */
export async function createLink(data: unknown): Promise<CreateLinkResult> {
  // Check authentication
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }
  
  // Validate input data with Zod
  const result = createLinkSchema.safeParse(data);
  
  if (!result.success) {
    const firstError = result.error.issues[0];
    return { success: false, error: firstError.message };
  }
  
  try {
    // Insert the link using the helper function
    const newLink = await insertLink(result.data.originalUrl, userId);
    
    // Revalidate the dashboard page to show the new link
    revalidatePath("/dashboard");
    
    return { success: true, data: newLink };
  } catch (error) {
    console.error("Error creating link:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create link. Please try again." 
    };
  }
}

// Type for the update input data
type UpdateLinkInput = z.infer<typeof updateLinkSchema>;

// Type for successful update response
type UpdateLinkSuccess = {
  success: true;
  data: Link;
};

// Type for error response
type UpdateLinkError = {
  success: false;
  error: string;
};

// Combined return type
type UpdateLinkResult = UpdateLinkSuccess | UpdateLinkError;

/**
 * Server action to update an existing link
 * @param data - Object containing the link ID and new original URL
 * @returns Result object with success status and data or error message
 */
export async function editLink(data: unknown): Promise<UpdateLinkResult> {
  // Check authentication
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }
  
  // Validate input data with Zod
  const result = updateLinkSchema.safeParse(data);
  
  if (!result.success) {
    const firstError = result.error.issues[0];
    return { success: false, error: firstError.message };
  }
  
  try {
    // Update the link using the helper function
    const updatedLink = await updateLink(
      result.data.linkId,
      result.data.originalUrl,
      userId,
      result.data.shortCode
    );
    
    if (!updatedLink) {
      return { success: false, error: "Link not found or unauthorized." };
    }
    
    // Revalidate the dashboard page to show the updated link
    revalidatePath("/dashboard");
    
    return { success: true, data: updatedLink };
  } catch (error) {
    console.error("Error updating link:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update link. Please try again." 
    };
  }
}

// Type for successful delete response
type DeleteLinkSuccess = {
  success: true;
};

// Type for delete error response
type DeleteLinkError = {
  success: false;
  error: string;
};

// Combined return type for delete
type DeleteLinkResult = DeleteLinkSuccess | DeleteLinkError;

/**
 * Server action to delete a link
 * @param linkId - The ID of the link to delete
 * @returns Result object with success status or error message
 */
export async function removeLinkAction(linkId: number): Promise<DeleteLinkResult> {
  // Check authentication
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }
  
  try {
    // Delete the link using the helper function
    const deleted = await deleteLink(linkId, userId);
    
    if (!deleted) {
      return { success: false, error: "Link not found or unauthorized." };
    }
    
    // Revalidate the dashboard page to remove the deleted link
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting link:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete link. Please try again." 
    };
  }
}
