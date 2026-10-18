ALTER TABLE "User" ADD COLUMN "emergencyIssue" BOOLEAN NOT NULL DEFAULT false;
CREATE FUNCTION inventory_loan_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP = 'DELETE' OR OLD.snapshot IS DISTINCT FROM NEW.snapshot OR OLD.number IS DISTINCT FROM NEW.number OR OLD."requestId" IS DISTINCT FROM NEW."requestId" OR OLD."borrowerId" IS DISTINCT FROM NEW."borrowerId" THEN RAISE EXCEPTION 'Immutable loan identity and checkout snapshot'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER loan_identity_immutable BEFORE UPDATE OR DELETE ON "Loan" FOR EACH ROW EXECUTE FUNCTION inventory_loan_guard();
