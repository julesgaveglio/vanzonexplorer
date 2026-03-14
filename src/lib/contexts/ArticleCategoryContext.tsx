"use client";

import { createContext, useContext, useState } from "react";

type ArticleCategory =
  | "Road Trips"
  | "Pays Basque"
  | "Aménagement Van"
  | "Business Van"
  | "Achat Van"
  | "Club Privé"
  | null;

type ContextValue = {
  category: ArticleCategory;
  setCategory: (cat: ArticleCategory) => void;
};

const ArticleCategoryContext = createContext<ContextValue>({
  category: null,
  setCategory: () => {},
});

export function ArticleCategoryProvider({ children }: { children: React.ReactNode }) {
  const [category, setCategory] = useState<ArticleCategory>(null);
  return (
    <ArticleCategoryContext.Provider value={{ category, setCategory }}>
      {children}
    </ArticleCategoryContext.Provider>
  );
}

export function useArticleCategory() {
  return useContext(ArticleCategoryContext);
}
