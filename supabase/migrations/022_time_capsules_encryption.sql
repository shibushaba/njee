-- Client-side sealed payloads: sensitive fields live as AES-GCM ciphertext in `content`.
-- `encryption_version` 0 = legacy plaintext rows; 1 = sealed (title/media cleared at rest).

alter table public.time_capsules
  add column if not exists encryption_version smallint not null default 0;

comment on column public.time_capsules.encryption_version is
  '0 = legacy plaintext in content/title/media_url; 1 = AES-GCM JSON payload in content only (app decrypts after unlock).';

alter table public.time_capsules drop constraint if exists time_capsules_payload_ck;

alter table public.time_capsules add constraint time_capsules_payload_ck check (
  (encryption_version >= 1 and char_length(trim(content)) > 0)
  or (
    encryption_version = 0
    and (char_length(trim(content)) > 0 or media_url is not null)
  )
);

comment on column public.time_capsules.content is
  'Legacy: message body. Sealed (v1): nje.v1: base64(iv+ciphertext) — title, media, and body inside.';
