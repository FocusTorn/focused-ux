// User profile component
import React from 'react'
import type { User } from '../types/User'

interface UserProfileProps {
    user: User
    onUpdate: (user: User) => void
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
    const handleNameChange = (newName: string) => {
        onUpdate({
            ...user,
            name: newName
        })
    }

    return (
        <div className="user-profile">
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            {user.profile.avatar && (
                <img src={user.profile.avatar} alt="Avatar" />
            )}
            {user.profile.bio && (
                <p>{user.profile.bio}</p>
            )}
        </div>
    )
}

export default UserProfile
