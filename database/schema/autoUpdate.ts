import { mainDb } from "./connections/mainDb";

async function setupTriggers() {
    // Auto-reduce stock on sale
    await mainDb.execute(`
        CREATE OR REPLACE FUNCTION update_stock_on_sale()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE products
            SET stock = stock - NEW.quantity
            WHERE id = NEW.product_id;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER after_sale_insert
        AFTER INSERT ON sales
        FOR EACH ROW EXECUTE FUNCTION update_stock_on_sale();
    `);

    // Auto-increase stock on return
    await mainDb.execute(`
        CREATE OR REPLACE FUNCTION update_stock_on_return()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE products
            SET stock = stock + NEW.quantity
            WHERE id = NEW.product_id;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER after_return_insert
        AFTER INSERT ON returns
        FOR EACH ROW EXECUTE FUNCTION update_stock_on_return();
    `);
}
