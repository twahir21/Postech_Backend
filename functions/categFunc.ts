// implement crud

import { z } from "zod"

export const categPost = ({ body }) => {

    const schema = z.object({
        name: z.string().min(3, "Name cannot have less than 3 characters")
    })
}