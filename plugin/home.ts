import Elysia from "elysia";
import { homeGet } from "../functions/homeFunc";

const homePlugin = new Elysia ()
    .get("/", homeGet)

export default homePlugin