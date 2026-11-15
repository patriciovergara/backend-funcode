-- Operación puntual para el catálogo original de Funcode.
-- Requiere la migración 009; se detiene si los datos esperados cambiaron.
BEGIN;

DO $actualizar$
DECLARE
    servicio RECORD;
    filas INTEGER;
    notas TEXT := E'Si se trata de una tienda completamente personalizada desde cero, este precio no debería comprometerte a incluir cualquier funcionalidad: primero se evalúa y cotiza el alcance.\nCondiciones que deben acompañar los precios\nAntes de publicarlos, dejaría definido:\nImpuestos: indicar expresamente si están incluidos o se agregan. Todavía no hemos definido tu situación tributaria, así que no corresponde anunciar “IVA incluido” sin confirmarlo.\n';
BEGIN
    FOR servicio IN
        SELECT * FROM (VALUES
            ('Landing Page Profesional', 64995, 129990),
            ('Landing Page Autoadministrable', 99995, 199990),
            ('Sitio Web Corporativo', 149995, 299990),
            ('Tienda Online con Carrito y Panel de Administración', 174995, 349990)
        ) AS precios(titulo, actual, anterior)
    LOOP
        UPDATE posts
        SET original_price = servicio.anterior
        WHERE title = servicio.titulo
          AND price_type = 'from'
          AND price = servicio.actual
          AND original_price IS NULL;

        GET DIAGNOSTICS filas = ROW_COUNT;
        IF filas <> 1 THEN
            RAISE EXCEPTION 'No se encontró exactamente un servicio con el precio esperado: %', servicio.titulo;
        END IF;
    END LOOP;

    UPDATE posts
    SET description = replace(
        replace(
            replace(description, 'Paquete base propuesto:', 'Incluye como base:'),
            notas, ''
        ),
        'Hosting y dominio: presupuestados por separado, salvo que decidas incluirlos.',
        'Hosting y dominio: presupuestados por separado, salvo que se acuerde incluirlos.'
    )
    WHERE title = 'Tienda Online con Carrito y Panel de Administración'
      AND position(notas IN description) > 0
      AND position('Paquete base propuesto:' IN description) > 0
      AND position('Hosting y dominio: presupuestados por separado, salvo que decidas incluirlos.' IN description) > 0;

    GET DIAGNOSTICS filas = ROW_COUNT;
    IF filas <> 1 THEN
        RAISE EXCEPTION 'La descripción de la tienda cambió o no es única; revisar antes de modificarla.';
    END IF;
END
$actualizar$;

COMMIT;
