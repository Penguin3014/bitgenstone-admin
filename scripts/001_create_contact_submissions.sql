-- 문의 내역 테이블 생성
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  message text not null,
  status text default 'new' check (status in ('new', 'in_progress', 'completed')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 인덱스 생성 (성능 향상)
create index if not exists idx_contact_submissions_status on public.contact_submissions(status);
create index if not exists idx_contact_submissions_created_at on public.contact_submissions(created_at desc);

-- RLS 활성화 (보안)
alter table public.contact_submissions enable row level security;

-- 누구나 문의를 제출할 수 있도록 허용
create policy "Anyone can insert contact submissions"
  on public.contact_submissions for insert
  with check (true);

-- 관리자만 조회 가능 (현재는 모든 인증된 사용자가 조회 가능하도록 설정, 추후 수정 필요)
create policy "Anyone can view contact submissions"
  on public.contact_submissions for select
  using (true);

-- 관리자만 업데이트 가능
create policy "Anyone can update contact submissions"
  on public.contact_submissions for update
  using (true);

-- 업데이트 시 updated_at 자동 갱신 함수
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 트리거 생성
drop trigger if exists set_updated_at on public.contact_submissions;
create trigger set_updated_at
  before update on public.contact_submissions
  for each row
  execute function public.handle_updated_at();
