import Elysia from "elysia";
import homePlugin from "./plugin/home";
import qrCodePlugin from "./plugin/qrcode";
import regPlugin from "./plugin/registration";

new Elysia()
    .use(homePlugin)
    .use(qrCodePlugin)
    .use(regPlugin)

.listen(3000);

console.log("Server is running in the link http://localhost:3000")