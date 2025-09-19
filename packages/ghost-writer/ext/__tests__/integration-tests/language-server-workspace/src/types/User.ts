
// User types
export interface User {
    id: string
    name: string
    email: string
    profile: {
        avatar?: string
        bio?: string
        preferences: {
            theme: 'light' | 'dark'
            notifications: boolean
        }
    }
}

export interface CreateUserRequest {
    name: string
    email: string
    profile?: Partial<User['profile']>
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
    id: string
}
