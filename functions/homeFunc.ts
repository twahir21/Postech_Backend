import type { headTypes } from "../types/types";
import { getTranslation } from "./translation";

export const homeGet = ({ headers }: {headers: headTypes}) => {

    const lang = headers["accept-language"]?.split(",")[0] || "en";


    try{
        return {
            success: true,
            message: getTranslation(lang, "greeting")
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
                error: "Unknown error occurred!"
            }
        }
    }
}