import {
    pgTable,
    uuid,
    text,
    numeric,
    integer,
    timestamp,
    uniqueIndex
  } from "drizzle-orm/pg-core";
  
  // -----------------
  // Categories Table
  // -----------------
  export const categories = pgTable(
    "categories",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      name: text("name").notNull(),
      company: text("company").notNull(),
    },
    (table) => ({
      uniqueCategory: uniqueIndex("unique_category").on(table.name, table.company),
    })
  );
  
  // -----------------
  // Suppliers Table
  // -----------------
  export const suppliers = pgTable("suppliers", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    contact: text("contact").notNull(),
    mostSoldProduct: uuid("most_sold_product"), // FK to products.id (optional)
    highestProfitProduct: uuid("highest_profit_product"), // FK to products.id (optional)
  });
  
  // ------------------------------
  // Supplier Price History Table
  // ------------------------------
  export const supplierPriceHistory = pgTable("supplier_price_history", {
    id: uuid("id").defaultRandom().primaryKey(),
    supplierId: uuid("supplier_id").notNull(), // FK to suppliers.id
    productId: uuid("product_id").notNull(),   // FK to products.id
    price: numeric("price").notNull(),
    dateAdded: timestamp("date_added").defaultNow(),
  });
  
  // -----------------
  // Products Table
  // -----------------
  export const products = pgTable("products", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    company: text("company").notNull(),
    categoryId: uuid("category_id").references(() => categories.id),
    priceBought: numeric("price_bought").notNull(),
    priceSold: numeric("price_sold").notNull(),
    stock: integer("stock").notNull(),
    minStock: integer("min_stock").notNull(),
    status: text("status").notNull(), // e.g., "available" or "out of stock"
    supplierId: uuid("supplier_id").notNull().references(() => suppliers.id),
    unit: text("unit"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });
  
  // -----------------
  // Sales Table
  // -----------------
  export const sales = pgTable("sales", {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").references(() => products.id),
    quantity: integer("quantity").notNull(),
    priceSold: numeric("price_sold").notNull(),
    // total_price and net_price can be computed on the fly in queries
    discount: numeric("discount").notNull().default("0"),
    saleType: text("sale_type").notNull(), // "cash" or "debt"
    customerId: uuid("customer_id"), // Nullable for cash sales
    createdAt: timestamp("created_at").defaultNow(),
  });
  
  // -----------------
  // Debts Table
  // -----------------
  export const debts = pgTable("debts", {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id").notNull(), // FK to customers.id
    totalAmount: numeric("total_amount").notNull(),
    remainingAmount: numeric("remaining_amount").notNull(),
    lastPaymentDate: timestamp("last_payment_date"),
    createdAt: timestamp("created_at").defaultNow(),
  });
  
  // -------------------------
  // Debt Payments Table
  // -------------------------
  export const debtPayments = pgTable("debt_payments", {
    id: uuid("id").defaultRandom().primaryKey(),
    debtId: uuid("debt_id").references(() => debts.id),
    amountPaid: numeric("amount_paid").notNull(),
    paymentDate: timestamp("payment_date").defaultNow(),
  });
  
  // -----------------
  // Customers Table
  // -----------------
  export const customers = pgTable("customers", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    contact: text("contact").notNull(),
    // total_debt and longest_debt are calculated via queries (aggregated), so they are not stored here
  });
  
  // -----------------
  // Returns Table
  // -----------------
  export const returns = pgTable("returns", {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").references(() => products.id),
    quantity: integer("quantity").notNull(),
    reason: text("reason").notNull(),
    returnDate: timestamp("return_date").defaultNow(),
  });
  
  // -----------------
  // Expenses Table
  // -----------------
  export const expenses = pgTable("expenses", {
    id: uuid("id").defaultRandom().primaryKey(),
    description: text("description").notNull(),
    amount: numeric("amount").notNull(),
    date: timestamp("date").defaultNow(),
  });
  
  // -----------------------
  // Asked Products Table
  // -----------------------
  export const askedProducts = pgTable("asked_products", {
    id: uuid("id").defaultRandom().primaryKey(),
    productName: text("product_name").notNull(),
    requestedBy: text("requested_by"),
    date: timestamp("date").defaultNow(),
  });
  
  // ---------------------------
  // Analytics Tracking Table
  // ---------------------------
  export const analytics = pgTable("analytics", {
    id: uuid("id").defaultRandom().primaryKey(),
    mostSoldProduct: uuid("most_sold_product").references(() => products.id),
    highestProfitProduct: uuid("highest_profit_product").references(() => products.id),
    lowestStockProduct: uuid("lowest_stock_product").references(() => products.id),
    mostBuyingCustomer: uuid("most_buying_customer").references(() => customers.id),
    totalGrossProfit: numeric("total_gross_profit").notNull(),
  });
  