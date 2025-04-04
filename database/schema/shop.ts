import {
    pgTable,
    uuid,
    text,
    numeric,
    integer,
    timestamp,
    uniqueIndex, 
    index,
    boolean
  } from "drizzle-orm/pg-core";


  // -----------------
  // Users Table
  // -----------------
  export const users = pgTable("users", {
      id: uuid("id").defaultRandom().primaryKey(),
      username: text("username").notNull().unique(),
      email: text("email").unique().notNull(),
      password: text("password").notNull(),
      role: text("role").notNull().default("owner"), // Default role is "owner"
      createdAt: timestamp("created_at").defaultNow(),
  }, (table) => ({
      emailIndex: index("idx_email").on(table.email),
  }));

  // -----------------
  // Shops Table
  // -----------------
  export const shops = pgTable("shops", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").unique().notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  });


  // -----------------
  // Shop Users Table (Many-to-Many) multi-users 
  // -----------------
    export const shopUsers = pgTable("shop_users", {
      shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),      
      role: text("role").notNull().default("assistant"), // Role inside the shop
  }, (table) => ({
      uniqueUserRole: uniqueIndex("unique_user_role").on(table.shopId, table.userId), // Unique per shop
  }));



  
  // -----------------
  // Categories Table
  // -----------------
    export const categories = pgTable("categories", {
      id: uuid("id").defaultRandom().primaryKey(),
      generalName: text("name").notNull(),
      shopId: uuid("shop_id").notNull().references(() => shops.id),
  }, (table) => ({
    uniqueCategory: uniqueIndex("unique_category").on(table.generalName, table.shopId), 
  }));

  // -----------------
  // Suppliers Table (Updated)
  // -----------------
  export const suppliers = pgTable("suppliers", {
    id: uuid("id").defaultRandom().primaryKey(),
    company: text("company").notNull(),
    contact: text("contact").notNull(),
    shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
    mostSoldProduct: uuid("most_sold_product"), // FK to products.id (optional)
    highestProfitProduct: uuid("highest_profit_product"), // FK to products.id (optional)
  });

  // -----------------
  // Products Table (Updated)
  // -----------------
  export const products = pgTable("products", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    priceSold: numeric("price_sold").notNull(),
    stock: integer("stock").notNull(),
    shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
    supplierId: uuid("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
    minStock: integer("min_stock").notNull(),
    status: text("status").notNull().default("available"),
    unit: text("unit"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    isQRCode: boolean("is_qr_code").default(false), // Tracks if QR code is generated
  });

  // -----------------
  // Purchases Table (New)
  // -----------------
  export const purchases = pgTable("purchases", {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    supplierId: uuid("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
    shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(), // Amount added to stock
    priceBought: numeric("price_bought").notNull(), // Cost price per unit
    totalCost: numeric("total_cost").notNull(), // quantity * priceBought
    purchaseDate: timestamp("purchase_date").defaultNow(),
  });

  
  // ------------------------------
  // Supplier Price History Table
  // ------------------------------
  export const supplierPriceHistory = pgTable("supplier_price_history", {
    id: uuid("id").defaultRandom().primaryKey(),
    supplierId: uuid("supplier_id").notNull().references(() => suppliers.id),
    productId: uuid("product_id").notNull().references(() => products.id, {onDelete: "cascade"}),
    shopId: uuid("shop_id").notNull().references(() => shops.id),
    price: numeric("price").notNull(),
    dateAdded: timestamp("date_added").defaultNow(),
}, (table) => ({
    uniqueSupplierProduct: uniqueIndex("unique_supplier_product").on(table.supplierId, table.productId, table.shopId),
}));

  
  
  // -----------------
  // Sales Table
  // -----------------
  export const sales = pgTable("sales", {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").notNull().references(() => products.id, {onDelete: "set null"}),
    quantity: integer("quantity").notNull(),
    priceSold: numeric("price_sold").notNull(), // this is mandatory for calculating total price
    // total_price and net_price can be computed on the fly in queries
    totalSales: numeric("total_sales").notNull(),
    discount: numeric("discount").notNull().default("0"),
    shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
    saleType: text("sale_type").notNull().default("cash"),
    customerId: uuid("customer_id"), // Nullable for cash sales
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });
  
  // -----------------
  // Debts Table
  // -----------------
  export const debts = pgTable("debts", {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id").notNull(), // FK to customers.id
    totalAmount: numeric("total_amount").notNull(),
    remainingAmount: numeric("remaining_amount").notNull(),
    shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
    lastPaymentDate: timestamp("last_payment_date"),
    createdAt: timestamp("created_at").defaultNow(),
  });
  
  // -------------------------
  // Debt Payments Table
  // -------------------------
  export const debtPayments = pgTable("debt_payments", {
    id: uuid("id").defaultRandom().primaryKey(),
    debtId: uuid("debt_id").references(() => debts.id,{onDelete: "cascade"}),
    shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
    amountPaid: numeric("amount_paid").notNull(),
    paymentDate: timestamp("payment_date").defaultNow(),
  });
  
  // -----------------
  // Customers Table
  // -----------------
  export const customers = pgTable("customers", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    shopId: uuid("shop_id").notNull().references(() => shops.id), // NEW: Links product to a shop
    contact: text("contact").notNull().unique(), // index via this
    // total_debt and longest_debt are calculated via queries (aggregated), so they are not stored here
  });
  
  // -----------------
  // Returns Table
  // -----------------
  export const returns = pgTable("returns", {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").notNull().references(() => products.id, {onDelete: "set null"}),
    quantity: integer("quantity").notNull(),
    shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
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
    shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
    date: timestamp("date").defaultNow(),
  });
  
  // -----------------------
  // Asked Products Table
  // -----------------------
  export const askedProducts = pgTable("asked_products", {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id").notNull().references(() => shops.id), // NEW: Links product to a shop
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
    shopId: uuid("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
    mostBuyingCustomer: uuid("most_buying_customer").references(() => customers.id),
    totalGrossProfit: numeric("total_gross_profit").notNull().default("0"),
  });
  