import Elysia from "elysia";
import { suppDel, suppGet, suppGetOne, suppPost, suppPut } from "../functions/suppFunc";

const suppPlugin = new Elysia()
    .get("/suppliers", suppGet)
    .post("/suppliers/:shopId", suppPost)
    .put("/suppliers/:id", suppPut)
    .delete("/suppliers/:id", suppDel)
    .get("/suppliers/:id", suppGetOne)

export default suppPlugin;