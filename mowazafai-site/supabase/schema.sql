-- =====================================================================
-- موظف AI — مخطّط قاعدة البيانات
-- Supabase → SQL Editor → New query → الصق → Run
-- آمن تشغيله أكثر من مرة.
-- =====================================================================

create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  clinic     text not null,
  phone      text not null,          -- يُخزَّن موحّداً: ‎+9665XXXXXXXX
  kind       text,                   -- تخصص العيادة
  page       text,                   -- الصفحة التي جاء منها
  ref        text,                   -- المُحيل
  source     text not null default 'website',
  status     text not null default 'new'    -- new / contacted / won / lost
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx     on public.leads (status);

-- ---------------------------------------------------------------------
-- أمان الصفوف: إدخال فقط من المتصفح.
-- لا قراءة، لا تعديل، لا حذف — حتى لو أخذ أحد مفتاح anon من الصفحة
-- (وهو مفتاح علني بطبيعته) ما يقدر يقرأ ولا ليد واحد.
-- ---------------------------------------------------------------------
alter table public.leads enable row level security;

drop policy if exists "website can insert leads" on public.leads;

create policy "website can insert leads"
  on public.leads for insert to anon
  with check (
    source = 'website'
    and char_length(clinic) between 2 and 120
    and char_length(phone)  between 9 and 20
  );

-- للتحقق من الإقفال:
--   select * from pg_policies where tablename = 'leads';
-- المفروض سياسة واحدة فقط، نوعها INSERT.
