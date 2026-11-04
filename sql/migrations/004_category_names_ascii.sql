BEGIN;

UPDATE public.categories
SET name = CASE id
  WHEN 1 THEN 'Paginas web'
  WHEN 2 THEN 'Catalogos digitales'
  WHEN 3 THEN 'Sistemas de gestion'
END
WHERE id IN (1, 2, 3);

COMMIT;