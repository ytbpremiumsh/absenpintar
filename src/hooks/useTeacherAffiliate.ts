import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface TeacherAffiliateData {
  id: string;
  affiliate_code: string;
  full_name: string;
  email: string;
  phone: string | null;
  current_balance: number;
  total_earned: number;
  total_withdrawn: number;
  commission_rate: number;
  status: string;
}

export interface CommissionRow {
  id: string;
  plan_name: string;
  plan_price: number;
  commission_amount: number;
  commission_rate: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

export interface WithdrawalRow {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  ewallet_type: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  estimated_payout_at: string | null;
}

export function useTeacherAffiliate() {
  const { user, profile } = useAuth();
  const [affiliate, setAffiliate] = useState<TeacherAffiliateData | null>(null);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      // Try fetch existing affiliate linked by user_id
      const { data: existing } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      let aff = existing;

      // Auto-enroll if not exists
      if (!aff && profile) {
        setEnrolling(true);
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "TCH-";
        for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));

        const { data: created, error } = await supabase
          .from("affiliates")
          .insert({
            user_id: user.id,
            email: user.email || `${user.id}@teacher.local`,
            full_name: profile.full_name || "Guru",
            phone: profile.phone || null,
            password_hash: "TEACHER_LINKED_NO_PASSWORD",
            affiliate_code: code,
            commission_rate: 50,
            status: "active",
          })
          .select()
          .single();
        if (!error) aff = created;
        setEnrolling(false);
      }

      if (aff) {
        setAffiliate(aff as any);
        const [comRes, wdRes] = await Promise.all([
          supabase
            .from("affiliate_commissions")
            .select("*")
            .eq("affiliate_id", aff.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("affiliate_withdrawals")
            .select("*")
            .eq("affiliate_id", aff.id)
            .order("created_at", { ascending: false }),
        ]);
        setCommissions((comRes.data as any) || []);
        setWithdrawals((wdRes.data as any) || []);
      }
    } catch (err) {
      console.error("Failed to load teacher affiliate:", err);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const referralLink = affiliate?.affiliate_code
    ? `${window.location.origin}/register?ref=${affiliate.affiliate_code}`
    : "";

  return {
    affiliate,
    commissions,
    withdrawals,
    loading,
    enrolling,
    referralLink,
    refresh: fetchAll,
  };
}
