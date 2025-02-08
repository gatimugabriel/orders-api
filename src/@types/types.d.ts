
//  JWT
type TokenObj = {
    userId: number | string;
    userName: string;
    email?: string;
    role?: string;
};

// auth context
export interface UserAuthPayload {
    userID: string;
    role: any;
}
