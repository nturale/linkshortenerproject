"use client";

import { useState } from "react";
import { editLink } from "../actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import type { Link } from "@/db/schema";

interface EditLinkDialogProps {
  link: Link;
}

export function EditLinkDialog({ link }: EditLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(link.originalUrl);
  const [shortCode, setShortCode] = useState(link.shortCode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await editLink({ 
        linkId: link.id, 
        originalUrl: url,
        shortCode: shortCode 
      });

      if (result.success) {
        // Success - close dialog
        setOpen(false);
      } else {
        // Show error message
        setError(result.error);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error editing link:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2"
          aria-label="Edit link"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
            <DialogDescription>
              Update the short code and/or destination URL
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-shortcode">Short Code</Label>
              <Input
                id="edit-shortcode"
                type="text"
                placeholder="abc123"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                required
                disabled={isLoading}
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_-]+"
                aria-describedby="shortcode-hint"
              />
              <p id="shortcode-hint" className="text-xs text-muted-foreground">
                3-20 characters. Letters, numbers, hyphens, and underscores only.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-url">Original URL</Label>
              <Input
                id="edit-url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                disabled={isLoading}
                aria-invalid={!!error}
              />
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setUrl(link.originalUrl);
                setShortCode(link.shortCode);
                setError(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !url || !shortCode}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
