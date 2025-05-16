import { t } from "elysia";

export const categData = t.Object({
    generalName: t.String({ 
        minLength: 3, 
        maxLength: 40, 
        error () {
            return {
                success: false,
                message: "Jina haliwezi kuwa chini ya herufi 3, na juu ya herufi 40"
            }
        }
        
    })
});

export const suppData = t.Object({
    company: t.String({
        maxLength: 40,
        minLength: 3,
        error() {
            return {
                success: false,
                message: "Jina haliwezi kuwa chini ya herufi 3, na juu ya herufi 40"
            }
        }
    }),
    contact: t.String({
        maxLength: 40,
        minLength: 3,
        error() {
            return {
                success: false,
                message: "Mawasiliano haliwezi kuwa chini ya herufi 3, na juu ya herufi 40"
            }
        }
    })
});

export const prodData = t.Object({
    name: t.String({
        maxLength: 40,
        minLength: 3,
        error() {
            return {
                success: false,
                message: "Jina haliwezi kuwa na herufi chini ya 3 na juu ya 40"
            }
        }
    }),
    unit: t.String({
        minLength: 1,
        maxLength: 20,
        error() {
            return {
                success: false,
                message: "Jina haliwezi kuwa na herufi chini ya 3 na juu ya 40"
            }
        }
    }),
    priceBought: t.Number({
        maximum: 2000000000,
        minimum: 1,
        error() {
            return {
                success: false,
                message: "Kiwango sio sahihi kama ni chini ya 1 au juu ya bilioni 2"
            }
        }
    }),
    priceSold: t.Number({
        maximum: 2000000000,
        minimum: 1,
        error() {
            return {
                success: false,
                message: "Kiwango sio sahihi kama ni chini ya 1 au juu ya bilioni 2"
            }
        }
    }),
    stock: t.Number({
        maximum: 2000000000,
        minimum: 1,
        error() {
            return {
                success: false,
                message: "Kiwango sio sahihi kama ni chini ya 1 au juu ya bilioni 2"
            }
        }
    }),
    minStock: t.Number({
        maximum: 2000000000,
        minimum: 1,
        error() {
            return {
                success: false,
                message: "Kiwango sio sahihi kama ni chini ya 1 au juu ya bilioni 2"
            }
        }
    })
})

export const QrPostData = t.Object({
    customerId: t.String(),
    supplierId: t.String(),
    productId: t.String(),
    typeDetected: t.String(),
    description: t.String(),
    saleType: t.String(),

    calculatedTotal: t.Number({
        maximum: 2000000000,
        minimum: 1,
        error() {
            return {
                success: false,
                message: "Kiwango sio sahihi kama ni chini ya 1 au juu ya bilioni 2"
            }
        }
    }),
    quantity: t.Number({
        maximum: 2000000000,
        minimum: 1,
        error() {
            return {
                success: false,
                message: "Kiwango sio sahihi kama ni chini ya 1 au juu ya bilioni 2"
            }
        }
    }),
    discount: t.Number({
        maximum: 2000000000,
        minimum: 1,
        error() {
            return {
                success: false,
                message: "Kiwango sio sahihi kama ni chini ya 1 au juu ya bilioni 2"
            }
        }
    }),
    priceBought: t.Number({
        maximum: 2000000000,
        minimum: 1,
        error() {
            return {
                success: false,
                message: "Kiwango sio sahihi kama ni chini ya 1 au juu ya bilioni 2"
            }
        }
    }),
    priceSold: t.Number({
        maximum: 2000000000,
        minimum: 1,
        error() {
            return {
                success: false,
                message: "Kiwango sio sahihi kama ni chini ya 1 au juu ya bilioni 2"
            }
        }
    })
});

export const customerData = t.Object({
    name: t.String({
        maxLength: 40,
        minLength: 3,
        error() {
            return {
                success: false,
                message: "Jina haliwezi kuwa chini ya herufi 3, na juu ya herufi 40"
            }
        }
    }),
    contact: t.String({
        maxLength: 40,
        minLength: 3,
        error() {
            return {
                success: false,
                message: "Mawasiliano haliwezi kuwa chini ya herufi 3, na juu ya herufi 40"
            }
        }
    })
});

export const salesQueryData = t.Object({
    search: t.Optional(t.String({
        maxLength: 40,
        error(){
            return {
                success: false,
                message: "Maneno mwisho ni 40 kwa ajili ya usalama"
            }
        }
    })),
    date: t.Optional(t.String()), 
    page: t.Optional(t.String({ pattern: '^[0-9]+$' })),
    limit: t.Optional(t.String({ pattern: '^[0-9]+$' })),
    from: t.Optional(t.String({ format: 'date' })),
    to: t.Optional(t.String({ format: 'date' })),
});

export const loginData = t.Object({
    username: t.String({
        maxLength: 40,
        minLength: 3,
        error() {
            return { 
                success: false,
                message: "Jina haliwezi kuwa chini ya herufi 3 na juu ya herufi 40" 
            }
        }
    }),
    password: t.String({
        minLength: 6,
        error() {
            return {
                success: false,
                message: "Nenosiri haliwezi kuwa chini ya herufi 6 kwa ajili ya usalama"
            }
        }
    })
});

export const registerData = t.Object({
    name: t.String({
        maxLength: 40,
        minLength: 3,
        error() {
            return {
                success: false,
                message: "Jina la Duka haliwezi kuwa chini ya herufi 3 na juu ya herufi 40"
            }
        }
    }),
    username: t.String({
        maxLength: 40,
        minLength: 3,
        error() {
            return {
                success: false,
                message: "Jina haliwezi kuwa chini ya herufi 3 na juu ya herufi 40"
            }
        }
    }),
    email: t.String({
        format: "email",
        error() {
            return {
                success: false,
                message: "Email/barua-pepe sio sahihi"
            }
        }
    }),
    password: t.String({
        maxLength: 40,
        minLength: 6,
        error() {
            return {
                success: false,
                message: "Nenosiri haliwezi kuwa chini ya herufi 6 na juu ya herufi 40"
            }
        }
    }),
    phoneNumber: t.String({
        maxLength: 15,
        minLength: 9,
        error() {
            return {
                success: false,
                message: "Namba ya simu sio sahihi"
            }
        }
    })
});

export const shopPutData = t.Object({
    email: t.String({
        format: "email",
        error() {
            return {
                success: false,
                message: "Email/barua-pepe sio sahihi"
            }
        }
    }),
    shopName: t.String({
        maxLength: 40,
        minLength: 3,
        error() {
            return {
                success: false,
                message: "Jina la duka haliwezi kuwa na herufi chini ya 3 au juu ya 40"
            }
        }
    })
});

export const changePasswordData = t.Object({
    currentPassword: t.String({
        maxLength: 40,
        minLength: 6,
        error() {
            return {
                success: false,
                message: "Nenosiri haliwezi kuwa na herufi chini ya 6 au juu ya 40"
            }
        }
    }),
    newPassword: t.String({
        maxLength: 40,
        minLength: 6,
        error() {
            return {
                success: false,
                message: "Nenosiri haliwezi kuwa na herufi chini ya 6 au juu ya 40"
            }
        }
    })
});

export const emailData = t.Object({
    email: t.String({
        format: "email",
        error() {
            return {
                success: false,
                message: "Email/barua-pepe sio sahihi"
            }
        }
    }),
    name: t.String({
        maxLength: 40,
        minLength: 3,
        error() {
            return {
                success: false,
                message: "Jina haliwezi kuwa na herufi chini ya 3 au juu ya 40"
            }
        }
    }),
    message: t.String({
        maxLength: 40,
        minLength: 3,
        error() {
            return {
                success: false,
                message: "Ujumbe hauwezi kuwa na herufi chini ya 5 au juu ya 40"
            }
        }
    })
});

export const authToken = t.Object({
    token: t.String({
        minLength: 3,
        error() {
            return {
                success: false,
                message: "Tokeni sio sahihi"
            }
        }
    })
})