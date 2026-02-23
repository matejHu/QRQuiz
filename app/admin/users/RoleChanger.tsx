"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { UserRole } from "@/lib/supabase/types";

interface Props {
  userId: string;
  currentRole: UserRole;
}

export function RoleChanger({ userId, currentRole }: Props) {
  const [role, setRole] = useState<UserRole>(currentRole);

  async function handleChange(newRole: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole as UserRole })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to update role.");
    } else {
      setRole(newRole as UserRole);
      toast.success("Role updated.");
    }
  }

  return (
    <Select value={role} onValueChange={handleChange}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="student">Student</SelectItem>
        <SelectItem value="creator">Creator</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}
