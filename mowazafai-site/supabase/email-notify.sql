-- =====================================================================
-- موظف AI — تنبيه إيميل عند كل ليد جديد
--
-- كله SQL: بلا n8n وبلا Edge Function وبلا Supabase CLI.
-- يعتمد على pg_net المدمجة في Supabase.
--
-- ⚠️ قبل التشغيل بدّل RESEND_API_KEY_HERE بمفتاحك من resend.com
--    لا تحفظ المفتاح الحقيقي في هذا الملف داخل Git.
-- =====================================================================

create extension if not exists pg_net;

create or replace function public.notify_new_lead()
returns trigger
language plpgsql
security definer
set search_path = public, net, extensions
as $$
declare
  v_key  text := 'RESEND_API_KEY_HERE';
  v_to   text := 'you@example.com';
  v_from text := 'Mowazafai <onboarding@resend.dev>';
  v_html text;
begin
  v_html :=
    '<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;font-size:15px;line-height:1.9;color:#1C4942">' ||
    '<h2 style="margin:0 0 14px">ليد جديد من الموقع</h2>' ||
    '<p>العيادة: <b>' || coalesce(new.clinic,'—') || '</b></p>' ||
    '<p>الجوال: <b dir="ltr">' || coalesce(new.phone,'—') || '</b></p>' ||
    '<p>التخصص: ' || coalesce(new.kind,'—') || '</p>' ||
    '<p>الوقت: ' || to_char(new.created_at at time zone 'Asia/Riyadh','YYYY-MM-DD HH24:MI') || '</p>' ||
    '</div>';

  perform net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
                 'Content-Type','application/json',
                 'Authorization','Bearer ' || v_key),
    body    := jsonb_build_object(
                 'from', v_from,
                 'to',   jsonb_build_array(v_to),
                 'subject','ليد جديد: ' || coalesce(new.clinic,'بلا اسم'),
                 'html', v_html)
  );
  return new;
exception when others then
  return new;   -- فشل التنبيه لا يضيّع الليد
end;
$$;

drop trigger if exists on_lead_created on public.leads;

create trigger on_lead_created
  after insert on public.leads
  for each row execute function public.notify_new_lead();

-- ---------------------------------------------------------------------
-- اختبار:
--   insert into public.leads (clinic, phone, kind)
--   values ('عيادة تجريبية', '+966501234567', 'أسنان');
--
-- تتبّع الطلبات الصادرة:
--   select id, status_code, left(content,300)
--   from net._http_response order by id desc limit 5;
--
-- ملاحظة: المُرسِل onboarding@resend.dev مشترك بين مستخدمي Resend
-- وGmail يصنّفه عشوائياً غالباً. وثّق نطاقك من Resend → Domains
-- وبدّل v_from ليصل البريد إلى الوارد مباشرة.
-- ---------------------------------------------------------------------
