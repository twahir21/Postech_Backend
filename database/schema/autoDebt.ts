import { mainDb } from "./connections/mainDb";

async function setupDebtTriggers() {
    await mainDb.execute(`
        CREATE OR REPLACE FUNCTION update_debt_on_payment()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE debts
            SET remainingAmount = remainingAmount - NEW.amountPaid
            WHERE id = NEW.debtId;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER after_debt_payment_insert
        AFTER INSERT ON debt_payments
        FOR EACH ROW EXECUTE FUNCTION update_debt_on_payment();
    `);
}
