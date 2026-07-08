-- KaPok Swim Club — single-document app state.
-- The whole AppState (settings + swimmers + attendance + payments) lives as one
-- JSON blob. The Edge Function is the only writer (service role); the browser
-- never touches this table directly, so RLS can stay fully locked down.

create table if not exists app_state (
  id         int primary key default 1,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

alter table app_state enable row level security;
-- No policies → the anon/public key cannot read or write. Only the Edge
-- Function's service-role key (which bypasses RLS) can.

-- Seed one row with two random capability tokens and the 35-name roster.
-- After running this, copy `data->'settings'->>'coachToken'` from the row and
-- open the app at  <site>/#/c/<that token>  to bootstrap.
insert into app_state (id, data)
values (
  1,
  jsonb_build_object(
    'settings', jsonb_build_object(
      'clubName', 'Macau KaPok Swimming Club',
      'venueName', '英才',
      'sessionPrice', 15,
      'currencyLabel', '元',
      'coachToken', replace(gen_random_uuid()::text, '-', ''),
      'parentToken', replace(gen_random_uuid()::text, '-', ''),
      'timezone', 'Asia/Macau',
      'recoveryPin', '1111'
    ),
    'swimmers', (
      select jsonb_agg(
        jsonb_build_object(
          'id', replace(gen_random_uuid()::text, '-', ''),
          'displayName', name,
          'active', true,
          'sortOrder', ord - 1,
          'createdAt', now(),
          'archivedAt', null
        )
        order by ord
      )
      from unnest(array[
        '靖翹','奕熹','晞兒','楷楷','筱白','子菩','義騰','雪諾','永皓','巧澄',
        '熙朗','知韻','雅晴','羅偉祺','馮驤','穎希','筱淞','樂澄','君諾','穎天',
        '星宇','日朗','冼政霖','金文馨','郭梓睿','菲澄','一琛','昕潼','盧以弢','毛烈度',
        '嘉寶','迦諾','奕訢','卓翹','曾翔皓'
      ]) with ordinality as t(name, ord)
    ),
    'attendance', '[]'::jsonb,
    'payments', '[]'::jsonb
  )
)
on conflict (id) do nothing;
