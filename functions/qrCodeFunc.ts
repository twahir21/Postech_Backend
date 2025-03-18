import QRCode from "qrcode";
export const qrCodeGet = async () => {
    // interfaces
    interface jsonDataTypes {
        name?: string;
        age?: number;
        marital?: string;
    }

    const jsonData: jsonDataTypes = {
        name: "Twahir",
        age: 22,
        marital: "Not married"
    }

    try {
        // convert json to string
        const jsonString =  JSON.stringify(jsonData);

        // generate qrcode as data url
        const QrcodeDataUrl = await QRCode.toDataURL(jsonString);


        return {
            success: true,
            json: jsonData,
            qrCode: QrcodeDataUrl
        }

    } catch (error) {
        if(error instanceof Error) {
            return {
                error: error.message,
                success: false
            }
        }else{
            return{
                error: "Server failed to process the request!",
                success: false
            }
        }
    }
}