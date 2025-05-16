import Elysia from "elysia";
import { homeGet } from "../functions/homeFunc";
import { cacheStatsTracker } from "../functions/utils/Stats";

const homePlugin = new Elysia ()
    .get("/", homeGet)
    .get('/cache/stats', () => {
        return {
          cacheStats: cacheStatsTracker.getStats()
        };
    });

export default homePlugin