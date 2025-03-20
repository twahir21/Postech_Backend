import Elysia from "elysia";
import homePlugin from "./plugin/home";
import qrCodePlugin from "./plugin/qrcode";
import regPlugin from "./plugin/registration";
import usersRoute from "./functions/usersFunc";
import prodPlugin from "./plugin/products";

new Elysia()
    .use(homePlugin)
    .use(qrCodePlugin)
    .use(regPlugin)
    .use(usersRoute)
    .use(prodPlugin)

.listen(3000);

console.log("Server is running in the link http://localhost:3000")