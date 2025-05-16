import { eq } from "drizzle-orm";
import { mainDb } from "../database/schema/connections/mainDb";
import { shops, users } from "../database/schema/shop";
import type { headTypes, pswdType, shopTypes } from "../types/types";
import { getTranslation } from "./translation";
import { sanitizeString } from "./security/xss";
import { hashPassword, verifyPassword } from "./security/hash";

export const shopSettingsFunc = async ({ shopId, userId, headers }: {userId: string, shopId: string, headers: headTypes}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";

    try {
        // get the concept of shop needed data
        const fetchShop = await mainDb.select({ shopName: shops.name }).from(shops).where(eq(shops.id, shopId));
        const fetchEmail = await mainDb.select({ email: users.email }).from(users).where(eq(users.id, userId));


        if (fetchShop.length === 0 || fetchEmail.length === 0) {
        return {
            success: false,
            message: "Hakuna kilichopatikana"
        }
        }

        return {
        success: true,
        data: [{ shopName: fetchShop[0], email: fetchEmail[0]}],
        message: await getTranslation(lang, "success")
        }



    } catch (error) {
        return {
            success: false,
            message: error instanceof Error
                    ? error.message
                    : await getTranslation(lang, "serverErr")
        }
    }
}

export const shopSettingsPut = async ({ shopId, userId, headers, body }: {userId: string, shopId: string, headers: headTypes, body: shopTypes}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";

        try {
    
          let { email, shopName } = body as shopTypes;
    
          email = sanitizeString(email);
          shopName = sanitizeString(shopName);
    
    
          // give the logic of saving to database
          await mainDb.update(users).set({
            email
          }).where(eq(users.id, userId)).returning();
    
          await mainDb.update(shops).set({
            name: shopName
          }).where(eq(shops.id, shopId)).returning();
    
    
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error
                        ? error.message
                        : await getTranslation(lang, "serverErr")
            }
        }
}

export const updatePassword = async ({ shopId, userId, headers, body }: {userId: string, shopId: string, headers: headTypes, body: pswdType}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";

    try {

    let { currentPassword, newPassword } = body as pswdType;

    // sanitize
    currentPassword = sanitizeString(currentPassword);
    newPassword = sanitizeString(newPassword);

    const res = await mainDb.select({ pswd: users.password }).from(users).where(eq(users.id, userId));

    const fetchedPswd = res[0].pswd;

    const isVerified = await verifyPassword(fetchedPswd, currentPassword);

    if(!isVerified) {
    return {
        success: false,
        message: "Nenosiri la zamani sio sahihi, jaribu tena"
    }
    }

    // hash new password and save
    const hashedNewPassword = await hashPassword(newPassword);

    await mainDb.update(users)
    .set({
    password: hashedNewPassword
    })
    .where(eq(users.id, userId))
    .returning();


    return {
    success: true,
    message: "Umefanikiwa kubadili nenosiri, tafadhali itunze"
    }


    } catch (error) {
        return {
            success: false,
            message: error instanceof Error
                    ? error.message
                    : await getTranslation(lang, "serverErr")
        }
    }
}

export const deleteShop = async ({ shopId, userId, headers }: {userId: string, shopId: string, headers: headTypes}) => {
    const lang = headers["accept-language"]?.split(",")[0] || "sw";

    try {
    
        // ensure user is Admin 
        const isAdminCheck = await mainDb.select({role: users.role}).from(users).where(eq(users.id, userId));
  
        const isAdmin = isAdminCheck[0].role;
  
  
        if(isAdmin !== 'owner'){
          return {
            success: false,
            message: "Hauna mamlaka ya kufuta duka"
          }
        }
  
        // //  get the concept of deleting shop
        // await mainDb.delete(products).where(eq(products.shopId, shopId));
        // await mainDb.delete(sales).where(eq(sales.shopId, shopId));
        // await mainDb.delete(debts).where(eq(debts.shopId, shopId));
        // await mainDb.delete(debtPayments).where(eq(debtPayments.shopId, shopId));
        // await mainDb.delete(purchases).where(eq(purchases.shopId, shopId));
        // await mainDb.delete(expenses).where(eq(expenses.shopId, shopId));
        // await mainDb.delete(returns).where(eq(returns.shopId, shopId));
        // await mainDb.delete(askedProducts).where(eq(askedProducts.shopId, shopId));
        // await mainDb.delete(supplierPriceHistory).where(eq(supplierPriceHistory.shopId, shopId));
        // await mainDb.delete(suppliers).where(eq(suppliers.shopId, shopId));
        // await mainDb.delete(customers).where(eq(customers.shopId, shopId));
        // await mainDb.delete(categories).where(eq(categories.shopId, shopId));
        // await mainDb.delete(shopUsers).where(eq(shopUsers.shopId, shopId));
        // await mainDb.delete(shops).where(eq(shops.id, shopId));
        
        // // Delete orphaned users
        // await mainDb.execute(sql`
        //   DELETE FROM users 
        //   WHERE id IN (
        //     SELECT users.id FROM users
        //     LEFT JOIN shop_users ON users.id = shop_users.user_id
        //     WHERE shop_users.id IS NULL
        //   );
        // `);
        
  
        // delete the coookie
        // await deleteAuthTokenCookie(cookie);
        // const test = cookie.auth_token
        // const value = new Cookie("twahir").value;
        // console.log("Cookie: ", test)
        return {
          success: true,
        //   cookie
        }
  
        
      } catch (error) {
          return {
              success: false,
              message: error instanceof Error
                      ? error.message
                      : await getTranslation(lang, "serverErr")
          }
      }
}