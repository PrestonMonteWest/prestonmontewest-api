create or replace function create_post(
  p_title text,
  p_summary text,
  p_content text,
  p_image_url text,
  p_category text,
  p_created_by text
)
returns setof post
language plpgsql
as $$
declare
  post_id uuid;
begin
  insert into
    post
  (
    title,
    summary,
    content,
    image_url,
    category,
    created_by
  ) values (
    p_title,
    p_summary,
    p_content,
    p_image_url,
    p_category::post_category,
    p_created_by
  ) returning id into post_id;

  return query select * from post where id = post_id;
end;
$$;
