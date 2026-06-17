import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * The currently-selected family member across the dashboard and tools.
 * `null` means the account owner ("You"). Persisted to localStorage so the
 * selection survives navigation between the dashboard and tool pages.
 */
const STORAGE_KEY = "nirogi-active-member";

type Ctx = {
  memberId: string | null;
  memberName: string | null;
  setMember: (id: string | null, name: string | null) => void;
};

const MemberContext = createContext<Ctx | null>(null);

export function ActiveMemberProvider({ children }: { children: ReactNode }) {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { id: string | null; name: string | null };
        setMemberId(parsed.id ?? null);
        setMemberName(parsed.name ?? null);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setMember = useCallback((id: string | null, name: string | null) => {
    setMemberId(id);
    setMemberName(name);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, name }));
    }
  }, []);

  const value = useMemo(() => ({ memberId, memberName, setMember }), [memberId, memberName, setMember]);
  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
}

export function useActiveMember() {
  const ctx = useContext(MemberContext);
  if (!ctx) return { memberId: null, memberName: null, setMember: () => {} };
  return ctx;
}
