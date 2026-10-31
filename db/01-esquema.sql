CREATE TABLE tareas (
  id     bigserial PRIMARY KEY,
  titulo text NOT NULL,
  hecha  boolean NOT NULL DEFAULT false
);

INSERT INTO tareas (titulo, hecha) VALUES
  ('Medir la imagen de la ronda 0', true),
  ('Escribir el .dockerignore', false),
  ('Partir el Dockerfile en etapas', false),
  ('Dejar de correr como root', false),
  ('Sacar el secreto de la imagen', false);
