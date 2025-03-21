import type { headTypes } from "../types/types";
import { getTranslation } from "./translation";

export const homeGet = async({ headers }: {headers: headTypes}) => {

    const lang = headers["accept-language"]?.split(",")[0] || "sw";


    try{
        return {
            success: true,
            message: await getTranslation(lang, "greeting")
        }
    }catch(error) {
        if (error instanceof Error){
            return {
                error: error.message,
                success: false
            }
        }else{
            return {
                success: false,
                error: await getTranslation(lang, "serverErr")
            }
        }
    }
}