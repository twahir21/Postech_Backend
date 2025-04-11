import { custom, z } from "zod"
import type { headTypes, ProductQuery, productTypes, QrData } from "../types/types";
import { getTranslation } from "./translation";
import { sanitizeNumber, sanitizeString } from "./security/xss";
import { mainDb } from "../database/schema/connections/mainDb";
import { debts, expenses, products, purchases, sales, supplierPriceHistory } from "../database/schema/shop";
import { and, eq, ilike, sql } from "drizzle-orm";

const startTime = Date.now();
// implementing crud for products 
export const prodPost = async ({ body, headers, shopId, userId, supplierId, categoryId }: {body: productTypes, headers: headTypes, shopId: string, userId: string, categoryId: string, supplierId: string}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";

    try{
    // Fetch translations once instead of waiting inside the schema validation
    const prodNameErr = await getTranslation(lang, "ProdNameErr");
    const priceErr = await getTranslation(lang, "priceErr");
    const stockErr = await getTranslation(lang, "stockErr");
    const unitErr = await getTranslation(lang, "unitErr");

    // Validate product data
    const schema = z.object({
        name: z.string().min(3, prodNameErr),
        priceBought: z.number().min(1, priceErr),
        priceSold: z.number().min(1, priceErr),
        stock: z.number().min(0, stockErr),
        minStock: z.number().min(0, stockErr),
        unit: z.string().min(1, unitErr)
    });
    
        const parsed = schema.safeParse(body);
    
        if (!parsed.success) {
            return {
                success: false,
                message: parsed.error.format()
            }
        }



        let  {name, priceBought, priceSold, stock, minStock, unit} : productTypes = parsed.data;


        // sanitize or remove xss scripts if available
        name = sanitizeString(name);
        priceBought = sanitizeNumber(priceBought);
        priceSold = sanitizeNumber(priceSold);
        stock = sanitizeNumber(stock);
        minStock = sanitizeNumber(minStock);
        unit = sanitizeString(unit);

        const endTime = Date.now();
        const overallTime = `Time taken: ${endTime - startTime}ms`;

        // priceBought

        // now save to database to products
        const [insertedProduct] = await mainDb.insert(products).values({
            name,
            categoryId,
            priceSold: parseFloat(priceSold.toString()),
            stock,
            supplierId,
            shopId,
            minStock,
            unit,
          }).returning({ id: products.id });
          
          if (!insertedProduct) {
            throw new Error("Hakuna bidhaa kwa jina hili");
          }
          
          const productId = insertedProduct.id;



          if (!insertedProduct || !insertedProduct.id) {
            throw new Error("Hakuna bidhaa kwa jina hili");
          }


        // now save to purchases
        await mainDb.insert(purchases).values({
            supplierId,
            productId: productId,
            shopId,
            quantity: stock,
            priceBought,
            totalCost: priceBought * stock,
        });

        // insert supplier price history
        await mainDb.insert(supplierPriceHistory).values({
            supplierId,
            productId: productId,
            shopId,
            price: priceBought
        })

        return {
            success: true,
            data: {name, priceBought, priceSold, stock, minStock, shopId, userId, categoryId, supplierId, unit, overallTime},
            message: await getTranslation(lang, "productSuccess")
        }   
        
    }catch(error){
        if (error instanceof Error) {
            return {
                messsage: error.message,
                success: false
            }
        }else{
            return {
                messsage: sanitizeString(await getTranslation(lang, "serverErr")),
                success: false
            }
        }
    }
}


export const prodGet = async ({
    userId,
    shopId,
    query,
    set,
    headers,
  }: {
    userId: string;
    shopId: string;
    query: ProductQuery;
    set: { status: number };
    headers: headTypes;
  }) => {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "10");
    const search = query.search || "";
    const offset = (page - 1) * limit;
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
  
    // Build product filter
    const where = and(
      eq(products.shopId, shopId),
      search ? ilike(products.name, `%${search}%`) : undefined
    );
  
    try {
      // Step 1: Create deduplicated subquery for latest purchase per product
      const latestPurchase = mainDb
        .select({
          productId: purchases.productId,
          priceBought: purchases.priceBought,
          rowNumber: sql<number>`ROW_NUMBER() OVER (PARTITION BY ${purchases.productId} ORDER BY ${purchases.createdAt} DESC)`,
        })
        .from(purchases)
        .where(eq(purchases.shopId, shopId))
        .as("latestPurchase");
  
      const latestOnly = mainDb
        .select({
          productId: latestPurchase.productId,
          priceBought: latestPurchase.priceBought,
        })
        .from(latestPurchase)
        .where(sql`row_number = 1`)
        .as("latestOnly");
  
      // Step 2: Count total products
      const total = await mainDb
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(where)
        .then((rows) => Number(rows[0].count));
  
      // Step 3: Fetch paginated product list + latest priceBought via LEFT JOIN
      const rows = await mainDb
        .select({
          id: products.id,
          name: products.name,
          categoryId: products.categoryId,
          priceSold: products.priceSold,
          stock: products.stock,
          shopId: products.shopId,
          supplierId: products.supplierId,
          minStock: products.minStock,
          status: products.status,
          unit: products.unit,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          isQRCode: products.isQRCode,
          priceBought: latestOnly.priceBought, // ✅ Deduplicated result
        })
        .from(products)
        .where(where)
        .leftJoin(latestOnly, eq(products.id, latestOnly.productId))
        .orderBy(products.createdAt)
        .limit(limit)
        .offset(offset);
  
      // Step 4: Return result
      if (rows.length === 0) {
        set.status = 204;
        return { success: false, data: [], total };
      }
  
      set.status = 200;
      return {
        success: true,
        data: rows.map((row) => ({
          ...row,
          priceSold: Number(row.priceSold),
          priceBought: row.priceBought !== null ? Number(row.priceBought) : null,
        })),
        total,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          message: error.message,
          success: false,
        };
      } else {
        return {
          message: sanitizeString(await getTranslation(lang, "serverErr")),
          success: false,
        };
      }
    }
  };
  


export const prodDel = async ({userId, shopId, productId, headers}: {userId: string, shopId: string, productId: string, headers: headTypes}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try{
        // check if product exists
        const product = await mainDb
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .then((rows) => rows[0]);
    
        if (!product) {
            return {
                success: false,
                message: "Hakuna bidhaa kwa jina hili"
            }
        }
    
        // delete product
        await mainDb.delete(products).where(eq(products.id, productId));
    
        return {
            success: true,
            message: "Bidhaa imeondolewa kwa mafanikio"
        }
    }catch(error){
        if (error instanceof Error) {
            return {
                messsage: error.message,
                success: false
            }
        }else{
            return {
                messsage: sanitizeString(await getTranslation(lang, "serverErr")),
                success: false
            }
        }
    }
}


export const prodUpdate = async ({userId, shopId, productId, body, headers}: {userId: string, shopId: string, productId: string, body: productTypes, headers: headTypes}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try{
    // Fetch translations once instead of waiting inside the schema validation
    const prodNameErr = await getTranslation(lang, "ProdNameErr");
    const priceErr = await getTranslation(lang, "priceErr");
    const stockErr = await getTranslation(lang, "stockErr");
    const unitErr = await getTranslation(lang, "unitErr");

    // Validate product data
    const schema = z.object({
        name: z.string().min(3, prodNameErr),
        priceBought: z.number().min(1, priceErr),
        priceSold: z.number().min(1, priceErr),
        stock: z.number().min(0, stockErr),
        minStock: z.number().min(0, stockErr),
        unit: z.string().min(1, unitErr)
    });
    
        const parsed = schema.safeParse(body);
    
        if (!parsed.success) {
            return {
                success: false,
                message: parsed.error.format()
            }
        }



        let  {name, priceBought, priceSold, stock, minStock, unit} : productTypes = parsed.data;


        // sanitize or remove xss scripts if available
        name = sanitizeString(name);
        priceBought = sanitizeNumber(priceBought);
        priceSold = sanitizeNumber(priceSold);
        stock = sanitizeNumber(stock);
        minStock = sanitizeNumber(minStock);
        unit = sanitizeString(unit);



        // check if product exists
        const product = await mainDb
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .then((rows) => rows[0]);
    
        if (!product) {
            return {
                success: false,
                message: "Hakuna bidhaa kwa jina hili"
            }
        }
    
        // update product
        const sanitizedStock = Math.max(0, stock);


        await mainDb.update(products).set({
            name,
            stock: sanitizedStock, // prevent negative stock
            minStock,
            unit,
            status: sanitizedStock <= 0 ? 'finished' : 'available', // auto-update status
            priceSold,
            updatedAt: new Date(),
            isQRCode: false
            
        }).where(eq(products.id, productId));

        // purchases
        await mainDb.update(purchases).set({
            quantity: sanitizedStock,
            priceBought,
            totalCost: priceBought * sanitizedStock,

        }).where(eq(purchases.productId, productId));

        await mainDb.update(supplierPriceHistory).set({
            price: priceBought
        }).where(eq(supplierPriceHistory.productId, productId));

        // set isQrCode to false
        await mainDb.update(products).set({
            isQRCode: false
        }).where(eq(products.id, productId));

        const updatedProduct = await mainDb
        .select({
            id: products.id,
            name: products.name,
            stock: products.stock,
            minStock: products.minStock,
            unit: products.unit,
            status: products.status,
            priceSold: products.priceSold,
            isQRCode: products.isQRCode,
            updatedAt: products.updatedAt,
            priceBought: purchases.priceBought, // 👈 include from purchases
        })
        .from(products)
        .leftJoin(purchases, eq(products.id, purchases.productId))
        .where(eq(products.id, productId))
        .limit(1)
        .then(rows => rows[0]);
        
        if (!updatedProduct) {
            throw new Error("Hakuna bidhaa kwa jina hili");
          }
    
        return {
            success: true,
            data: updatedProduct,
            message: await getTranslation(lang, "success")
        }

    }catch(error){
        if (error instanceof Error) {
            return {
                messsage: error.message,
                success: false
            }
        }else{
            return {
                messsage: sanitizeString(await getTranslation(lang, "serverErr")),
                success: false
            }
        }
    }
}

export const QrPost = async({ body, headers, userId, shopId }: { body: QrData, headers: headTypes, userId: string, shopId: string }) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";
    try{
    // Validate product data
    const schema = z.object({
        calculatedTotal: z.number().min(0, "Jumla haiwezi kuwa chini ya 0"),
        quantity: z.number().min(0, "Kiasi hakiwezi kuwa chini ya 0"),
        saleType: z.string().min(3, "Haiwezi kuwa chini ya herufi 3"),
        discount: z.number().min(-1, "Punguzo haliwezi kuwa chini ya 0"),
        description: z.string().min(3, "Maelezo hayawezi kuwa chini ya herufi 3"),
        typeDetected: z.string().min(3, "Chaguo haliwezi kuwa na herufi chini ya 3"),
        productId: z.string().min(5, "Id haiwezi kuwa na herufi chini ya 5"),
        priceSold: z.number().min(3, "Bei haiwezi kuwa chini ya shilingi 3"),
        priceBought: z.number().min(3, "Bei haiwezi kuwa chini ya shilingi 3"),
        supplierId: z.string().min(3, "Id haiwezi kuwa na herufi chini ya 3"),
        customerId: z.string() // customerId can be empty
    });
        
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        return {
            success: false,
            message: parsed.error.format()
        }
    }


    let  { calculatedTotal, quantity, saleType, discount, description, typeDetected, productId, priceSold, priceBought, supplierId, customerId } : QrData = parsed.data;

    // sanitize or remove xss scripts if available
    saleType = sanitizeString(saleType);
    calculatedTotal = sanitizeNumber(calculatedTotal);
    quantity = sanitizeNumber(quantity);
    discount = sanitizeNumber(discount);
    typeDetected = sanitizeString(typeDetected);
    description = sanitizeString(description);
    productId = sanitizeString(productId);
    priceSold = sanitizeNumber(priceSold);
    priceBought = sanitizeNumber(priceBought);
    supplierId = sanitizeString(supplierId);
    customerId = sanitizeString(customerId);


    switch (typeDetected) {
        case 'expenses':
          await mainDb.insert(expenses).values({
            description,
            amount: calculatedTotal,
            shopId
          });
      
          return {
            success: true,
            message: "Matumizi yamehifadhiwa kikamilifu"
          };
      
        case 'sales':
          // 1. Check stock availability first
          const current = await mainDb
            .select({ stock: products.stock })
            .from(products)
            .where(eq(products.id, productId))
            .then(res => res[0]);
      
          if (!current || current.stock < quantity) {
            return {
              success: false,
              message: "Bidhaa haina stock ya kutosha",
            };
          }
      
          // 2. Deduct stock
          await mainDb.update(products)
            .set({ stock: sql`${products.stock} - ${quantity}` })
            .where(eq(products.id, productId));
      
          // 3. Insert based on saleType
          if (saleType === "cash") {
            await mainDb.insert(sales).values({
              productId,
              quantity,
              priceSold,
              totalSales: calculatedTotal,
              discount,
              shopId,
              saleType: "cash",
              customerId: null
            });
          } else {
            await mainDb.insert(debts).values({
              customerId,
              totalAmount: calculatedTotal,
              remainingAmount: calculatedTotal,
              shopId,
            });
          }
    
      
          return {
            success: true,
            message: "Mauzo yamehifadhiwa kiukamilifu"
          };
      
        case 'purchases':
          await mainDb.insert(purchases).values({
            productId,
            supplierId,
            shopId,
            quantity,
            priceBought,
            totalCost: calculatedTotal
          });
      
          return {
            success: true,
            message: "Manunuzi yamehifadhiwa kiukamilifu"
          };
      
        default:
          return {
            success: false,
            message: "Aina ya muamala haijatambuliwa"
          };
    } 
    
    return {
      success: true,
      message: "Nice Implementations"
    }

    }catch(error){

        if (error instanceof Error) {
            return {
                messsage: error.message,
                success: false
            }
        }else{
            return {
                messsage: sanitizeString(await getTranslation(lang, "serverErr")),
                success: false
            }
        }
    }
}