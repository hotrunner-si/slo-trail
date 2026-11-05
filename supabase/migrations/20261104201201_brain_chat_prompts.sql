-- Public conversation starters, separate from evidence and survey questions.
create table public.brain_chat_prompts (
  id smallint primary key check (id > 0),
  prompt text not null unique check (length(prompt) between 20 and 500),
  active boolean not null default true
);
alter table public.brain_chat_prompts enable row level security;
revoke all on public.brain_chat_prompts from anon, authenticated;
grant select on public.brain_chat_prompts to anon, authenticated;
grant all on public.brain_chat_prompts to service_role;
create policy "Read active chat prompts" on public.brain_chat_prompts
  for select to anon, authenticated using (active);
comment on table public.brain_chat_prompts is 'Approved public trail chat starters; never evidence or private user content.';
insert into public.brain_chat_prompts (id, prompt) values
  (1, 'Prvič grem na 50-kilometrski trail. Katere slovenske tekme bi primerjal glede na vzpon, zahtevnost terena in časovne omejitve?'),
  (2, 'Kako se razlikujeta 50-kilometrski trasi K24 in Julian Alps Trail Run? Kaj same številke zamolčijo?'),
  (3, 'Katere prihajajoče tekme imajo razdaljo med 20 in 35 kilometri ter manj kot 1500 metri vzpona?'),
  (4, 'Kako naj iz višinskega profila GPX ugotovim, kje bom izgubljal največ časa in energije?'),
  (5, 'Kaj o tehničnih odsekih Julian Alps Trail Run v mokrem vemo iz zbranih izkušenj in kaj ostaja nepreverjeno?'),
  (6, 'Kdaj se na strmem vzponu bolj splača hitro hoditi kot teči in kako naj to preizkusim na treningu?'),
  (7, 'Kako naj razporedim moči na trasi, ki ima večino vzpona v prvi polovici, najtežji spust pa tik pred ciljem?'),
  (8, 'Kako naj načrtujem količino vode med okrepčevalnicami, če poznam razdaljo, vzpon in pričakovano temperaturo?'),
  (9, 'Kaj se spremeni pri izbiri opreme, če grem na isto trail traso poleti podnevi ali jeseni ponoči?'),
  (10, 'Katere slovenske tekme imajo letos objavljene nove trase in kako se razlikujejo od prejšnjih izvedb?');
