import { pgTable, uuid, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    company: text("company").notNull()
});

export const products = pgTable("products", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    company: text("company").notNull(),
    categoryId: uuid("category_id").references(() => categories.id),
    priceBought: numeric("price_bought").notNull(),
    priceSold: numeric("price_sold").notNull(),
    stock: integer("stock").notNull(),
    minStock: integer("min_stock").notNull(),
    status: text("status").notNull(),
    supplierId: uuid("supplier_id").notNull(),
    unit: text("unit"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
});

export const sales = pgTable("sales", {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").references(() => products.id),
    quantity: integer("quantity").notNull(),
    priceSold: numeric("price_sold").notNull(),
    discount: numeric("discount").default("0"),
    saleType: text("sale_type").notNull(), // "cash" or "debt"
    customerId: uuid("customer_id"),
    createdAt: timestamp("created_at").defaultNow()
});

export const debts = pgTable("debts", {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id").notNull(),
    totalAmount: numeric("total_amount").notNull(),
    remainingAmount: numeric("remaining_amount").notNull(),
    lastPaymentDate: timestamp("last_payment_date"),
    createdAt: timestamp("created_at").defaultNow()
});

export const debtPayments = pgTable("debt_payments", {
    id: uuid("id").defaultRandom().primaryKey(),
    debtId: uuid("debt_id").references(() => debts.id),
    amountPaid: numeric("amount_paid").notNull(),
    paymentDate: timestamp("payment_date").defaultNow()
});

export const customers = pgTable("customers", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    contact: text("contact").notNull()
});

export const returns = pgTable("returns", {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").references(() => products.id),
    quantity: integer("quantity").notNull(),
    reason: text("reason").notNull(),
    returnDate: timestamp("return_date").defaultNow()
});

export const expenses = pgTable("expenses", {
    id: uuid("id").defaultRandom().primaryKey(),
    description: text("description").notNull(),
    amount: numeric("amount").notNull(),
    date: timestamp("date").defaultNow()
});

export const askedProducts = pgTable("asked_products", {
    id: uuid("id").defaultRandom().primaryKey(),
    productName: text("product_name").notNull(),
    requestedBy: text("requested_by"),
    date: timestamp("date").defaultNow()
});

export const analytics = pgTable("analytics", {
    id: uuid("id").defaultRandom().primaryKey(),
    mostSoldProduct: uuid("most_sold_product").references(() => products.id),
    highestProfitProduct: uuid("highest_profit_product").references(() => products.id),
    lowestStockProduct: uuid("lowest_stock_product").references(() => products.id),
    mostBuyingCustomer: uuid("most_buying_customer").references(() => customers.id),
    totalGrossProfit: numeric("total_gross_profit").notNull()
});
