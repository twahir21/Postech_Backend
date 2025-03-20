import Elysia from "elysia";
import { prodPost } from "../functions/prodFunc";

const prodPlugin = new Elysia ()
    .post("/products", prodPost)


export default prodPlugin