import Elysia from "elysia";
import { qrCodeGet } from "../functions/qrCodeFunc";

const qrCodePlugin = new Elysia()
    .get("/generate-qrcode", qrCodeGet)


export default qrCodePlugin 