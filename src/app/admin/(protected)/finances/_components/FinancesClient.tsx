"use client";

import { useState, useMemo, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  type: "expense" | "income";
  icon: string;
  color: string;
  parent_id: string | null;
  sort_order: number;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "expense" | "income";
  category_id: string | null;
  entity: string;
  tags: string[];
  notes: string | null;
  is_recurring: boolean;
  recurring_frequency: string | null;
  finance_categories: { name: string; icon: string; color: string } | null;
}

interface ShoppingItem {
  id: string;
  list_id: string;
  name: string;
  quantity: number;
  estimated_price: number | null;
  actual_price: number | null;
  purchased: boolean;
  url: string | null;
  notes: string | null;
  sort_order: number;
}

interface ShoppingList {
  id: string;
  name: string;
  status: "active" | "completed" | "archived";
  entity: string;
  budget: number | null;
  shopping_items: ShoppingItem[];
}

type Tab = "transactions" | "shopping" | "stats";
type EntityFilter = "all" | "vanzon" | "yoni" | "xalbat" | "vba" | "perso";

const ENTITIES: { value: EntityFilter; label: string; color: string }[] = [
  { value: "all", label: "Tout", color: "#64748b" },
  { value: "vanzon", label: "Vanzon", color: "#3b82f6" },
  { value: "yoni", label: "Yoni", color: "#22c55e" },
  { value: "xalbat", label: "Xalbat", color: "#f59e0b" },
  { value: "vba", label: "VBA", color: "#8b5cf6" },
  { value: "perso", label: "Perso", color: "#ec4899" },
];

// ── Main Component ───────────────────────────────────────────────────────────

interface Props {
  initialTransactions: Transaction[];
  categories: Category[];
  initialShoppingLists: ShoppingList[];
}

export default function FinancesClient({ initialTransactions, categories, initialShoppingLists }: Props) {
  const [tab, setTab] = useState<Tab>("transactions");
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>(initialShoppingLists);
  const [entityFilter, setEntityFilter] = useState<EntityFilter>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">("all");
  const [showAddRow, setShowAddRow] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── KPIs ─────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthTxns = transactions.filter((t) => t.date.startsWith(thisMonth));

    const totalExpenses = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const totalIncome = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const net = totalIncome - totalExpenses;
    const recurring = transactions.filter((t) => t.is_recurring && t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

    return { totalExpenses, totalIncome, net, recurring };
  }, [transactions]);

  // ── Filtered transactions ────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (entityFilter !== "all" && t.entity !== entityFilter) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      return true;
    });
  }, [transactions, entityFilter, typeFilter]);

  // ── Add transaction ──────────────────────────────────────────────────────

  const handleAdd = useCallback(async (form: Partial<Transaction>) => {
    const res = await fetch("/api/admin/finances/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (json.transaction) {
      setTransactions((prev) => [json.transaction, ...prev]);
      setShowAddRow(false);
    }
  }, []);

  // ── Delete transaction ───────────────────────────────────────────────────

  const handleDelete = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/finances/transactions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  }, []);

  // ── Update transaction ───────────────────────────────────────────────────

  const handleUpdate = useCallback(async (id: string, updates: Partial<Transaction>) => {
    const res = await fetch(`/api/admin/finances/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (json.transaction) {
      setTransactions((prev) => prev.map((t) => (t.id === id ? json.transaction : t)));
      setEditingId(null);
    }
  }, []);

  // ── Shopping list add ────────────────────────────────────────────────────

  const handleAddList = useCallback(async (name: string, entity: string) => {
    const res = await fetch("/api/admin/finances/shopping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, entity }),
    });
    const json = await res.json();
    if (json.list) {
      setShoppingLists((prev) => [json.list, ...prev]);
    }
  }, []);

  // ── Shopping item toggle ─────────────────────────────────────────────────

  const handleToggleItem = useCallback(async (listId: string, itemId: string, purchased: boolean) => {
    const res = await fetch(`/api/admin/finances/shopping/${listId}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId, purchased }),
    });
    if (res.ok) {
      setShoppingLists((prev) =>
        prev.map((l) =>
          l.id === listId
            ? { ...l, shopping_items: l.shopping_items.map((i) => (i.id === itemId ? { ...i, purchased } : i)) }
            : l
        )
      );
    }
  }, []);

  // ── Add shopping item ────────────────────────────────────────────────────

  const handleAddItem = useCallback(async (listId: string, name: string, estimated_price?: number) => {
    const res = await fetch(`/api/admin/finances/shopping/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, estimated_price }),
    });
    const json = await res.json();
    if (json.item) {
      setShoppingLists((prev) =>
        prev.map((l) => (l.id === listId ? { ...l, shopping_items: [...l.shopping_items, json.item] } : l))
      );
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard label="Depenses (mois)" value={`-${kpis.totalExpenses.toFixed(0)} EUR`} color="text-red-600" bg="bg-red-50" />
        <KPICard label="Revenus (mois)" value={`+${kpis.totalIncome.toFixed(0)} EUR`} color="text-emerald-600" bg="bg-emerald-50" />
        <KPICard label="Net" value={`${kpis.net >= 0 ? "+" : ""}${kpis.net.toFixed(0)} EUR`} color={kpis.net >= 0 ? "text-emerald-600" : "text-red-600"} bg={kpis.net >= 0 ? "bg-emerald-50" : "bg-red-50"} />
        <KPICard label="Recurring /mois" value={`${kpis.recurring.toFixed(0)} EUR`} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {([
          { key: "transactions", label: "Transactions" },
          { key: "shopping", label: "Listes de courses" },
          { key: "stats", label: "Stats" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "transactions" && (
        <TransactionsTab
          transactions={filtered}
          categories={categories}
          entityFilter={entityFilter}
          typeFilter={typeFilter}
          onEntityChange={setEntityFilter}
          onTypeChange={setTypeFilter}
          showAddRow={showAddRow}
          onToggleAdd={() => setShowAddRow(!showAddRow)}
          onAdd={handleAdd}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          editingId={editingId}
          onEdit={setEditingId}
        />
      )}

      {tab === "shopping" && (
        <ShoppingTab
          lists={shoppingLists}
          onAddList={handleAddList}
          onToggleItem={handleToggleItem}
          onAddItem={handleAddItem}
        />
      )}

      {tab === "stats" && <StatsTab transactions={transactions} categories={categories} />}
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-4 border border-slate-100`}>
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ── Transactions Tab ─────────────────────────────────────────────────────────

interface TransactionsTabProps {
  transactions: Transaction[];
  categories: Category[];
  entityFilter: EntityFilter;
  typeFilter: "all" | "expense" | "income";
  onEntityChange: (v: EntityFilter) => void;
  onTypeChange: (v: "all" | "expense" | "income") => void;
  showAddRow: boolean;
  onToggleAdd: () => void;
  onAdd: (form: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  editingId: string | null;
  onEdit: (id: string | null) => void;
}

function TransactionsTab({
  transactions,
  categories,
  entityFilter,
  typeFilter,
  onEntityChange,
  onTypeChange,
  showAddRow,
  onToggleAdd,
  onAdd,
  onDelete,
  onUpdate,
  editingId,
  onEdit,
}: TransactionsTabProps) {
  return (
    <div className="space-y-4">
      {/* Filters + Add button */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Entity chips */}
        <div className="flex gap-1 flex-wrap">
          {ENTITIES.map((e) => (
            <button
              key={e.value}
              onClick={() => onEntityChange(e.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                entityFilter === e.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value as "all" | "expense" | "income")}
          className="ml-auto text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="all">Tout</option>
          <option value="expense">Depenses</option>
          <option value="income">Revenus</option>
        </select>

        {/* Add button */}
        <button
          onClick={onToggleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Ajouter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 w-[100px]">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Description</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 w-[120px]">Categorie</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 w-[90px]">Entite</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 w-[100px]">Montant</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600 w-[60px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Add row */}
              {showAddRow && (
                <AddTransactionRow categories={categories} onAdd={onAdd} onCancel={onToggleAdd} />
              )}

              {transactions.length === 0 && !showAddRow && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Aucune transaction. Clique sur &quot;Ajouter&quot; pour commencer.
                  </td>
                </tr>
              )}

              {transactions.map((t) => (
                editingId === t.id ? (
                  <EditTransactionRow
                    key={t.id}
                    transaction={t}
                    categories={categories}
                    onSave={(updates) => onUpdate(t.id, updates)}
                    onCancel={() => onEdit(null)}
                  />
                ) : (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{formatDate(t.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{t.description}</span>
                        {t.is_recurring && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                            recurring
                          </span>
                        )}
                      </div>
                      {t.notes && <p className="text-xs text-slate-400 mt-0.5">{t.notes}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {t.finance_categories && (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <span>{t.finance_categories.icon}</span>
                          <span className="text-slate-600">{t.finance_categories.name}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <EntityBadge entity={t.entity} />
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${t.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                      {t.type === "income" ? "+" : "-"}{Number(t.amount).toFixed(2)} EUR
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(t.id)} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteConfirm(t.id, onDelete)} className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-right">{transactions.length} transactions affichees</p>
    </div>
  );
}

// ── Add Transaction Row ──────────────────────────────────────────────────────

function AddTransactionRow({
  categories,
  onAdd,
  onCancel,
}: {
  categories: Category[];
  onAdd: (form: Partial<Transaction>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "expense" as "expense" | "income",
    category_id: "",
    entity: "vanzon",
    notes: "",
    is_recurring: false,
  });

  const filteredCats = categories.filter((c) => c.type === form.type);

  return (
    <tr className="bg-blue-50/50 border-b border-blue-100">
      <td className="px-3 py-2">
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          placeholder="Description..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5"
          autoFocus
        />
        <input
          type="text"
          placeholder="Notes (optionnel)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full text-xs border border-slate-200 rounded-md px-2 py-1 mt-1 text-slate-500"
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as "expense" | "income", category_id: "" })}
          className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 mb-1"
        >
          <option value="expense">Depense</option>
          <option value="income">Revenu</option>
        </select>
        <select
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5"
        >
          <option value="">— Categorie —</option>
          {filteredCats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <select
          value={form.entity}
          onChange={(e) => setForm({ ...form, entity: e.target.value })}
          className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5"
        >
          {ENTITIES.filter((e) => e.value !== "all").map((e) => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
          <input
            type="checkbox"
            checked={form.is_recurring}
            onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
            className="w-3 h-3"
          />
          Recurring
        </label>
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          step="0.01"
          placeholder="0.00"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 text-right font-mono"
        />
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => {
              if (form.description && form.amount) {
                onAdd({ ...form, amount: Number(form.amount) as unknown as number, category_id: form.category_id || null });
              }
            }}
            className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button onClick={onCancel} className="p-1.5 rounded bg-slate-200 text-slate-600 hover:bg-slate-300">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Edit Transaction Row ─────────────────────────────────────────────────────

function EditTransactionRow({
  transaction,
  categories,
  onSave,
  onCancel,
}: {
  transaction: Transaction;
  categories: Category[];
  onSave: (updates: Partial<Transaction>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    date: transaction.date,
    description: transaction.description,
    amount: String(transaction.amount),
    type: transaction.type,
    category_id: transaction.category_id || "",
    entity: transaction.entity,
    notes: transaction.notes || "",
    is_recurring: transaction.is_recurring,
  });

  const filteredCats = categories.filter((c) => c.type === form.type);

  return (
    <tr className="bg-amber-50/50 border-b border-amber-100">
      <td className="px-3 py-2">
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5"
        />
        <input
          type="text"
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full text-xs border border-slate-200 rounded-md px-2 py-1 mt-1 text-slate-500"
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as "expense" | "income", category_id: "" })}
          className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 mb-1"
        >
          <option value="expense">Depense</option>
          <option value="income">Revenu</option>
        </select>
        <select
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5"
        >
          <option value="">— Categorie —</option>
          {filteredCats.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <select
          value={form.entity}
          onChange={(e) => setForm({ ...form, entity: e.target.value })}
          className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5"
        >
          {ENTITIES.filter((e) => e.value !== "all").map((e) => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
          <input
            type="checkbox"
            checked={form.is_recurring}
            onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
            className="w-3 h-3"
          />
          Recurring
        </label>
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 text-right font-mono"
        />
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onSave({ ...form, amount: Number(form.amount) as unknown as number, category_id: form.category_id || null })}
            className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button onClick={onCancel} className="p-1.5 rounded bg-slate-200 text-slate-600 hover:bg-slate-300">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Shopping Tab ─────────────────────────────────────────────────────────────

function ShoppingTab({
  lists,
  onAddList,
  onToggleItem,
  onAddItem,
}: {
  lists: ShoppingList[];
  onAddList: (name: string, entity: string) => void;
  onToggleItem: (listId: string, itemId: string, purchased: boolean) => void;
  onAddItem: (listId: string, name: string, estimated_price?: number) => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEntity, setNewEntity] = useState("vanzon");

  return (
    <div className="space-y-4">
      {/* Add list */}
      <div className="flex items-center gap-2">
        {showNew ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              placeholder="Nom de la liste..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2"
              autoFocus
            />
            <select
              value={newEntity}
              onChange={(e) => setNewEntity(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2"
            >
              {ENTITIES.filter((e) => e.value !== "all").map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
            <button
              onClick={() => { if (newName.trim()) { onAddList(newName.trim(), newEntity); setNewName(""); setShowNew(false); } }}
              className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"
            >
              Creer
            </button>
            <button onClick={() => setShowNew(false)} className="px-3 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs">
              Annuler
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle liste
          </button>
        )}
      </div>

      {/* Lists */}
      {lists.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          Aucune liste de courses. Cree-en une pour commencer.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {lists.map((list) => (
          <ShoppingListCard
            key={list.id}
            list={list}
            onToggleItem={onToggleItem}
            onAddItem={onAddItem}
          />
        ))}
      </div>
    </div>
  );
}

// ── Shopping List Card ────────────────────────────────────────────────────────

function ShoppingListCard({
  list,
  onToggleItem,
  onAddItem,
}: {
  list: ShoppingList;
  onToggleItem: (listId: string, itemId: string, purchased: boolean) => void;
  onAddItem: (listId: string, name: string, estimated_price?: number) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  const purchased = list.shopping_items.filter((i) => i.purchased).length;
  const total = list.shopping_items.length;
  const estimatedTotal = list.shopping_items.reduce((s, i) => s + (Number(i.estimated_price) || 0) * i.quantity, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800 text-sm">{list.name}</h3>
            <EntityBadge entity={list.entity} />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {purchased}/{total} achete{purchased > 1 ? "s" : ""} • ~{estimatedTotal.toFixed(0)} EUR estime
          </p>
        </div>
        {/* Progress ring */}
        <div className="relative w-10 h-10">
          <svg className="w-10 h-10 -rotate-90">
            <circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8f0" strokeWidth="3" />
            <circle
              cx="20" cy="20" r="16" fill="none" stroke="#22c55e" strokeWidth="3"
              strokeDasharray={`${total > 0 ? (purchased / total) * 100.5 : 0} 100.5`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-600">
            {total > 0 ? Math.round((purchased / total) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
        {list.shopping_items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/50">
            <button
              onClick={() => onToggleItem(list.id, item.id, !item.purchased)}
              className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                item.purchased ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-emerald-400"
              }`}
            >
              {item.purchased && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className={`flex-1 text-sm ${item.purchased ? "line-through text-slate-400" : "text-slate-700"}`}>
              {item.quantity > 1 && <span className="text-slate-400 mr-1">x{item.quantity}</span>}
              {item.name}
            </span>
            {item.estimated_price && (
              <span className="text-xs text-slate-400 font-mono">{Number(item.estimated_price).toFixed(0)} EUR</span>
            )}
          </div>
        ))}
      </div>

      {/* Add item */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
        {adding ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Article..."
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="flex-1 text-xs border border-slate-200 rounded-md px-2 py-1.5"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && itemName.trim()) {
                  onAddItem(list.id, itemName.trim(), itemPrice ? Number(itemPrice) : undefined);
                  setItemName("");
                  setItemPrice("");
                }
              }}
            />
            <input
              type="number"
              placeholder="Prix"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="w-16 text-xs border border-slate-200 rounded-md px-2 py-1.5"
            />
            <button
              onClick={() => {
                if (itemName.trim()) {
                  onAddItem(list.id, itemName.trim(), itemPrice ? Number(itemPrice) : undefined);
                  setItemName("");
                  setItemPrice("");
                }
              }}
              className="text-emerald-600 hover:text-emerald-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button onClick={() => { setAdding(false); setItemName(""); setItemPrice(""); }} className="text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un article
          </button>
        )}
      </div>
    </div>
  );
}

// ── Stats Tab ────────────────────────────────────────────────────────────────

function StatsTab({ transactions }: { transactions: Transaction[]; categories: Category[] }) {
  // Group by month
  const byMonth = useMemo(() => {
    const map = new Map<string, { expenses: number; income: number }>();
    for (const t of transactions) {
      const month = t.date.slice(0, 7);
      const entry = map.get(month) || { expenses: 0, income: 0 };
      if (t.type === "expense") entry.expenses += Number(t.amount);
      else entry.income += Number(t.amount);
      map.set(month, entry);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12);
  }, [transactions]);

  // Group by category (expenses only)
  const byCategory = useMemo(() => {
    const map = new Map<string, { name: string; icon: string; color: string; total: number }>();
    for (const t of transactions.filter((t) => t.type === "expense")) {
      const cat = t.finance_categories;
      const key = cat?.name || "Sans categorie";
      const entry = map.get(key) || { name: key, icon: cat?.icon || "📦", color: cat?.color || "#94a3b8", total: 0 };
      entry.total += Number(t.amount);
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [transactions]);

  // Group by entity
  const byEntity = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions.filter((t) => t.type === "expense")) {
      map.set(t.entity, (map.get(t.entity) || 0) + Number(t.amount));
    }
    return Array.from(map.entries()).sort(([, a], [, b]) => b - a);
  }, [transactions]);

  const totalExpenses = byCategory.reduce((s, c) => s + c.total, 0);

  return (
    <div className="space-y-6">
      {/* Monthly overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-800 mb-4">Par mois</h3>
        {byMonth.length === 0 ? (
          <p className="text-sm text-slate-400">Pas encore de donnees</p>
        ) : (
          <div className="space-y-2">
            {byMonth.map(([month, data]) => (
              <div key={month} className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-500 w-16">{month}</span>
                <div className="flex-1 flex gap-1 h-5">
                  {data.income > 0 && (
                    <div
                      className="bg-emerald-400 rounded-sm h-full"
                      style={{ width: `${Math.min((data.income / Math.max(data.income, data.expenses)) * 100, 100)}%` }}
                      title={`+${data.income.toFixed(0)} EUR`}
                    />
                  )}
                  {data.expenses > 0 && (
                    <div
                      className="bg-red-400 rounded-sm h-full"
                      style={{ width: `${Math.min((data.expenses / Math.max(data.income, data.expenses)) * 100, 100)}%` }}
                      title={`-${data.expenses.toFixed(0)} EUR`}
                    />
                  )}
                </div>
                <span className={`text-xs font-semibold tabular-nums w-20 text-right ${data.income - data.expenses >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {data.income - data.expenses >= 0 ? "+" : ""}{(data.income - data.expenses).toFixed(0)} EUR
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* By category */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 mb-4">Depenses par categorie</h3>
          <div className="space-y-2.5">
            {byCategory.slice(0, 10).map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <span className="text-sm">{cat.icon}</span>
                <span className="text-xs text-slate-600 flex-1">{cat.name}</span>
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(cat.total / totalExpenses) * 100}%`, backgroundColor: cat.color }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 tabular-nums w-16 text-right">
                  {cat.total.toFixed(0)} EUR
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 mb-4">Depenses par entite</h3>
          <div className="space-y-3">
            {byEntity.map(([entity, total]) => {
              const ent = ENTITIES.find((e) => e.value === entity);
              return (
                <div key={entity} className="flex items-center gap-3">
                  <EntityBadge entity={entity} />
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(total / (byEntity[0]?.[1] || 1)) * 100}%`, backgroundColor: ent?.color || "#64748b" }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 tabular-nums">{total.toFixed(0)} EUR</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function EntityBadge({ entity }: { entity: string }) {
  const ent = ENTITIES.find((e) => e.value === entity);
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
      style={{ backgroundColor: `${ent?.color || "#64748b"}15`, color: ent?.color || "#64748b" }}
    >
      {ent?.label || entity}
    </span>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function handleDeleteConfirm(id: string, onDelete: (id: string) => void) {
  if (window.confirm("Supprimer cette transaction ?")) {
    onDelete(id);
  }
}
