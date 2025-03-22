import Elysia from "elysia";
import { categDel, categGet, categGetOne, categPost, categPut } from "../functions/categFunc";

const categoriesPlugin = new Elysia()
    .post("/categories", categPost)
    .get("/categories", categGet)
    .put("/categories/:id", categPut)
    .delete("/categories/:id", categDel)
    .get("/categories/:id", categGetOne)

export default categoriesPlugin;