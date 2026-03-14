"use client";

import { useEffect } from "react";
import { useArticleCategory } from "@/lib/contexts/ArticleCategoryContext";

export default function ArticleCategorySync({ category }: { category: string }) {
  const { setCategory } = useArticleCategory();

  useEffect(() => {
    setCategory(category as Parameters<typeof setCategory>[0]);
    return () => setCategory(null);
  }, [category, setCategory]);

  return null;
}
