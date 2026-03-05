export interface IAuth {
    identifier: string;
    password: string;
}

export interface IRegister {
    email: string;
    password: string;
    name: string;
    address: string;
    phoneNumber: string;
}