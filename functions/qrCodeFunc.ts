import QRCode from "qrcode";
export const qrCodeGet = async () => {
    // interfaces
    interface jsonDataTypes {
        id?: string;
        name?: string;
        company?: string;
        price_sold?: number;
        price_bought?: number;
        created_at?: string;
        supplier?: object;
    }

    const jsonData: jsonDataTypes = {
        id: "PROD001",
        name: "Thermal Receipt Printer",
        company: "Postech Innovations",
        price_sold: 12000,
        price_bought: 10000,
        created_at: "2025-03-18T10:30:00Z",
        supplier: {
          name: "Tech Supplies Ltd",
          contact: "+254700123456"
        }
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
                message: error.message,
                success: false
            }
        }else{
            return{
                message: "Server failed to process the request!",
                success: false
            }
        }
    }
}