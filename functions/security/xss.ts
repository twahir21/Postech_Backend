import xss from "xss";

export const sanitizeNumber = (input?: number | string) => {
    const num = Number(input);
    return isNaN(num) ? 0 : num;
};

export const sanitizeString = (input?: string) => input ? xss(input) : "";
