import Elysia from "elysia";
import { prodPost } from "../functions/prodFunc";

const prodPlugin = new Elysia ()
    .post("/products/:shopId", prodPost)


export default prodPlugin