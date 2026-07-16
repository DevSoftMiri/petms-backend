ALTER TABLE "users"
ADD COLUMN "allowedPages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "users"
SET "allowedPages" = CASE "role"
    WHEN 'SUPERADMIN' THEN ARRAY['dashboard','vet','customers','pets','appointments','laboratory','pharmacy','grooming','store','supplies','finance','settings']::TEXT[]
    WHEN 'ADMIN' THEN ARRAY['dashboard','vet','customers','pets','appointments','laboratory','pharmacy','grooming','store','supplies','finance','settings']::TEXT[]
    WHEN 'VET' THEN ARRAY['dashboard','vet','customers','pets','appointments','laboratory','pharmacy','settings']::TEXT[]
    WHEN 'GROOMER' THEN ARRAY['dashboard','customers','pets','appointments','grooming','settings']::TEXT[]
    WHEN 'RECEPTIONIST' THEN ARRAY['dashboard','customers','pets','appointments','settings']::TEXT[]
    WHEN 'PHARMACIST' THEN ARRAY['dashboard','customers','pets','pharmacy','store','supplies','settings']::TEXT[]
    WHEN 'STAFF' THEN ARRAY['dashboard','customers','pets','appointments','store','supplies','settings']::TEXT[]
    ELSE ARRAY['dashboard']::TEXT[]
END;
