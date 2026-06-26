-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    shop_name TEXT,
    role TEXT DEFAULT 'shop_owner' CHECK (role IN ('admin', 'shop_owner')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profiles." ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    mobile_number TEXT NOT NULL,
    name TEXT,
    balance DECIMAL(12, 2) DEFAULT 0,
    total_saved DECIMAL(12, 2) DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(shop_owner_id, mobile_number)
);

-- Enable RLS on customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Customers Policies
CREATE POLICY "Shop owners can view their own customers." ON public.customers
    FOR SELECT USING (auth.uid() = shop_owner_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Shop owners can insert their own customers." ON public.customers
    FOR INSERT WITH CHECK (auth.uid() = shop_owner_id);

CREATE POLICY "Shop owners can update their own customers." ON public.customers
    FOR UPDATE USING (auth.uid() = shop_owner_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Shop owners can delete their own customers." ON public.customers
    FOR DELETE USING (auth.uid() = shop_owner_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    shop_owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    amount DECIMAL(12, 2) NOT NULL, -- The balance change
    paid_amount DECIMAL(12, 2) DEFAULT 0, -- Actual cash paid (for deposits)
    saved_amount DECIMAL(12, 2) DEFAULT 0, -- Amount saved (for withdrawals)
    balance_before DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    note TEXT,
    offer_id UUID REFERENCES public.subscription_offers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Transactions Policies
CREATE POLICY "Shop owners can view their own transactions." ON public.transactions
    FOR SELECT USING (auth.uid() = shop_owner_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Shop owners can insert transactions for their customers." ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = shop_owner_id);

-- Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, shop_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'shop_name',
    COALESCE(new.raw_user_meta_data->>'role', 'shop_owner')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add subscriptions_enabled to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscriptions_enabled BOOLEAN DEFAULT FALSE;

-- Create subscription_offers table
CREATE TABLE IF NOT EXISTS public.subscription_offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    usage_limit INTEGER NOT NULL,
    discount DECIMAL(12, 2) NOT NULL,
    duration INTEGER NOT NULL CHECK (duration IN (30, 60, 90)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.subscription_offers ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_offers
CREATE POLICY "Anyone can view subscription offers" ON public.subscription_offers
    FOR SELECT USING (true);

CREATE POLICY "Shop owners can insert their own offers" ON public.subscription_offers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Shop owners can update their own offers" ON public.subscription_offers
    FOR UPDATE USING (auth.uid() = shop_owner_id);

CREATE POLICY "Shop owners can delete their own offers" ON public.subscription_offers
    FOR DELETE USING (auth.uid() = shop_owner_id);

CREATE POLICY "Admins have full access to offers" ON public.subscription_offers
    FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Create customer_subscriptions table
CREATE TABLE IF NOT EXISTS public.customer_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    offer_id UUID REFERENCES public.subscription_offers(id) ON DELETE CASCADE NOT NULL,
    shop_owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.customer_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for customer_subscriptions
CREATE POLICY "Shop owners can view their customers' subscriptions" ON public.customer_subscriptions
    FOR SELECT USING (auth.uid() = shop_owner_id);

CREATE POLICY "Shop owners can manage their customers' subscriptions" ON public.customer_subscriptions
    FOR ALL USING (auth.uid() = shop_owner_id);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS login_password TEXT;
CREATE TABLE IF NOT EXISTS otp_codes (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), phone TEXT NOT NULL, code TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), expires_at TIMESTAMP WITH TIME ZONE NOT NULL);
