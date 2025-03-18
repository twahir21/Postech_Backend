import Elysia from "elysia";
import homePlugin from "./plugin/home";

new Elysia()
    .use(homePlugin)

.listen(3000);

console.log("Server is running in the link http://localhost:3000")