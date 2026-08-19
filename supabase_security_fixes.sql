-- ====================================================================
-- SCRIPT DEPLOYMENT FOR SUPABASE SECURITY & RLS POLICIES (v2 - CORRECTED)
-- Target Tables: profiles, customers, transactions, subscription_offers,
--                customer_subscriptions, otp_codes
--
-- التصحيحات عن النسخة السابقة (v1 التي كادت تكسر التطبيق):
--   1) إسقاط كل السياسات الموجودة ديناميكياً عبر pg_policies بدلاً من
--      أسماء محددة (أي سياسة قديمة مسماة باسم مختلف كانت ستظل وتتحد OR)
--   2) دالة current_user_role() بأسلوب SECURITY DEFINER لإنهاء الـ
--      infinite recursion الناتج عن الاستعلام الذاتي داخل سياسة profiles
--   3) سياسات INSERT/UPDATE/DELETE للجداول الأربعة التي يكتبها التطبيق
--      client-side (customers / transactions / customer_subscriptions /
--      subscription_offers) — بدونها كان تفعيل RLS يكسر لوحات التاجر/الأدمن
--   4) منع anon من قراءة ملفات التجار (role='shop_owner' للمصادقين فقط)
--   5) تفعيل RLS على otp_codes بصفر سياسات => الوصول حصراً عبر service_role
--   6) عمود attempts لجدول otp_codes (يستخدمه حد المحاولات في otp-verify)
--
-- التشغيل: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- ============================================================
-- 0) إسقاط كل السياسات الموجودة على الجداول المستهدفة (ديناميكياً)
-- ============================================================
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles','customers','transactions',
                        'subscription_offers','customer_subscriptions','otp_codes')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ============================================================
-- 1) Helper: current_user_role()
--    SECURITY DEFINER => تُنفذ بصلاحيات المالك (postgres) وتتجاوز RLS،
--    فلا يحدث استدعاء ذاتي لا نهائي داخل سياسات profiles.
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1
$$;

-- ============================================================
-- 2) جدول profiles
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: صف المستخدم نفسه  OR  أدمن  OR  (ملفات التجار للمصادقين فقط)
-- ملاحظة: لم يعد بإمكان anon قراءة أي صف على الإطلاق.
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT
USING (
  (auth.uid() = id)
  OR (public.current_user_role() = 'admin')
  OR (role = 'shop_owner' AND auth.role() = 'authenticated')
);

-- UPDATE: صف المستخدم نفسه  OR  أدمن (لوحة إدارة المتاجر تعدّل بيانات أي محل)
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE
USING (auth.uid() = id OR public.current_user_role() = 'admin')
WITH CHECK (auth.uid() = id OR public.current_user_role() = 'admin');

-- لا توجد سياسات INSERT/DELETE على profiles عمداً:
--   * إنشاء المتاجر يتم حصراً عبر /api/admin/create-shop (service_role)
--   * حذف المتاجر يتم حصراً عبر /api/admin/delete-shop (service_role)
--   => يستحيل على أي مستخدم (حتى anon أو authenticated) إدراج صف
--      role='admin' أو حذف حسابات من المتصفح.

-- ============================================================
-- 3) Trigger: منع تغيير الدور من مستخدم غير مخوّل
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF current_setting('role', true) NOT IN ('service_role', 'postgres', 'supabase_admin')
       AND NOT (public.current_user_role() = 'admin') THEN
      RAISE EXCEPTION 'Unprivileged attempt to modify user role from % to %', OLD.role, NEW.role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_role_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change();

-- ============================================================
-- 4) customers / transactions / customer_subscriptions / subscription_offers
--    كلها مملوكة للمتجر (shop_owner_id = auth.uid()) أو متاحة للأدمن.
--    FOR ALL = SELECT + INSERT + UPDATE + DELETE
--    WITH CHECK يمنع إدراج/تعديل صفوف بمعرّف متجر تابع لشخص آخر.
-- ============================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_owner_access" ON public.customers
FOR ALL
USING (shop_owner_id = auth.uid() OR public.current_user_role() = 'admin')
WITH CHECK (shop_owner_id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "transactions_owner_access" ON public.transactions
FOR ALL
USING (shop_owner_id = auth.uid() OR public.current_user_role() = 'admin')
WITH CHECK (shop_owner_id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "customer_subscriptions_owner_access" ON public.customer_subscriptions
FOR ALL
USING (shop_owner_id = auth.uid() OR public.current_user_role() = 'admin')
WITH CHECK (shop_owner_id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "subscription_offers_owner_access" ON public.subscription_offers
FOR ALL
USING (shop_owner_id = auth.uid() OR public.current_user_role() = 'admin')
WITH CHECK (shop_owner_id = auth.uid() OR public.current_user_role() = 'admin');

-- ============================================================
-- 5) otp_codes: RLS بصفر سياسات => لا يصل إليها إلا service_role
--    (كودات التحقق لن تكون قابلة للقراءة حتى من حساب مصادق)
-- ============================================================
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- عمود محاولات التحقق (يستخدمه server/api/auth/otp-verify.post.ts للحد من التخمين)
ALTER TABLE public.otp_codes ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;

-- ============================================================
-- 6) تحقق نهائي — يجب أن تعرض هذه الاستعلامات السياسات الجديدة فقط:
-- SELECT * FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('profiles','customers','transactions',
--                     'subscription_offers','customer_subscriptions','otp_codes')
-- ORDER BY tablename;
-- ============================================================
