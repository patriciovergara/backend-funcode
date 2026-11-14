BEGIN;

UPDATE projects
SET
  image_url = 'https://litigiomunicipal.cl/assets/img/logo/logo.svg',
  updated_at = NOW()
WHERE project_url = 'https://litigiomunicipal.cl';

COMMIT;
