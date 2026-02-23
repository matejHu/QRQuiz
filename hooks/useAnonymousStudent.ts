"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "anon_token";
const NAME_KEY = "anon_display_name";

export interface AnonStudent {
  id: string;
  display_name: string;
}

export function useAnonymousStudent() {
  const [student, setStudent] = useState<AnonStudent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem(STORAGE_KEY);
    const display_name = localStorage.getItem(NAME_KEY);
    if (id && display_name) {
      setStudent({ id, display_name });
    }
    setLoading(false);
  }, []);

  async function createStudent(display_name: string): Promise<AnonStudent | null> {
    const res = await fetch("/api/auth/anonymous", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name }),
    });
    if (!res.ok) return null;
    const data: AnonStudent = await res.json();
    localStorage.setItem(STORAGE_KEY, data.id);
    localStorage.setItem(NAME_KEY, data.display_name);
    setStudent(data);
    return data;
  }

  function clearStudent() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(NAME_KEY);
    setStudent(null);
  }

  return { student, loading, createStudent, clearStudent };
}
