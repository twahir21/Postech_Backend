import { eq } from "drizzle-orm";
import { mainDb } from "../database/schema/connections/mainDb";
import { paymentSaaS, users } from "../database/schema/shop";
import type { headTypes } from "../types/types";
import { getTranslation } from "./translation";
import { createPayloadChecksum, decrypt, encrypt, generateOrderRef } from "./utils/clickpesa";

// credentials
const clientID = process.env.CLICKPESA_CLIENT_ID!;
const apiKey = process.env.CLICKPESA_API_KEY!;                                               

export const genToken = async ({ userId, shopId, headers }: { userId: string, shopId: string, headers: headTypes }) => {

    const lang = headers["accept-language"]?.split(",")[0] || "sw";

    try{
        // send req for getting token
        const options = {method: 'POST', headers: {'client-id': clientID, 'api-key': apiKey}};
        const response = await fetch('https://api.clickpesa.com/third-parties/generate-token', options);
        interface clickpesaToken {
            success: string; token: string
        }
        const result: clickpesaToken = await response.json().catch((err) => {
            return {
                success: false,
                message: err instanceof Error ? err.message : "Seva ya malipo imefeli"
            }
        });

        if (!result.token || !result.success) {
            return {
                success: false,
                message: "API-key ya malipo imeisha muda au sio sahihi"
            }
        };

        // save token to the database
        // encrypt first to secure if db leaks
        const clickpesaBearer = result.token;
        const encryptedToken = encrypt(clickpesaBearer);

        await mainDb.insert(paymentSaaS).values({
            token: encryptedToken,
            shopId
        })

        return {
            success: true,
            message: "API-Key ipo sahihi, umepata tokeni ya malipo"
        }

    }catch(err){
        return {
            success: false,
            message: err instanceof Error   
                        ? err.message
                        : await getTranslation(lang, "serverErr")
        }
    }
}
export const checkUSSD = async ({ userId, shopId, headers }: { userId: string, shopId: string, headers: headTypes }) => {

    const lang = headers["accept-language"]?.split(",")[0] || "sw";

    try{
        // get token
        const encryptedToken = await mainDb.select({ token: paymentSaaS.token}).from(paymentSaaS)
                    .where(eq(paymentSaaS.shopId, shopId));
        
        const value = encryptedToken[0].token;

        const resultToken = decrypt(value);

        // check if USSD-PUSH service is available
        const orderReference = generateOrderRef();

        // save orderReference to database to avoid generating new order
        await mainDb.update(paymentSaaS).set({
            orderId: orderReference
        }).where(eq(paymentSaaS.shopId, shopId));


        const checksumKey = process.env.CLICKPESA_CHECKSUMKEY;
        if(!checksumKey) return;

        const payload = {
            amount: "10000",
            currency: "TZS",
            orderReference,
        }
        const checksum = await createPayloadChecksum(checksumKey, payload);

        const USSDpayload = {
            ...payload,
            checksum
        }
        const options2 = {
            method: 'POST',
            headers: {Authorization: `${resultToken}`, 'Content-Type': 'application/json'},
            body: JSON.stringify(USSDpayload)
          };
          
        const checkUSSD = await fetch('https://api.clickpesa.com/third-parties/payments/preview-ussd-push-request', options2);
        const checkUSSDResult = await checkUSSD.json().catch((err) => {
            return {
                success: false,
                message: err instanceof Error ? err.message : "Seva ya malipo imefeli"
            }
        });
        
        return {
            checkUSSDResult
        }

    }catch(err){
        return {
            success: false,
            message: err instanceof Error   
                        ? err.message
                        : await getTranslation(lang, "serverErr")
        }
    }
}

export const USSDPush = async ({ userId, shopId, headers }: { userId: string, shopId: string, headers: headTypes }) => {

    const lang = headers["accept-language"]?.split(",")[0] || "sw";

    try{
        // get token
        const encryptedToken = await mainDb.select({ token: paymentSaaS.token}).from(paymentSaaS)
                    .where(eq(paymentSaaS.shopId, shopId));
        
        const value = encryptedToken[0].token;

        const resultToken = decrypt(value);


        // processing USSD-PUSH service
        const orderData = await mainDb.select({
            orderId: paymentSaaS.orderId
        }).from(paymentSaaS).where(eq(paymentSaaS.shopId, shopId));

        const orderId = orderData[0].orderId;

        if (!orderId) {
            return {
                success: false,
                message: "orderId haipo kwenye database"
            }
        };

        const checksumKey = process.env.CLICKPESA_CHECKSUMKEY;
        if(!checksumKey) return;

        const payload = {
            amount: "10000",
            currency: "TZS",
            orderId,
        }
        const checksum = await createPayloadChecksum(checksumKey, payload);

        // select phoneNumber
        const phoneData = await mainDb.select({phoneNumber: users.phoneNumber})
                            .from(users).where(eq(users.id, userId));

        const phoneNumber = phoneData[0].phoneNumber;

        const USSDpayload = {
            ...payload,
            checksum,
            phoneNumber
        }
        

        const options = {
            method: 'POST',
            headers: {Authorization: `${resultToken}`, 'Content-Type': 'application/json'},
            body: JSON.stringify(USSDpayload)
            // body: '{"amount":"<string>","currency":"TZS","orderReference":"<string>","phoneNumber":"<string>","checksum":"<string>"}'
          };
          
          const processUSSD = await fetch('https://api.clickpesa.com/third-parties/payments/initiate-ussd-push-request', options)

          const ussdPush = await processUSSD.json().catch((err) => {
            return {
                success: false,
                message: err instanceof Error ? err.message : "Seva ya malipo imefeli"
            }
        });
        return {
            ussdPush
        }

    }catch(err){
        return {
            success: false,
            message: err instanceof Error   
                        ? err.message
                        : await getTranslation(lang, "serverErr")
        }
    }
}

export const PayStatus = async ({ userId, shopId, headers }: { userId: string, shopId: string, headers: headTypes }) => {

    const lang = headers["accept-language"]?.split(",")[0] || "sw";

    try{
        const encryptedToken = await mainDb.select({ token: paymentSaaS.token}).from(paymentSaaS)
                    .where(eq(paymentSaaS.shopId, shopId));
        
        const value = encryptedToken[0].token;

        const resultToken = decrypt(value);

        const orderData = await mainDb.select({
            orderId: paymentSaaS.orderId
        }).from(paymentSaaS).where(eq(paymentSaaS.shopId, shopId));

        const orderId = orderData[0].orderId;

        if (!orderId) return;

        const options = {method: 'GET', headers: {Authorization: `${resultToken}`}};

        const checkStatusData = await fetch(`https://api.clickpesa.com/third-parties/payments/{${orderId}}`, options)
        const checkStatus = await checkStatusData.json().catch((err) => {
            return {
                success: false,
                message: err instanceof Error ? err.message : "Seva ya malipo imefeli"
            }
        });
        return {
            checkStatus
        }

    }catch(err){
        return {
            success: false,
            message: err instanceof Error   
                        ? err.message
                        : await getTranslation(lang, "serverErr")
        }
    }
}
