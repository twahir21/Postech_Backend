import Elysia from "elysia";
import { categPost } from "../functions/categFunc";

const categoriesPlugin = new Elysia()
    .post("/categories", categPost)



export default categoriesPlugin;