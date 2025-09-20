
// Backend service: workspace2/src/services/UserService.ts
export interface User {
    id: string
    name: string
    email: string
}

export class UserService {

    async getUser(id: string): Promise<User | null> {
        // Implementation
        return null
    }

    async createUser(user: Omit<User, 'id'>): Promise<User> {
        // Implementation
        return { id: '1', ...user }
    }

}

export default UserService
