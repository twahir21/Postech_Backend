export const homeGet = () => {
    try{
        return {
            success: true,
            message: "Hello, from Elysia and Bun server!"
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