\set ON_ERROR_STOP on
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.factory_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_ref text NOT NULL UNIQUE,
 payment_method text NOT NULL, provider_reference text,
 status text NOT NULL DEFAULT 'pending', payment_status text,
 total_minor integer NOT NULL, currency text NOT NULL DEFAULT 'EGP',
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now(),
 updated_at timestamptz DEFAULT now(), paid_at timestamptz,
 fulfillment_status text NOT NULL DEFAULT 'not_started',
 delivery_channel text, delivery_email text, delivery_whatsapp text,
 delivery_consent_at timestamptz
);
CREATE UNIQUE INDEX factory_orders_provider_ref_uq ON public.factory_orders (payment_method,provider_reference) WHERE provider_reference IS NOT NULL;
CREATE TABLE public.factory_payment_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),provider text NOT NULL,provider_event_id text NOT NULL,
 provider_session_id text,order_id uuid REFERENCES public.factory_orders(id),event_type text,payment_status text,
 amount_minor int,currency text,verified boolean NOT NULL DEFAULT false,raw_event jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz DEFAULT now(),UNIQUE(provider,provider_event_id));
CREATE TABLE public.factory_cash_ledger (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),entry_type text NOT NULL,bucket text,
 order_id uuid REFERENCES public.factory_orders(id),amount_minor int NOT NULL,currency text NOT NULL DEFAULT 'EGP',
 note text,metadata jsonb NOT NULL DEFAULT '{}'::jsonb,created_at timestamptz DEFAULT now(),
 CONSTRAINT factory_cash_ledger_bucket_check CHECK (bucket IS NULL OR bucket IN('acquisition','product','infrastructure','reserve','owner'))
);
CREATE TABLE public.factory_order_access_tokens(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid REFERENCES public.factory_orders(id),token_hash text NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz DEFAULT now());
CREATE TABLE public.factory_deliveries(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid REFERENCES public.factory_orders(id),
 delivery_kind text NOT NULL,channel text NOT NULL,recipient text NOT NULL,status text NOT NULL DEFAULT 'queued',
 idempotency_key text NOT NULL UNIQUE,payload jsonb NOT NULL DEFAULT '{}'::jsonb,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now());
CREATE TABLE public.factory_exceptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid REFERENCES public.factory_orders(id),source text NOT NULL,
 category text NOT NULL,severity text NOT NULL DEFAULT 'warning',summary text NOT NULL,
 details jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now());
CREATE TABLE public.factory_audit_log (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, order_id uuid REFERENCES public.factory_orders(id),
 actor_type text DEFAULT 'system', event_type text NOT NULL,entity_type text,entity_id text,
 data jsonb DEFAULT '{}'::jsonb,created_at timestamptz DEFAULT now());
-- Representative production trigger contract, verified against live pg_get_functiondef 2026-10-18.
CREATE OR REPLACE FUNCTION public.factory_ensure_xpay_revenue_ledger() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
 IF new.payment_method='xpay' AND new.status='paid' AND new.payment_status='paid'
   AND (old.status IS DISTINCT FROM new.status OR old.payment_status IS DISTINCT FROM new.payment_status) THEN
 INSERT INTO public.factory_cash_ledger(entry_type,bucket,order_id,amount_minor,currency,note,metadata)
 SELECT 'revenue',null,new.id,new.total_minor,coalesce(new.currency,'EGP'),'Verified XPay payment',
 jsonb_build_object('provider','xpay','source','order_paid_trigger')
 WHERE NOT EXISTS (SELECT 1 FROM public.factory_cash_ledger l WHERE l.order_id=new.id AND l.entry_type='revenue');
 END IF;
 RETURN new;
END $$;
CREATE TRIGGER trg_factory_ensure_xpay_revenue_ledger
AFTER UPDATE OF status,payment_status ON public.factory_orders
FOR EACH ROW EXECUTE FUNCTION public.factory_ensure_xpay_revenue_ledger();
