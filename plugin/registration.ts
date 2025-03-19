import Elysia from "elysia";
import { regPost } from "../functions/regFunc";

const regPlugin = new Elysia()
    .post("/register", regPost)

export default regPlugin