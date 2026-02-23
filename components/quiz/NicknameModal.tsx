"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NicknameModalProps {
  open: boolean;
  onConfirm: (name: string) => Promise<void>;
}

export function NicknameModal({ open, onConfirm }: NicknameModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onConfirm(name.trim());
    setLoading(false);
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Choose a display name</DialogTitle>
          <DialogDescription>
            Pick a nickname to track your score. No email or personal info needed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nickname">Your nickname</Label>
            <Input
              id="nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SuperStudent42"
              maxLength={40}
              autoFocus
            />
          </div>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? "Saving…" : "Start quiz"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
